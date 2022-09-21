import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import pug from 'pug';
import path from 'path';
import findKey from 'lodash/findKey';
import isEmpty from 'lodash/isEmpty';
import moment from 'moment';
import sharp from 'sharp';

import supabase from "../../lib/supabase";

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const authHeader = req.headers.authorization || '';

    const bearerToken = `${authHeader.replace('Bearer ', '')}`;

    const { user, error: authError } = await supabase.auth.api.getUser(bearerToken);

    if (authError) return res.status(401).json({ error: authError.message });

    supabase.auth.session = () => ({
      access_token: bearerToken,
      token_type: "",
      user,
    });

    const body = req.body;

    if (isEmpty(body)) {
      return res.status(500).json({ error: 'Empty body not allowed' });
    }

    const { user_uuid } = body;

    if (!user_uuid) {
      return res.status(500).json({ error: 'Missing user_uuid in request body' });
    }

    const { data: registeredUser, error: selectError } = await supabase.from('registered-users').select('*, event:events(*)').eq('uuid', user_uuid).single();

    if (selectError) {
      return res.status(500).json({ error: selectError.message });
    }

    const issued_at = moment().toISOString();

    const event = registeredUser.event;

    const paymentConfig = event.payment_config || {};

    const userAgeMapping = findKey(paymentConfig.age_mapping, (ages) => {
      const { from: ageFrom, to: ageTo } = ages;
      return (registeredUser.age >= ageFrom && registeredUser.age <= ageTo)
    });

    const { bucket, key, config } = event.ticket_template[userAgeMapping] || {};

    const { data: ticketTemplate, error: downloadError } = await supabase.storage.from(bucket).download(key);

    if (downloadError) {
      return res.status(500).json({ error: downloadError.message });
    }

    const ticketTemplateBuffer = Buffer.from( await ticketTemplate.arrayBuffer() );

    const qrCodeInfo = JSON.stringify({
      user_uuid,
      issued_at,
    });

    const qrCodeOptions = {};

    if (config.position) {
      qrCodeOptions.width = config.position?.w;
    }

    if (config.colour) {
      qrCodeOptions.color = {
        light: config.colour?.light?.hex,
        dark: config.colour?.dark?.hex
      }
    }

    await QRCode.toFile('/tmp/qrcode.png', qrCodeInfo, qrCodeOptions);

    const qrCodeImg = await sharp(ticketTemplateBuffer).composite([
      { input: '/tmp/qrcode.png', top: Math.ceil(config.position?.y || 0), left: Math.ceil(config.position?.x || 0) },
    ]).toBuffer().then(buffer => {
      return buffer.toString('base64');
    });

    const eventTicketPugPath = path.join(process.cwd(), 'assets/email-templates/event-ticket.pug');
 
    const compileEventTicket = pug.compileFile(eventTicketPugPath);

    const ticketHtml = compileEventTicket({
      pageTitle: `${event.host} - ${event.name}`,
      eventHost: event.host,
      eventName: event.name,
      startTime: moment(event.start_date).format('LLLL'),
      eventVenue: event.venue,
    });

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'techteam@reformationlifecentre.org',
        pass: process.env.EMAIL_PASS,
      },
    });
  
    await transporter.sendMail({
      from: '"Reformation Life Centre" <techteam@reformationlifecentre.org>', // sender address
      to: registeredUser.email, // list of receivers
      subject: `Ticket for: ${event.name}`, // Subject line
      html: ticketHtml, // html body
      attachments: [
        {
          filename: 'Ticket.png',
          content: qrCodeImg,
          encoding: 'base64',
        },
      ],
    }).then(info => {
      console.log({info});
    }).catch(console.error);

    const { data: updatedUser, error: updateError } = await supabase.from('registered-users').update({
      ticket_issued: true,
      updated_on: issued_at,
    }).eq('uuid', user_uuid).single();

    if (updateError) return res.status(500).json({ error: updateError.message });

    return res.status(200).json({ message: 'Successfully issued the ticket', user: updatedUser });
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
};
