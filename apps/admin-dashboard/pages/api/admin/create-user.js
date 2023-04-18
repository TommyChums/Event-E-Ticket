import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'
import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import path from 'path';
import fs from 'fs';
import isEmpty from 'lodash/isEmpty';
import canUseAdminApi from '../../../lib/api/canUseAdminApi';

const auththenticatedSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
);

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
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !session.user || !canUseAdminApi(session.user)) {
      return res.status(401).json({ error: authError.message });
    }

    const body = req.body;

    if (isEmpty(body)) {
      return res.status(500).json({ error: 'Empty body not allowed' });
    }

    const { attributes } = body;

    if (!attributes) {
      return res.status(500).json({ error: 'Missing attributes in request body' });
    }

    attributes.email_confirm = true;
    attributes.password = 'P@ssword1';
    attributes.user_metadata.temp_password = true;
    
    const { data: { user }, error } = await auththenticatedSupabase.auth.admin.createUser(attributes);

    if (error) {
      return res.status(500).json({ error: 'Error creating the user' });
    }

    const invitationUrl = `https://admin.events.reformationlifecentre.org/login?username=${user.email}`;

    const { data: { publicUrl: rlcLogo } } = supabase.storage.from('church-assets').getPublicUrl('logo.png');

    const [
      calendarIcon,
      locationIcon,
      facebookIcon,
      youtubeIcon
    ] = [
      getImgUrl('calendar', '#673ab7'),
      getImgUrl('location', '#673ab7'),
      getImgUrl('facebook', '#673ab7'),
      getImgUrl('youtube', '#673ab7')
    ];

    const dashboardInvitationHtml = fs.readFileSync(
      path.join(process.cwd(), 'assets/email-templates/dashboard-invitation.html')
    ).toString();

    const compileDashboardInvitation = Handlebars.compile(dashboardInvitationHtml);

    const invitationHtml = compileDashboardInvitation({
      replySubject: `Event Dashboard Invitation`,
      tempPassword: 'P@ssword1',
      firstName: attributes.user_metadata.first_name,
      invitationUrl,
      rlcLogo,
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
        to: attributes.email,
        // Subject line
        subject: `Event Dashboard Invitation`,
        // html body
        html: invitationHtml
      }).then((info) => {
        console.log(JSON.stringify({ info }));
      }).catch((e) => {
        throw e;
      });
    } catch (e) {
      console.error(e);

      return res.status(500).json({ error: e.message });
    }

    return res.status(200).json({ message: 'Successfully created the user', user });
  } else {
    return res.status(405).json({ message: 'Method not allowed' });
  }
};
