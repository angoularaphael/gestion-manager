/**
 * Offres promo — 14 variantes WhatsApp + sujets e-mail.
 * Campagne séparée de Balma. {prenom} + {lien} boutique.
 */

function wa(lines) {
  return lines.join('\n');
}

export const OFFRES_WA_14 = [
  wa([
    'Bonjour {prenom},',
    '',
    'Offres Boxing Center : *29 € / 4 semaines* ou *259 € / saison*.',
    'Cours, coachs, accès libre — *5 salles* en illimité.',
    '',
    '{lien}',
    '',
    '*L’équipe BOXING CENTER*',
  ]),
  wa([
    'Salut {prenom} 👋',
    '',
    '*29 € / 4 semaines* sans engagement, ou *259 €* la saison.',
    'Minimes, Ramonville, Saint-Cyprien, États-Unis, Portet.',
    '',
    '{lien}',
  ]),
  wa([
    '{prenom}, c’est le moment 🥊',
    '',
    '*29 € / 4 sem.* · *259 € / saison*',
    'Tous les cours + accès libre, 5 clubs.',
    '',
    '{lien}',
  ]),
  wa([
    'Hey {prenom} !',
    '',
    'Promo Boxing Center : 29 € les 4 semaines, ou 259 € la saison.',
    '',
    '{lien}',
  ]),
  wa([
    'Bonjour {prenom},',
    '',
    'Tu veux boxer (ou revenir) ? *29 € / 4 semaines* ou *259 € / saison*.',
    '5 salles, débutants bienvenus.',
    '',
    '{lien}',
  ]),
  wa([
    '{prenom}, offre Boxing Center.',
    '',
    '*29 €* sans engagement (4 semaines) ou *259 €* la saison.',
    '',
    '{lien}',
  ]),
  wa([
    'Coucou {prenom},',
    '',
    'Cours + accès libre + 5 clubs : *29 € / 4 sem.* ou *259 € / saison*.',
    '',
    '{lien}',
  ]),
  wa([
    '{prenom} ! Promo boxe 👊',
    '',
    '29 € / 4 semaines · 259 € / saison.',
    '{lien}',
  ]),
  wa([
    'Salut {prenom},',
    '',
    'Offres : *29 € / 4 semaines* ou *259 € / saison*. Toutes disciplines.',
    '',
    '{lien}',
  ]),
  wa([
    '{prenom}, info promo :',
    '',
    '*29 € / 4 semaines* (sans engagement) ou *259 € / saison*.',
    '',
    '{lien}',
  ]),
  wa([
    'Hello {prenom},',
    '',
    'Boxing Center — 29 € ou 259 €. Inscris-toi :',
    '{lien}',
  ]),
  wa([
    '{prenom}, on t’attend.',
    '',
    '*29 € / 4 sem.* ou *259 € / saison* → {lien}',
  ]),
  wa([
    'Bonjour {prenom},',
    '',
    'Rejoins (ou reviens) : *29 €* les 4 semaines, ou *259 €* la saison.',
    '5 salles Toulouse & agglo.',
    '',
    '{lien}',
  ]),
  wa([
    '{prenom}, offres en cours.',
    '',
    '*29 € / 4 semaines* · *259 € / saison*',
    'Cours, coachs, accès libre, 5 clubs.',
    '',
    '{lien}',
    '',
    '*BOXING CENTER*',
  ]),
];

export const OFFRES_EMAIL_SUBJECTS_14 = [
  '{prenom}, offres Boxing Center — 29 € ou 259 €',
  '{prenom}, 29 € / 4 semaines ou 259 € / saison',
  '{prenom}, promo 5 salles Boxing Center',
  '{prenom}, inscris-toi : 29 € ou 259 €',
  '{prenom}, offre sans engagement 29 €',
  '{prenom}, 259 € la saison Boxing Center',
  '{prenom}, cours + accès libre — 29 / 259',
  '{prenom}, on t’ouvre les 5 clubs',
  '{prenom}, promo boxe Toulouse',
  '{prenom}, 29 € les 4 semaines',
  '{prenom}, Boxing Center — offres en cours',
  '{prenom}, reviens (ou commence) à 29 €',
  '{prenom}, 5 salles illimitées — 29 € ou 259 €',
  '{prenom}, ta place est prête',
];
