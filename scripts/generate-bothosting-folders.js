#!/usr/bin/env node
/**
 * Génère les 6 dossiers Bothosting campagne + dossier Resend.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', 'bots', 'deploy');
const BOOT = fs.readFileSync(
  path.join(__dirname, '..', '..', 'boxing-center-bot', 'bootstrap.js'),
  'utf8'
);

const SIMS = [
  { n: 1, host: 'prem-eu4.bot-hosting.net', port: '21357' },
  { n: 2, host: 'prem-eu2.bot-hosting.net', port: '20405' },
  { n: 3, host: 'prem-eu4.bot-hosting.net', port: '20695' },
  { n: 4, host: 'prem-eu2.bot-hosting.net', port: '21774' },
  { n: 5, host: 'prem-eu2.bot-hosting.net', port: '21871' },
  { n: 6, host: 'prem-eu2.bot-hosting.net', port: '21724' },
];

function envExample(sim) {
  return `# Bothosting — gestion-manager-${sim.n} (campagne WhatsApp Balma)
# Copier en .env à la racine du serveur, à côté de index.js
# Anti-ban : 12 messages / 30 min, ~2m30 entre chaque + jitter

BOT_INSTANCE_ID=sim${sim.n}
BOT_PUBLIC_HOST=${sim.host}
SERVER_PORT=${sim.port}
PORT=${sim.port}

SITE_API_SECRET=
NEXT_PUBLIC_SITE_URL=https://manager.boxingcenter.fr
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

WA_BULK_WINDOW_MS=1800000
WA_BULK_MAX_PER_WINDOW=12
WA_BULK_MAX_PER_HOUR=12
WA_BULK_DELAY_MS=150000
WA_BULK_DELAY_JITTER_MS=30000

CAMPAIGN_KIND=balma
AVENTURE_URL=https://aventure.boxingcenter.fr
`;
}

fs.mkdirSync(ROOT, { recursive: true });
for (const sim of SIMS) {
  const dir = path.join(ROOT, `sim${sim.n}-gestion-manager-${sim.n}`);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'index.js'),
    BOOT.replace(
      "console.log('=== BOXING CENTER BOT — BOTHOSTING ===');",
      `process.env.BOT_INSTANCE_ID = process.env.BOT_INSTANCE_ID || 'sim${sim.n}';\nprocess.env.SERVER_PORT = process.env.SERVER_PORT || process.env.PORT || '${sim.port}';\nconsole.log('=== CAMPAGNE BALMA — gestion-manager-${sim.n} (sim${sim.n}) ===');`
    )
  );
  fs.writeFileSync(path.join(dir, '.env.example'), envExample(sim));
}

const emailDir = path.join(ROOT, 'email-resend');
fs.mkdirSync(emailDir, { recursive: true });
fs.writeFileSync(
  path.join(emailDir, '.env.example'),
  `# Resend Pro — envoi depuis Vercel (gestion-manager), pas depuis Bothosting.
# Compte : Settings → Usage = Pro (50 000 / mois)

EMAIL_PROVIDER=resend
RESEND_API_KEY=
RESEND_SENDER_EMAIL=no-reply@boxingcenter.fr
RESEND_SENDER_NAME=Boxing Center
RESEND_DAILY_LIMIT=1600
RESEND_HOURLY_LIMIT=80
MAILJET_HOURLY_LIMIT=80
`
);
fs.writeFileSync(
  path.join(emailDir, 'README.md'),
  `# E-mails campagne Balma (Resend Pro)

Les mails partent de **gestion-manager** (Vercel) via l’API Resend.
Copier les variables dans Vercel, pas besoin de démarrer ce dossier sur Bothosting.

Lien CTA : https://aventure.boxingcenter.fr/
`
);

fs.writeFileSync(
  path.join(ROOT, 'README.md'),
  `# Campagne Balma — Bothosting

## WhatsApp (6 serveurs)

| Dossier | Serveur panneau | URL |
|---------|-----------------|-----|
| sim1-gestion-manager-1 | gestion-manager-1 | http://prem-eu4.bot-hosting.net:21357 |
| sim2-gestion-manager-2 | gestion-manager-2 | http://prem-eu2.bot-hosting.net:20405 |
| sim3-gestion-manager-3 | gestion-manager-3 | http://prem-eu4.bot-hosting.net:20695 |
| sim4-gestion-manager-4 | gestion-manager-4 | http://prem-eu2.bot-hosting.net:21774 |
| sim5-gestion-manager-5 | gestion-manager-5 | http://prem-eu2.bot-hosting.net:21871 |
| sim6-gestion-manager-6 | gestion-manager-6 | http://prem-eu2.bot-hosting.net:21724 |

Sur chaque serveur : copier \`index.js\` + \`.env.example\` → \`.env\`, renseigner \`SITE_API_SECRET\` (identique à Vercel) et Supabase, puis **Start**.

Anti-ban : 12 msg / 30 min, ~2m30 d’écart, un destinataire ne peut pas être pris par 2 bots (claim SQL).

Les bots **club** (Minimes 20125, etc.) restent séparés.

## E-mail

Voir \`email-resend/\` — Resend Pro sur Vercel.
`
);

console.log('Bothosting folders written under', ROOT);
