import QRCode from 'qrcode';
import nodemailer from 'nodemailer';
import pug from 'pug';
import path from 'path';
import isEmpty from 'lodash/isEmpty';
import moment from 'moment';
import sharp from 'sharp';
import fs from 'fs';

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

    const { bucket, key, config } = event.ticket_template || {};

    const { data: ticketTemplate, error: downloadError } = await supabase.storage.from(bucket).download(key);

    console.log(bucket, key)

    if (downloadError) {
      return res.status(500).json({ error: downloadError.message });
    }

    const buffer = Buffer.from( await ticketTemplate.arrayBuffer() );

    fs.writeFileSync('template.png', buffer);

    const qrCodeInfo = JSON.stringify({
      user_uuid,
      issued_at,
    });

    const qrCodeOptions = {};

    if (config.w) {
      qrCodeOptions.width = config.w;
    }

    await QRCode.toFile('qrcode.png', qrCodeInfo, qrCodeOptions);

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'techteam@reformationlifecentre.org',
        pass: 'bsaxpzkffwvzihnz',
      },
    });

    const qrCodeImg = await sharp('template.png').composite([
      { input: 'qrcode.png', top: config.y, left: config.x },
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
      imgSrc: qrCodeImg,
    });

    console.log(ticketHtml)

    await transporter.sendMail({
      from: '"Reformation Life Centre" <techteam@reformationlifecentre.org>', // sender address
      to: registeredUser.email, // list of receivers
      subject: `Ticket for: ${event.name}`, // Subject line
      html: ticketHtml, // html body
    }).then(info => {
      console.log({info});
    }).catch(console.error);

    const { error: updateError } = await supabase.from('registered-users').update({
      ticket_issued: true,
      updated_on: issued_at,
    }).eq('uuid', user_uuid);

    if (updateError) return res.status(500).json({ error: updateError.message });

    return res.status(200).json({ message: 'Successfully issued the ticket' });
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
};
