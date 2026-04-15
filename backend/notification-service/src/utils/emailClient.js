const nodemailer = require('nodemailer');

let transporter;
let cachedFrom = '';

const getTransporter = async () => {
  if (transporter) {
    return { transporter, from: cachedFrom };
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !EMAIL_FROM) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    cachedFrom = process.env.EMAIL_FALLBACK_FROM || 'Smart Healthcare <no-reply@smart-healthcare.local>';
    return { transporter, from: cachedFrom };
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: SMTP_SECURE === 'true',
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });
  cachedFrom = EMAIL_FROM;

  return { transporter, from: cachedFrom };
};

const sendEmail = async ({ to, subject, message }) => {
  const { transporter: client, from } = await getTransporter();

  const info = await client.sendMail({
    from,
    to,
    subject,
    text: message
  });

  return {
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info) || ''
  };
};

module.exports = {
  sendEmail
};
