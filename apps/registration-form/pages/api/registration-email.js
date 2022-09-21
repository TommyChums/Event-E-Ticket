import nodemailer from 'nodemailer';
import pug from 'pug';
import path from 'path';
import findKey from 'lodash/findKey';
import moment from 'moment';

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

    const registrationPugPath = path.join(process.cwd(), 'assets/email-templates/registration.pug');
 
    const compileRegistration = pug.compileFile(registrationPugPath);

    const ticketHtml = compileRegistration({
      eventName: event.name,
      firstName: registeredUser.first_name,
      startTime: moment(event.start_date).format('LLLL'),
      ticketPrice: userPrice,
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
