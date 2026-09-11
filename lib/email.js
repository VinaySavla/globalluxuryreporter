import 'server-only';
import nodemailer from 'nodemailer';

let transporter;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}

function mailer() {
  if (transporter) return transporter;
  if (!process.env.SMTP_HOST) {
    if (process.env.NODE_ENV === 'production') throw Object.assign(new Error('SMTP is not configured'), { status: 503 });
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } : undefined
  });
  return transporter;
}

async function send(message) {
  const transport = mailer();
  if (!transport) {
    console.info('Development email:', message.subject, message.text);
    return;
  }
  await transport.sendMail({
    from: process.env.EMAIL_FROM || 'Global Luxury Reporter <no-reply@readglr.com>',
    ...message
  });
}

export function sendConfirmationEmail(email, confirmUrl) {
  const safeUrl = escapeHtml(confirmUrl);
  return send({
    to: email,
    subject: 'Confirm your GLR email registration',
    text: `Confirm your registration: ${confirmUrl}\n\nIf you did not request this, ignore this email.`,
    html: `<p>Confirm your registration for Global Luxury Reporter:</p><p><a href="${safeUrl}">Confirm email</a></p><p>If you did not request this, ignore this email.</p>`
  });
}

export function sendWelcomeEmail(email, unsubscribeUrl) {
  const safeUrl = escapeHtml(unsubscribeUrl);
  return send({
    to: email,
    subject: 'Welcome to Global Luxury Reporter',
    text: `Your email is confirmed. You can unsubscribe at any time: ${unsubscribeUrl}`,
    html: `<p>Your email is confirmed. Welcome to Global Luxury Reporter.</p><p><a href="${safeUrl}">Unsubscribe</a> at any time.</p>`
  });
}
