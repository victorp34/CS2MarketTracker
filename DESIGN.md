---
name: CS2 Market Tracker
description: Prix, historique et alertes sur tout le catalogue de skins CS2, en relevé de marché sombre aux codes de rareté du jeu.
colors:
  graphite-base: "#14161a"
  graphite-surface: "#1c1f26"
  graphite-hover: "#242832"
  steel-border: "#2a2e38"
  ash-muted: "#8a8f9c"
  bone-white: "#ffffff"
  covert-red: "#e0473e"
  covert-red-text: "#ec6259"
  covert-red-fill: "#c83a31"
  covert-red-fill-hover: "#b8352d"
  contraband-gold: "#d4af37"
  gain-green: "#4ade80"
  rarity-consumer: "#b0c3d9"
  rarity-industrial: "#5e98d9"
  rarity-milspec: "#4b69ff"
  rarity-restricted: "#8847ff"
  rarity-classified: "#d32ce6"
  rarity-covert: "#eb4b4b"
  rarity-contraband: "#e4ae39"
  rarity-unknown: "#3a3f4b"
typography:
  display:
    fontFamily: "Rajdhani, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: "2.25rem"
  headline:
    fontFamily: "Rajdhani, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: "1.75rem"
  title:
    fontFamily: "Rajdhani, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: "1.5rem"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
  label:
    fontFamily: "Rajdhani, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: "1rem"
    letterSpacing: "0.025em"
  data:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: "1.25rem"
rounded:
  sm: "4px"
  md: "8px"
  full: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  2xl: "32px"
  3xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.covert-red-fill}"
    textColor: "{colors.bone-white}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.covert-red-fill-hover}"
  button-secondary:
    backgroundColor: "{colors.graphite-surface}"
    textColor: "{colors.bone-white}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  button-secondary-hover:
    backgroundColor: "{colors.graphite-hover}"
  input-field:
    backgroundColor: "{colors.graphite-base}"
    textColor: "{colors.bone-white}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
  rarity-card:
    backgroundColor: "{colors.graphite-surface}"
    textColor: "{colors.bone-white}"
    rounded: "{rounded.md}"
    padding: "16px 16px 16px 20px"
  rarity-card-hover:
    backgroundColor: "{colors.graphite-hover}"
  status-badge:
    typography: "{typography.label}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  switch:
    backgroundColor: "{colors.covert-red}"
    rounded: "{rounded.full}"
    width: "40px"
    height: "24px"
  navbar:
    backgroundColor: "{colors.graphite-surface}"
    padding: "16px 24px"
---

# Design System: CS2 Market Tracker

## Overview

**Creative North Star: "Le Relevé de marché"**

Le système se lit comme un relevé : un fond graphite presque noir, des chiffres en police mono, et très peu de couleur. Les deux couleurs d'accent viennent directement des tiers de rareté de CS2 (rouge Covert, or Contrebande). Elles ne servent pas à décorer : chacune signale quelque chose, qu'il s'agisse d'une baisse, d'une action, d'un prix minimum ou d'une solution. Un joueur les reconnaît sans explication. Quelqu'un qui ne joue pas voit simplement un outil de données sobre qui assume ses choix.

La densité reste modérée. Une seule colonne centrée, des listes de cartes empilées et des sections annoncées par de petits labels en capitales. Les titres en Rajdhani, condensée et anguleuse, apportent le côté « jeu ». Inter porte la lecture et JetBrains Mono porte chaque prix, pourcentage ou plage. L'interface est plate et la profondeur passe par trois paliers de gris. Le seul élément récurrent est le liseré sur le bord gauche des cartes. Sur une carte d'item, il porte la vraie rareté de l'item, dans la couleur officielle de son tier : un joueur lit la liste comme son inventaire. Le dégradé or → rouge ne sert plus que de sceau de marque sur les cartes sans item.

Les composants sont nets et tactiques : petits rayons, labels de bouton en capitales espacées, contrastes francs, et des transitions limitées aux couleurs.

**Key Characteristics:**
- Fond graphite en trois paliers tonals, sans ombres portées
- Deux accents issus des raretés CS2, employés comme signaux
- Tout chiffre (prix, %, date courte, plage) en JetBrains Mono
- Titres et labels en Rajdhani ; labels et boutons en capitales espacées
- Liseré de rareté : la couleur officielle du tier de l'item, le dégradé or → rouge en repli de marque
- Une colonne centrée (64rem max), contenu empilé

## Colors

Une palette graphite à dominante froide, que deux accents de rareté traversent comme des signaux.

### Primary
- **Rouge Covert Texte** (covert-red-text) : la variante éclaircie du Rouge Covert, réservée au petit texte (pourcentages de baisse, label « Plus fortes baisses », sur-titre des toasts, anneau de focus). Elle atteint 5,1:1 sur Graphite Surface là où le Rouge Covert plafonne à 4,0:1.
- **Rouge Covert Aplat** (covert-red-fill, survol covert-red-fill-hover) : la variante assombrie, réservée aux aplats qui portent du texte blanc, c'est-à-dire le bouton primaire. Le blanc y atteint 5,1:1 (5,9:1 au survol), là où le Rouge Covert plafonne à 4,1:1.
- **Rouge Covert** (covert-red) : c'est la couleur d'action et de signal négatif. On la trouve sur le bouton principal, l'interrupteur actif, l'anneau de focus (à 50 %), les pourcentages de baisse, le badge « Déclenchée », les erreurs, la courbe du prix minimum, le mot « MARKET » du logo, et la sélection de texte (à 30 %). Elle reprend le tier Covert, le plus élevé des skins d'armes.

### Secondary
- **Or Contrebande** (contraband-gold) : c'est la couleur de valeur et de confirmation. On la trouve sur les liens vers les offres, l'action « Enregistrer », le message de succès, la courbe du prix médian, le préfixe « Solution — » et les puces de liste sur la page À propos. Elle reprend le tier Contrebande.

### Tertiary
- **Vert Hausse** (gain-green) : c'est le vert `green-400` par défaut de Tailwind, hors palette. Il marque les hausses et le badge « Active » (texte vert sur fond `green-900` à 40 %). **Dette de design :** on le documente tel quel, mais il n'a pas été choisi pour ce système et reste à intégrer ou ajuster. Aucune nouvelle surface ne doit l'étendre avant cette décision.

### Rarity Scale (donnée)
Les couleurs officielles des tiers du jeu, reprises à l'identique du dataset CSGO-API. Ce sont des données, pas des accents de marque : elles ne servent qu'à dire la rareté d'un item, sur le liseré des cartes et en pastille sur la fiche d'item.
- **Consommateur** (rarity-consumer) : Consumer Grade, Base Grade.
- **Industriel** (rarity-industrial) : Industrial Grade.
- **Militaire** (rarity-milspec) : Mil-Spec Grade, High Grade, Distinguished.
- **Prohibé** (rarity-restricted) : Restricted, Remarkable, Exceptional.
- **Classifié** (rarity-classified) : Classified, Exotic, Superior.
- **Secret** (rarity-covert) : Covert, Extraordinary, Master (couteaux et gants compris).
- **Contrebande** (rarity-contraband) : Contraband.
- **Non classé** (rarity-unknown) : un gris neutre pour les items absents du dataset (capsules, slabs, passes).

Le tier est déduit de la couleur fournie par le dataset, pas de son nom : un sticker « High Grade » et une arme « Mil-Spec » partagent le même bleu. Le nom officiel du tier est stocké à côté pour le libellé français.

### Neutral
- **Graphite Fond** (graphite-base) : fond de page, fond des champs de saisie et des images d'item.
- **Graphite Surface** (graphite-surface) : barre de navigation, cartes, formulaires, conteneur du graphique, bulle d'info-bulle.
- **Graphite Survol** (graphite-hover) : survol des cartes et des boutons secondaires, blocs squelettes, interrupteur inactif.
- **Acier Bordure** (steel-border) : toutes les bordures (appliquée globalement), grille du graphique.
- **Cendre** (ash-muted) : texte secondaire, descriptions, axes du graphique, courbe « Offres disponibles », initiales de repli.
- **Blanc Os** (bone-white) : texte principal, pastille de l'interrupteur.

### Named Rules
**La règle du signal de rareté.** Le rouge et l'or ne remplissent jamais de grandes surfaces. Ils colorent un chiffre, un label, un trait ou un bouton, et c'est leur rareté qui leur donne du sens. Seul le bouton primaire a un fond rouge plein.

**La règle de l'échelle réservée.** Les couleurs de rareté ne servent qu'à dire la rareté d'un item. Elles ne deviennent jamais des accents d'interface, et le Rouge Covert de marque (`#e0473e`) reste distinct du rouge de tier Secret (`#eb4b4b`). Une rareté n'est jamais transmise par la seule couleur : son nom est présent en texte, en info-bulle ou en texte pour les lecteurs d'écran.

**La règle du rouge lisible.** Trait, interrupteur ou grand titre gras (logo) : Rouge Covert. Texte rouge sous 18px : Rouge Covert Texte. Aplat portant du texte blanc : Rouge Covert Aplat. Ne jamais intervertir ces rôles.

**La règle des deux lectures.** Le rouge veut toujours dire « action ou baisse/alerte », l'or veut toujours dire « valeur ou confirmation ». Une nouvelle surface ne réaffecte pas ces rôles.

## Typography

**Display Font:** Rajdhani (repli sans-serif)
**Body Font:** Inter (repli sans-serif)
**Label/Mono Font:** JetBrains Mono (repli monospace) pour toutes les données chiffrées

**Character:** La géométrie condensée de Rajdhani rappelle les HUD de jeu et les étiquettes d'inventaire. Inter reste neutre pour la lecture, et la mono installe la rigueur du relevé chiffré.

### Hierarchy
- **Display** (Rajdhani 700, 1.875rem / 2.25rem) : le titre de page (nom du skin, « Skins », « À propos de ce projet »). Un seul par page.
- **Headline** (Rajdhani 600, 1.25rem / 1.75rem) : les titres de section de la page À propos. Les formulaires utilisent une variante à 1.125rem.
- **Title** (Rajdhani 600, 1rem) : le nom d'item dans les cartes, les titres de défi.
- **Body** (Inter 400, 0.875rem–1rem) : les descriptions et le texte explicatif, toujours en Cendre quand il est secondaire. La page À propos plafonne la ligne à 48rem.
- **Label** (Rajdhani 600, 0.75rem, espacement 0.025em, CAPITALES) : les en-têtes de sous-liste sous un titre de section (« Plus fortes hausses », « Plus fortes baisses »), les badges de statut et le sur-titre des toasts. Un bloc de page (« Mes skins suivis », « Variations du marché », « Résultats ») prend un titre Headline, jamais un Label : un label ne doit pas peser moins que le texte qui l'entoure. Les boutons utilisent la même voix en 0.875rem.
- **Data** (JetBrains Mono 400–600, 0.75rem–0.875rem) : prix « 12.34 € », variations « +8.2% », seuils d'alerte et plages de pagination.

### Named Rules
**La règle du chiffre en mono.** Tout nombre qui représente une donnée de marché (prix, pourcentage, seuil, plage) est en JetBrains Mono. Un nombre dans une phrase explicative reste dans la police du texte.

**La règle des capitales tactiques.** Les capitales espacées sont réservées aux labels Rajdhani (boutons, badges, en-têtes de liste). On ne les utilise ni dans le corps de texte ni dans les titres.

## Layout

Une colonne centrée de 64rem au maximum, avec 24px de marge latérale et 40px de marge verticale sous la barre de navigation. La page À propos, qui se lit, se resserre à 48rem. Les listes de cartes sont des grilles avec 12px d'écart.

**Page d'accueil.** Trois blocs, dans l'ordre de lecture :
1. **En-tête** serré : titre, présentation de deux lignes au plus, ligne de fraîcheur.
2. **Recherche**, l'élément principal : un grand champ avec icône et une rangée de pastilles d'exemples.
3. **Marché** : un titre de section, sa période en sous-titre, la méthode repliée dans un `<details>`, puis les deux listes. Sur grand écran (`lg`, 1024px et plus), les hausses et les baisses sont côte à côte, avec 24px d'écart. En dessous, elles s'empilent avec 40px d'écart.

Les blocs sont séparés de 48px, les groupes internes de 12 à 20px.

Le rythme suit l'échelle de 4px de Tailwind : 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48px.
- **`sm` (640px) :** les lignes du tableau de stack passent de l'empilement à la ligne. Les pastilles d'exemples cessent de défiler horizontalement et passent à la ligne. La barre de navigation connectée revient sur une seule ligne.
- **`lg` (1024px) :** le marché passe sur deux colonnes.

Les noms d'item tiennent sur deux lignes au plus (`line-clamp-2`) au lieu d'être tronqués sur une seule. Le graphique de prix a une hauteur fixe de 360px.

## Elevation & Depth

Le système est plat par défaut. La profondeur vient d'un empilement tonal (Graphite Fond → Graphite Surface → Graphite Survol) et des bordures Acier d'1px. Le survol éclaircit la surface d'un palier au lieu de la soulever. La seule ombre portée est celle des toasts d'alerte, qui flottent au-dessus du contenu en haut à droite.

### Shadow Vocabulary
- **Flottant** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`) : réservé aux éléments qui flottent au-dessus de la page (toasts). Il n'est jamais appliqué à un élément posé dans le flux.

### Named Rules
**La règle plat par défaut.** Les éléments dans le flux n'ont jamais d'ombre. Pour signaler un état (survol, actif), on passe au palier tonal suivant.

## Shapes

Des coins peu arrondis et fonctionnels. Les boutons, champs, images d'item et squelettes ont un léger arrondi (4px). Les cartes, formulaires, conteneur du graphique et info-bulle ont des coins doux (8px). Les badges de statut et l'interrupteur sont les deux seules formes en pilule. Toutes les bordures font 1px en Acier. Les images d'item sont contenues dans un cadre Graphite Fond, sans être recadrées, et laissent voir le fond autour de la silhouette de l'arme.

## Components

### Buttons
Nets et tactiques : ils parlent en capitales Rajdhani.
- **Shape :** léger arrondi (4px), padding 8px × 16px, texte Rajdhani 600 en 0.875rem, capitales, espacement 0.025em.
- **Primary :** fond Rouge Covert Aplat, texte Blanc Os (5,1:1). Il sert à Connexion, « Créer l'alerte » et aux actions de validation.
- **Hover / Focus :** l'aplat fonce encore d'un cran (Rouge Covert Aplat survol, 5,9:1), avec une transition de couleur de 150ms. Désactivé : 50 % d'opacité et curseur interdit, pour les boutons primaires comme secondaires.
- **Focus clavier (tous les éléments interactifs) :** un contour de 2px en Rouge Covert Texte, décalé de 2px, défini globalement sur `:focus-visible`. Les champs gardent leur propre traitement (bordure rouge et anneau à 50 %).
- **Secondary :** fond Graphite Surface, bordure Acier, texte Blanc Os. Au survol, fond Graphite Survol. Il sert à Déconnexion, à la pagination et à « Charger plus ».
- **Actions textuelles :** les actions secondaires dans les cartes (« Modifier », « Supprimer », « Annuler ») sont du texte 0.875rem en Cendre, qui passe au blanc au survol (au rouge pour Supprimer). « Enregistrer » et les liens d'offre sont en Or et se soulignent au survol.

### Chips
- **Pastille de recherche :** pilule en Graphite Surface avec bordure Acier, texte Inter 0.875rem en Blanc Os, 36px de haut minimum. Au survol, fond Graphite Survol. Un clic relance la recherche avec ce texte. Elle sert aux exemples sous le champ et aux suggestions « Vouliez-vous dire » quand une recherche ne trouve rien. Sur mobile, les exemples tiennent sur une seule rangée qui défile horizontalement.
- **Badge de statut :** pilule, padding 2px × 8px, label Rajdhani en capitales 0.75rem. Il existe trois états : **Déclenchée** (texte Rouge Covert sur Rouge Covert à 20 %), **Active** (Vert Hausse sur `green-900` à 40 %, voir la dette ci-dessus), **En pause** (Cendre sur Graphite Survol).

### Cards / Containers
- **Corner Style :** coins doux (8px).
- **Background :** Graphite Surface, puis Graphite Survol au survol pour les cartes cliquables.
- **Shadow Strategy :** aucune (voir Elevation & Depth), sauf pour les toasts.
- **Border :** 1px Acier.
- **Internal Padding :** 16px, et 20px à gauche pour laisser de la place au liseré.
- **Conteneurs non-cartes :** les formulaires et le graphique utilisent la même surface, la même bordure et les mêmes coins, sans liseré, avec un padding de 16 à 20px.

### Inputs / Fields
- **Style :** fond Graphite Fond (plus sombre que la surface qui l'entoure), bordure Acier 1px, léger arrondi (4px), padding 8px × 12px, placeholder en Cendre.
- **Focus :** la bordure passe au Rouge Covert, avec un anneau de 2px en Rouge Covert à 50 %, sans contour natif.
- **Error / Disabled :** les erreurs s'affichent en texte Rouge Covert sous le formulaire (« Erreur : … »), sans changer l'aspect du champ.
- **Champ de recherche principal :** même champ en plus grand (texte 1.125rem, 12px de padding vertical). Une loupe SVG en Cendre est placée à 16px du bord gauche, et le texte commence à 48px. Sous le champ, une zone de 36px est réservée aux exemples ou à l'indice « au moins 2 caractères », pour que la page ne saute pas.

### Footer
- **Style :** une bordure haute Acier, 64px sous le contenu, même colonne de 64rem que la page. Texte 0.875rem en Cendre.
- **Contenu :** à gauche, les crédits des sources (API publique Skinport, ByMykel/CSGO-API, noms en Blanc Os et soulignés au survol) et la mention « Projet indépendant, non affilié à Skinport ni à Valve ». À droite, les liens « À propos » et « Code source ↗ ».
- **Mobile :** les deux blocs s'empilent.
- **Position :** collé en bas de la fenêtre sur les pages courtes (la page est une colonne flex, le contenu principal prend la hauteur restante).

### Navigation
- **Style :** une barre pleine largeur en Graphite Surface avec une bordure basse Acier. Le contenu est aligné sur la colonne de 64rem, avec un padding de 16px × 24px.
- **Logo :** « CS2 » en blanc suivi de « MARKET » en Rouge Covert, Rajdhani 700 en 1.25rem, espacement 0.025em.
- **Liens :** 0.875rem en Cendre, qui passent au blanc au survol. L'action de compte est un bouton (primaire pour Connexion, secondaire pour Déconnexion).
- **Mobile :** la barre passe sur deux lignes (logo, puis liens) quand les éléments ne tiennent plus sur une seule, au lieu de déborder.

### Rarity Card (signature)
C'est le composant qui porte l'identité. Il s'agit d'une carte Graphite Surface avec un liseré vertical de 4px sur toute la hauteur de son bord gauche.
- **Carte d'item** (résultats de recherche, variations, skins suivis, alertes, toasts) : le liseré prend la couleur unie du tier de l'item, via la classe `rarity-<tier>` qui définit la variable `--rarity-edge`. Un item sans rareté connue reçoit le gris Non classé. Le nom du tier est exposé en info-bulle (`title`) et en texte pour les lecteurs d'écran.
- **Carte sans item** (défis techniques de la page À propos) : le liseré garde le dégradé de marque, de l'Or Contrebande (en haut) au Rouge Covert (en bas).
- **Squelette** : gris Non classé, puisque la rareté n'est pas encore connue.

En ligne d'item, la carte contient une vignette de 56px sur Graphite Fond. Viennent ensuite le **nom de base** en Rajdhani 600 (deux lignes au plus), puis la **variante** sur sa propre ligne en 0.75rem Cendre (« StatTrak™ · Field-Tested »), jamais tronquée, et enfin les données en mono alignées à droite. Le nom complet est découpé par `itemName.js` : l'usure et StatTrak™/Souvenir sont ce qui distingue les lignes d'une même famille, ils ne doivent donc pas disparaître dans une troncature. La colonne de droite est toujours présente : sans offre en cours, elle affiche « — / aucune offre ».

### Sparkline (mini-courbe)
C'est l'historique du prix minimum sur 90 jours, dans chaque ligne de variation. C'est une donnée, pas un ornement : elle montre sans clic l'atout du produit.
- **Forme :** un SVG de 120 × 28px, sans axe ni légende, placé sous la ligne de prix. Trait de 1.5px en Cendre.
- **Signal :** le segment de la période comparée (celui que mesure le pourcentage) est tracé en 2px dans la couleur de la tendance (vert pour une hausse, Rouge Covert Texte pour une baisse), avec un point de 2.5px sur la dernière valeur.
- **Honnêteté :** l'abscisse suit les vraies dates, donc un trou de collecte reste un écart visible. Un jour à prix non fiable (moins de 5 offres) coupe la ligne au lieu d'inventer un point.
- **Accessibilité :** `role="img"` avec un libellé qui donne le premier et le dernier prix, avec leurs dates.

### Rarity Badge
Sur la fiche d'item, sous le titre : une pastille de 10px dans la couleur du tier, suivie de « Rareté : » en Cendre et du nom français du tier en Blanc Os. Le nom n'est jamais écrit dans la couleur du tier, car le bleu Militaire et le violet Prohibé passent sous 4,5:1 en petit texte.

### Switch
Une pilule de 40 × 24px avec une pastille blanche de 20px. Activé, il est en Rouge Covert et la pastille glisse de 16px vers la droite. Désactivé, il est en Graphite Survol avec une bordure Acier. Il porte `role="switch"` et `aria-checked`.

### Skeleton
Ce sont des blocs Graphite Survol animés en pulsation, qui reprennent la forme exacte de la carte ou de la page qu'ils remplacent : une carte-liseré avec vignette et barre de titre, ou la mise en page complète d'une fiche d'item.

### Price Chart
Un graphique en courbes Recharts dans un conteneur surface de 360px. La courbe du prix minimum est en Rouge Covert, celle du prix médian en Or Contrebande, celle des offres disponibles en Cendre sur un axe droit séparé. Les courbes font 2px, sans points. La grille est en pointillés Acier et les axes en Cendre à 12px. Un clic sur la légende masque une courbe, et son libellé passe alors en Cendre barré.

## Do's and Don'ts

### Do:
- **Do** réserver le Rouge Covert aux actions, baisses, alertes et erreurs, et l'Or Contrebande à la valeur, à la confirmation et aux liens d'offre.
- **Do** mettre tout prix, pourcentage, seuil et plage en JetBrains Mono, avec « € » après le nombre et deux décimales.
- **Do** présenter chaque élément de liste dans une carte-liseré, avec la vignette à gauche et la donnée alignée à droite. Une carte d'item porte toujours la classe de rareté de l'item.
- **Do** accompagner chaque couleur de rareté du nom du tier (texte visible, info-bulle ou texte pour lecteurs d'écran).
- **Do** passer au palier tonal suivant pour exprimer le survol ou la profondeur.
- **Do** annoncer chaque liste par un label Rajdhani en capitales 0.75rem.
- **Do** donner à chaque squelette la forme exacte du contenu qu'il remplace.

### Don't:
- **Don't** remplir une grande surface de rouge ou d'or : seul le bouton primaire a un fond d'accent plein.
- **Don't** ajouter d'ombre portée à un élément dans le flux. L'ombre est réservée aux éléments flottants.
- **Don't** étendre l'usage du Vert Hausse (`#4ade80`) à de nouvelles surfaces tant que la dette n'est pas tranchée.
- **Don't** coder les couleurs en dur dans les composants (le graphique de prix le fait encore) : passer par les tokens.
- **Don't** utiliser de logo, marque ou visuel Skinport ou Valve qui suggérerait une affiliation.
- **Don't** écrire de capitales espacées en dehors des labels Rajdhani.
- **Don't** utiliser une couleur de rareté pour autre chose qu'une rareté, ni écrire du texte dans une couleur de tier.
- **Don't** mettre le dégradé de marque sur une carte d'item : il ferait lire une rareté qui n'existe pas.
