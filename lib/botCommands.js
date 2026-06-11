export const BOT_COMMANDS = [
  { section: 'Général', items: [
    { cmd: '.menu', desc: 'Liste des commandes (+ logo)' },
    { cmd: '.guide', desc: 'Guide détaillé de chaque commande' },
    { cmd: '.ping', desc: 'Tester la connexion du bot' },
  ]},
  { section: 'Managers', items: [
    { cmd: '.numeros', desc: 'Managers avec téléphone' },
    { cmd: '.emails', desc: 'Managers avec email' },
    { cmd: '.stats', desc: 'Statistiques contacts' },
    { cmd: '.nonlus', desc: 'Messages WhatsApp non lus' },
  ]},
  { section: 'Tests & admin', items: [
    { cmd: '.test', desc: 'Test WA → +237693646080 + email → linuxcam05@gmail.com (atangana)' },
    { cmd: '.authorise NUMERO', desc: 'Autoriser un numéro admin' },
    { cmd: '.unauthorise NUMERO', desc: 'Retirer un admin' },
  ]},
];

export const RECEPTION_EMAIL = 'angoularaphael05@gmail.com';
