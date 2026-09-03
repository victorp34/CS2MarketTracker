const pool = require('../db');
const sendDiscordAlert = require('./discord');
const sendEmailAlert = require('./email');

// Vérifie les alertes actives pour un skin donné, par rapport au prix moyen du jour.
// Si le seuil est franchi : envoie les notifications (Discord + email) et désactive l'alerte.
async function checkAlertsForSkin(skinId, marketHashName, currentPrice) {
  if (currentPrice === null || currentPrice === undefined) {
    return; // pas de vente aujourd'hui, rien à comparer
  }

  const { rows: alerts } = await pool.query(
    `SELECT a.id, a.target_price, a.direction, u.email
     FROM alerts a
     JOIN users u ON u.id = a.user_id
     WHERE a.skin_id = $1 AND a.is_active = true`,
    [skinId]
  );

  for (const alert of alerts) {
    const targetPrice = Number(alert.target_price);
    const triggered =
      (alert.direction === 'below' && currentPrice < targetPrice) ||
      (alert.direction === 'above' && currentPrice > targetPrice);

    if (!triggered) continue;

    console.log(`Alerte déclenchée : ${marketHashName} ${alert.direction} ${targetPrice}€ (actuel: ${currentPrice}€)`);

    await Promise.all([
      sendDiscordAlert({ marketHashName, targetPrice, direction: alert.direction, currentPrice }),
      sendEmailAlert({ toEmail: alert.email, marketHashName, targetPrice, direction: alert.direction, currentPrice })
    ]);

    // Désactive l'alerte et marque le déclenchement comme "non vu"
    // (le frontend l'affichera une fois puis le marquera comme vu)
    await pool.query(
      'UPDATE alerts SET is_active = false, triggered = true, triggered_unseen = true WHERE id = $1',
      [alert.id]
    );
  }
}

module.exports = checkAlertsForSkin;
