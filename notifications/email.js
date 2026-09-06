// Envoie une notification par email via SMTP (nodemailer).
// Si les variables SMTP_* ne sont pas configurées, ignore silencieusement.

const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  return transporter;
}

async function sendEmailAlert({ toEmail, marketHashName, targetPrice, direction, currentPrice, itemPage }) {
  const t = getTransporter();

  if (!t) {
    console.warn('SMTP non configuré, notification email ignorée.');
    return;
  }

  const directionText = direction === 'below' ? 'est passé sous' : 'a dépassé';
  const linkHtml = itemPage ? `<p><a href="${itemPage}">Voir l'offre la moins chère sur Skinport</a></p>` : '';
  const linkText = itemPage ? `\nVoir l'offre : ${itemPage}` : '';

  try {
    await t.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: toEmail,
      subject: `Alerte prix : ${marketHashName}`,
      text: `${marketHashName} ${directionText} ${targetPrice}€. Prix actuel : ${currentPrice.toFixed(2)}€.${linkText}`,
      html: `
        <h2>Alerte de prix déclenchée</h2>
        <p><strong>${marketHashName}</strong> ${directionText} <strong>${targetPrice}€</strong></p>
        <p>Prix actuel : <strong>${currentPrice.toFixed(2)}€</strong></p>
        ${linkHtml}
      `
    });
  } catch (err) {
    console.error('Erreur lors de l\'envoi de l\'email :', err.message);
  }
}

module.exports = sendEmailAlert;
