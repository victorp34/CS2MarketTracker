// Rareté des items (renseignée par ingest-images.js depuis le dataset CSGO-API).
// `rarity` = tier normalisé, `rarity_name` = nom officiel anglais du tier.

const TIERS = new Set(['consumer', 'industrial', 'milspec', 'restricted', 'classified', 'covert', 'contraband']);

// Classes écrites en entier pour que Tailwind les détecte à la compilation
const DOT_CLASS = {
  consumer: 'bg-rarity-consumer',
  industrial: 'bg-rarity-industrial',
  milspec: 'bg-rarity-milspec',
  restricted: 'bg-rarity-restricted',
  classified: 'bg-rarity-classified',
  covert: 'bg-rarity-covert',
  contraband: 'bg-rarity-contraband'
};

// Noms des tiers tels qu'affichés par le client CS2 en français
const LABELS_FR = {
  'Consumer Grade': 'Qualité consommateur',
  'Industrial Grade': 'Qualité industrielle',
  'Mil-Spec Grade': 'Qualité militaire',
  Restricted: 'Prohibé',
  Classified: 'Classifié',
  Covert: 'Secret',
  Contraband: 'Contrebande',
  Extraordinary: 'Extraordinaire',
  'Base Grade': 'Qualité de base',
  'High Grade': 'Haute qualité',
  Remarkable: 'Remarquable',
  Exotic: 'Exotique',
  Distinguished: 'Distingué',
  Exceptional: 'Exceptionnel',
  Superior: 'Supérieur',
  Master: 'Maître'
};

const knownTier = (rarity) => (TIERS.has(rarity) ? rarity : null);

// Classe du liseré de carte : gris neutre quand la rareté est inconnue
export function rarityEdgeClass(rarity) {
  return `rarity-${knownTier(rarity) ?? 'unknown'}`;
}

export function rarityDotClass(rarity) {
  return DOT_CLASS[knownTier(rarity)] ?? 'bg-rarity-unknown';
}

export function rarityLabel(item) {
  if (!knownTier(item?.rarity) || !item.rarity_name) return null;
  return LABELS_FR[item.rarity_name] ?? item.rarity_name;
}

// Le liseré seul ne suffit pas (daltonisme, lecteurs d'écran) : le nom du tier
// est exposé en info-bulle et en texte pour les technologies d'assistance
export function rarityA11yProps(item) {
  const label = rarityLabel(item);
  return label ? { title: `Rareté : ${label}` } : {};
}
