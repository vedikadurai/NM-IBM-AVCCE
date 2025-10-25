const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
});

async function sendMail(to, subject, html) {
  if (!process.env.SMTP_USER) {
    console.log('Mail not sent (SMTP not configured). To:', to, 'subject:', subject);
    return;
  }
  const info = await transporter.sendMail({ from: process.env.EMAIL_FROM, to, subject, html });
  return info;
}

module.exports = { sendMail };
