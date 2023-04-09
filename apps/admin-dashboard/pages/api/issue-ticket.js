import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import path from 'path';
import findKey from 'lodash/findKey';
import isEmpty from 'lodash/isEmpty';
import moment from 'moment';
import sharp from 'sharp';
import fs from 'fs';

import supabase from '../../lib/supabase';

function svgImgUrl(svgName, primaryColour) {
  const { publicURL } = supabase.storage.from('church-assets')
    .getPublicUrl(`email-images/${primaryColour}/${svgName}.png`);

  return publicURL;
};

function getImgUrl(svgName, primaryColour) {
  const colourFolder = primaryColour.replace('#', '');
  return svgImgUrl(svgName, colourFolder);
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization || '';

    const bearerToken = `${authHeader.replace('Bearer ', '')}`;

    const { user, error: authError } = await supabase.auth.api.getUser(bearerToken);

    if (authError) {
      return res.status(401).json({ error: authError.message });
    }

    supabase.auth.session = () => ({
      access_token: bearerToken,
      token_type: '',
      user
    });

    const body = req.body;

    if (isEmpty(body)) {
      return res.status(500).json({ error: 'Empty body not allowed' });
    }

    const { user_uuid } = body;

    if (!user_uuid) {
      return res.status(500).json({ error: 'Missing user_uuid in request body' });
    }

    const { data: registeredUser, error: selectError } = await supabase.from('registered-users')
      .select('*, event:events(*)').eq('uuid', user_uuid).single();

    if (selectError) {
      return res.status(500).json({ error: selectError.message });
    }

    const issued_at = moment().toISOString();

    const event = registeredUser.event;

    const paymentConfig = event.payment_config || {};

    const userAgeMapping = findKey(paymentConfig.age_mapping, (ages) => {
      const { from: ageFrom, to: ageTo } = ages;
      return registeredUser.age >= ageFrom && registeredUser.age <= ageTo;
    });

    const { bucket, key, config } = event.ticket_template[userAgeMapping] || {};

    const { data: ticketTemplate, error: downloadError } = await supabase.storage.from(bucket).download(key);

    if (downloadError) {
      return res.status(500).json({ error: downloadError.message });
    }

    const ticketTemplateBuffer = Buffer.from( await ticketTemplate.arrayBuffer() );

    const { count } = await supabase.from('registered-users')
      .select(undefined, { count: 'exact', head: true })
      .eq('ticket_issued', true)
      .eq('registered_event', event.uuid);

    let ticketNumber = (count + 1).toString();

    while (ticketNumber.length < 4) {
      ticketNumber = `0${ticketNumber}`;
    }

    await sharp({
      text: {
        // eslint-disable-next-line max-len
        text: `<span size="42pt" weight="bold" foreground="${config.colour?.dark?.hex}">${ticketNumber}</span>`,
        width: config.position?.number?.w,
        height: config.position?.number?.h,
        rgba: true
      }
    }).toFile('/tmp/number.png');

    const qrCodeInfo = `${registeredUser.registration_number}-${ticketNumber}`;

    const qrCodeOptions = {};

    if (config.position) {
      qrCodeOptions.width = config.position?.qrcode?.w;
    }

    if (config.colour) {
      qrCodeOptions.color = {
        light: config.colour?.light?.hex,
        dark: config.colour?.dark?.hex
      };
    }

    await QRCode.toFile('/tmp/qrcode.png', qrCodeInfo, qrCodeOptions);

    const qrCodeImg = await sharp(ticketTemplateBuffer).composite([
      {
        input: '/tmp/qrcode.png',
        top: Math.ceil(config.position?.qrcode?.y || 0),
        left: Math.ceil(config.position?.qrcode?.x || 0)
      },
      {
        input: '/tmp/number.png',
        top: Math.ceil(config.position?.number?.y || 0),
        left: Math.ceil(config.position?.number?.x || 0)
      }
    ]).toBuffer().then((buffer) => buffer.toString('base64'));

    const primaryColour = event.branding?.primary_colour?.hex || '#020648';

    const { publicURL: logoUrl } = supabase.storage.from(event.logo?.bucket).getPublicUrl(event.logo?.key);

    const { publicURL: rlcLogo } = supabase.storage.from('church-assets').getPublicUrl('logo.png');

    const { publicURL: seeYouThereImage } = supabase.storage.from('church-assets')
      .getPublicUrl('email-images/see-you-there.png');

    const [
      calendarIcon,
      locationIcon,
      facebookIcon,
      youtubeIcon
    ] = [
      getImgUrl('calendar', primaryColour),
      getImgUrl('location', primaryColour),
      getImgUrl('facebook', primaryColour),
      getImgUrl('youtube', primaryColour)
    ];

    const eventTicketHtmlPath = fs.readFileSync(
      path.join(process.cwd(), 'assets/email-templates/event-ticket.html')
    ).toString();

    const compileEventTicket = Handlebars.compile(eventTicketHtmlPath);

    const ticketHtml = compileEventTicket({
      eventTitle: event.name?.toUpperCase(),
      userFirstName: registeredUser.first_name,
      registrationNumber: registeredUser.registration_number,
      replySubject: `Event Ticket: ${event.name}`,
      seeYouThereImage,
      logoUrl,
      rlcLogo,
      primaryColour,
      calendarIcon,
      locationIcon,
      facebookIcon,
      youtubeIcon
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'techteam@reformationlifecentre.org',
        pass: process.env.EMAIL_PASS
      }
    });

    try {
      await transporter.sendMail({
        // sender address
        from: '"Reformation Life Centre" <techteam@reformationlifecentre.org>',
        // list of receivers
        to: registeredUser.email,
        // Subject line
        subject: `Ticket for: ${event.name}`,
        // html body
        html: ticketHtml,
        attachments: [
          {
            filename: 'Ticket.png',
            content: qrCodeImg,
            encoding: 'base64'
          }
        ]
      }).then((info) => {
        console.log(JSON.stringify({ info }));
      }).catch((e) => {
        throw e;
      });
    } catch (e) {
      console.error(e);

      return res.status(500).json({ error: e.message });
    }

    const { data: updatedUser, error: updateError } = await supabase.from('registered-users').update({
      ticket_number: ticketNumber,
      ticket_issued: true,
      updated_on: issued_at
    }).eq('uuid', user_uuid).single();

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({ message: 'Successfully issued the ticket', user: updatedUser });
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
};
