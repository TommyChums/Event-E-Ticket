import nodemailer from 'nodemailer';

const sendEmail = async ({ subject, to, html, text, attachments }) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'techteam@reformationlifecentre.org',
      pass: process.env.EMAIL_PASS
    }
  });
  
  return await transporter.sendMail({
    from: '"Reformation Life Centre" <techteam@reformationlifecentre.org>',
    to,
    subject,
    html,
    text,
    attachments,
  }).then((info) => {
    console.log(JSON.stringify({ info }));
    return { data: info };
  }).catch((e) => {
    return { error: e.message };
  });
};

export default sendEmail;
