import nodemailer from 'nodemailer';
import pug from 'pug';
import Handlebars from 'handlebars';
import path from 'path';
import findKey from 'lodash/findKey';
import moment from 'moment';
import fs from 'fs';

import supabase from "../../lib/supabase";

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const query = req.query;

    const { user_uuid } = query;

    if (!user_uuid) {
      return res.status(500).json({ error: 'Missing user_uuid in request query' });
    }

    const { data: registeredUser, error: selectError } = await supabase.from('registered-users').select('*, event:events(*)').eq('uuid', user_uuid).single();

    if (selectError) {
      return res.status(500).json({ error: selectError.message });
    }

    const event = registeredUser.event;

    const paymentConfig = event.payment_config || {};
    const priceByAge = paymentConfig.price_by_age || {};

    const userAgeMapping = findKey(paymentConfig.age_mapping, (ages) => {
      const { from: ageFrom, to: ageTo } = ages;
      return (registeredUser.age >= ageFrom && registeredUser.age <= ageTo)
    });

    const userPrice = `$${priceByAge[userAgeMapping] || 0}`;

    const { publicURL: logoUrl } = supabase.storage.from(event.logo?.bucket).getPublicUrl(event.logo?.key);
    
    const { publicURL: rlcLogo } = supabase.storage.from('church-assets').getPublicUrl('logo.png');

    const registrationPugPath = fs.readFileSync(path.join(process.cwd(), 'assets/email-templates/registration.html')).toString();
 
    // const compileRegistration = pug.compileFile(registrationPugPath);
    const compileRegistration = Handlebars.compile(registrationPugPath);

    const ticketHtml = compileRegistration({
      eventTitle: event.name?.toUpperCase(),
      userFirstName: registeredUser.first_name,
      eventStartTime: moment(event.start_date).utcOffset(-4).format('LLLL') + " AST",
      ticketPrice: userPrice,
      eventVenueAddress: event.venue,
      registrationNumber: registeredUser.registration_number,
      replySubject: `Event Registration: ${event.name}`,
      logoUrl,
      rlcLogo,
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
      subject: 'Thank You for Registering', // Subject line
      html: ticketHtml, // html body
    }).then(info => {
      console.log({info});
    }).catch(console.error);

    return res.status(200).json({ message: `Successfully send email to ${registeredUser.email}` });
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
};
