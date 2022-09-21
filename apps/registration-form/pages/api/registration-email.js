import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';
import nodemailer from 'nodemailer';
import { decode } from 'base64-arraybuffer';
import sharp from 'sharp';
import Handlebars from 'handlebars';
import path from 'path';
import findKey from 'lodash/findKey';
import moment from 'moment';
import fs from 'fs';

import supabase from "../../lib/supabase";

const auththenticatedSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

function locationImgUrl(placeId) {
  const { publicURL } = supabase.storage.from('church-assets').getPublicUrl(`location-images/${placeId}/location.png`);

  return publicURL;
};

async function getVenueImgUrl(placeId, geocode) {
  if (!placeId) return '';

  const { data: locationImgFile } = await supabase.storage.from('church-assets').list(`location-images/${placeId}`, {
    limit: 1,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
    search: 'location.png',
  });

  if (locationImgFile.length) {
    return locationImgUrl(placeId);
  }

  const res = await fetch(`https://maps.googleapis.com/maps/api/staticmap?zoom=14&size=400x400&key=${process.env.MAPS_API_KEY}&markers=|${geocode}`);

  const locationImgArrayBuffer = await res.arrayBuffer();

  await auththenticatedSupabase.storage.from('church-assets').upload(`location-images/${placeId}/location.png`, locationImgArrayBuffer, { contentType: 'image/png', upsert: true });

  return locationImgUrl(placeId);
}

function svgImgUrl(svgName, primaryColour) {
  const { publicURL } = supabase.storage.from('church-assets').getPublicUrl(`email-images/${primaryColour}/${svgName}.png`);

  return publicURL;
};

async function getImgUrl(svgName, primaryColour) {
  const colourFolder = primaryColour.replace('#', '');

  const { data: colourSvgFile } = await supabase.storage.from('church-assets').list(`email-images/${colourFolder}`, {
    limit: 1,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' },
    search: `${svgName}.png`,
  });

  if (colourSvgFile.length) {
    return svgImgUrl(svgName, colourFolder);
  }

  const svgData = fs.readFileSync(path.join(process.cwd(), `assets/svg-images/${svgName}.svg`)).toString();

  const svgString = Handlebars.compile(svgData)({ primaryColour });

  const svgImgArrayBuffer = await sharp(
    Buffer.from(svgString)
  ).ensureAlpha(0)
   .png()
   .toBuffer()
   .then((img) => decode(img.toString('base64')));

  await auththenticatedSupabase.storage.from('church-assets').upload(`email-images/${colourFolder}/${svgName}.png`, svgImgArrayBuffer, { contentType: 'image/png', upsert: true });

  return svgImgUrl(svgName, colourFolder);
}

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

    // TODO: Get from event itself
    const primaryColour = '#ecc721';

    const { publicURL: logoUrl } = supabase.storage.from(event.logo?.bucket).getPublicUrl(event.logo?.key);
    
    const { publicURL: rlcLogo } = supabase.storage.from('church-assets').getPublicUrl('logo.png');

    const [ calendarIcon, locationIcon, facebookIcon, youtubeIcon, eventVenueLocationImg ] = await Promise.all([
      getImgUrl('calendar', primaryColour),
      getImgUrl('location', primaryColour),
      getImgUrl('facebook', primaryColour),
      getImgUrl('youtube', primaryColour),
      getVenueImgUrl(event.venue?.place_id, event.venue?.geocode),
    ]);

    const registrationPugPath = fs.readFileSync(path.join(process.cwd(), 'assets/email-templates/registration.html')).toString();
 
    // const compileRegistration = pug.compileFile(registrationPugPath);
    const compileRegistration = Handlebars.compile(registrationPugPath);

    const ticketHtml = compileRegistration({
      eventTitle: event.name?.toUpperCase(),
      userFirstName: registeredUser.first_name,
      eventStartTime: moment(event.start_date).utcOffset(-4).format('LLLL') + " AST",
      ticketPrice: userPrice,
      eventVenueAddress: event.venue.address,
      registrationNumber: registeredUser.registration_number,
      replySubject: `Event Registration: ${event.name}`,
      eventVenueGoogleLink: `https://www.google.com/maps/search/?api=1&query=${event.venue?.address}&query_place_id=${event.venue?.place_id}`,
      eventVenueLocationImg,
      logoUrl,
      rlcLogo,
      primaryColour,
      calendarIcon,
      locationIcon,
      facebookIcon,
      youtubeIcon,
    });

    fs.writeFileSync('email.html', ticketHtml);

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
