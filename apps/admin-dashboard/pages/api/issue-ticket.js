import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import path from 'path';
import isEmpty from 'lodash/isEmpty';
import moment from 'moment';
import fs from 'fs';
import generateTicketImage from '../../lib/api/generateTicketImage';

export default async function handler(req, res) {
  const supabase = createServerSupabaseClient({ req, res });

  function svgImgUrl(svgName, primaryColour) {
    const { data: { publicUrl } } = supabase.storage.from('church-assets')
      .getPublicUrl(`email-images/${primaryColour}/${svgName}.png`);
  
    return publicUrl;
  };
  
  function getImgUrl(svgName, primaryColour) {
    const colourFolder = primaryColour.replace('#', '');
    return svgImgUrl(svgName, colourFolder);
  }

  if (req.method === 'POST') {
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (!session || !session.user) {
      return res.status(401).json({ error: authError.message });
    }

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

    const eTicket = !isEmpty(event.ticket_template);

    const { ticket: qrCodeImg, ticketNumber } = await generateTicketImage(registeredUser, supabase, true);

    if (eTicket) {
      const primaryColour = event.branding?.primary_colour?.hex || '#020648';
  
      const { data: { publicUrl: logoUrl } } = supabase.storage.from(event.logo?.bucket).getPublicUrl(event.logo?.key);
  
      const { data: { publicUrl: rlcLogo } } = supabase.storage.from('church-assets').getPublicUrl('logo.png');
  
      const { data: { publicUrl: seeYouThereImage } } = supabase.storage.from('church-assets')
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
    }

    const { data: updatedUser, error: updateError } = await supabase.from('registered-users').update({
      ticket_number: ticketNumber,
      ticket_issued: true,
      updated_on: issued_at
    }).eq('uuid', user_uuid).select().single();

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({ message: 'Successfully issued the ticket', user: updatedUser });
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
};
