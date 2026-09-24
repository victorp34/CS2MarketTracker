// Découpe un market_hash_name Skinport en nom de base et variante, pour que l'usure
// (seule différence entre les lignes d'une même famille) ne soit jamais tronquée.
// "StatTrak™ AK-47 | Redline (Field-Tested)" -> { base: "AK-47 | Redline", wear: "Field-Tested", variant: "StatTrak™" }
// Les noms restent en anglais : c'est la langue du catalogue, et celle que les joueurs cherchent.

const WEARS = ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred'];
const WEAR_SUFFIX = new RegExp(`\\s*\\((${WEARS.join('|')})\\)$`);

export function parseItemName(name) {
  let base = name;
  let wear = null;
  let variant = null;

  const wearMatch = base.match(WEAR_SUFFIX);
  if (wearMatch) {
    wear = wearMatch[1];
    base = base.slice(0, wearMatch.index);
  }
  if (base.includes('StatTrak™ ')) {
    variant = 'StatTrak™';
    base = base.replace('StatTrak™ ', '');
  } else if (base.startsWith('Souvenir ')) {
    variant = 'Souvenir';
    base = base.slice('Souvenir '.length);
  }
  return { base, wear, variant };
}

// Ligne secondaire : "StatTrak™ · Field-Tested", dans l'ordre du nom réel (vide pour un item sans usure ni variante)
export function itemVariantLabel({ wear, variant }) {
  return [variant, wear].filter(Boolean).join(' · ');
}
