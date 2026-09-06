// Envoie une notification via un webhook Discord.
// Si DISCORD_WEBHOOK_URL n'est pas configuré, ignore silencieusement (log un warning une fois).

async function sendDiscordAlert({ marketHashName, targetPrice, direction, currentPrice, itemPage }) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('DISCORD_WEBHOOK_URL non configuré, notification Discord ignorée.');
    return;
  }

  const directionText = direction === 'below' ? 'est passé sous' : 'a dépassé';

  const embed = {
    title: '🔔 Alerte de prix déclenchée',
    description: `**${marketHashName}** ${directionText} ${targetPrice}€`,
    color: direction === 'below' ? 0x4ade80 : 0xe0473e,
    fields: [
      { name: 'Prix actuel', value: `${currentPrice.toFixed(2)}€`, inline: true },
      { name: 'Seuil', value: `${targetPrice}€`, inline: true }
    ],
    timestamp: new Date().toISOString()
  };

  if (itemPage) {
    embed.url = itemPage; // rend le titre de l'embed cliquable
    embed.fields.push({ name: 'Lien', value: `[Voir l'offre la moins chère](${itemPage})` });
  }

  const payload = { embeds: [embed] };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`Échec de l'envoi Discord : statut ${response.status}`);
    }
  } catch (err) {
    console.error('Erreur lors de l\'envoi Discord :', err.message);
  }
}

module.exports = sendDiscordAlert;
