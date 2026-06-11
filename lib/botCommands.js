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
    { cmd: '.test', desc: 'Envoi test atangana (tel. et email)' },
    { cmd: '.authorise NUMERO', desc: 'Autoriser un numéro admin' },
    { cmd: '.unauthorise NUMERO', desc: 'Retirer un admin' },
  ]},
];

export { RECEPTION_EMAIL, BOXING_CENTER_CONTACT_EMAIL, BREVO_SENDER_EMAIL } from './site';
