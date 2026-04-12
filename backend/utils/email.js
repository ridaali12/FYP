const nodemailer = require('nodemailer');

/**
 * Creates and returns a nodemailer transporter using environment variables.
 * Falls back to console logging if credentials are not provided.
 */
function createTransporter() {
  const emailUser = process.env.SMTP_USER || process.env.EMAIL_USER;
  const emailPass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  const config = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  };

  if (!emailUser || !emailPass) {
    console.warn('Warning: Email transporter not fully configured. Emails will be logged to console.');
    return null;
  }

  return nodemailer.createTransport(config);
}

/**
 * Sends an email using the configured transporter or logs to console if transporter is null.
 * @param {string} to
 * @param {string} subject
 * @param {string} html
 * @param {string} text
 */
async function sendEmail(to, subject, html, text) {
  const transporter = createTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@wildlifeapp.com';

  const mailOptions = {
    from,
    to,
    subject,
    html,
    text,
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`📧 Email sent to ${to}: ${info.messageId}`);
    } catch (err) {
      console.error('Error sending email:', err);
    }
  } else {
    console.log('\n==== EMAIL (not sent) ===');
    console.log('To:', to);
    console.log('Subject:', subject);
    console.log('Text:', text);
    console.log('HTML:', html);
    console.log('========================\n');
  }
}

module.exports = { createTransporter, sendEmail };
