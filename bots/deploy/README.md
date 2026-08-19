# Campagnes WhatsApp / e-mail — Bothosting

Deux campagnes distinctes, **mêmes 6 serveurs** :

- **Com Balma** (`balma_cession_2026`) — cession GOTA
- **Offres promo** (`offres_promo`) — 29 € / 4 sem. · 259 € / saison

Une personne peut recevoir les deux (tags SQL différents). Ne pas lancer les deux vagues WhatsApp en même temps (quota 12 / 30 min par bot).

## WhatsApp (6 serveurs)

| Dossier | Serveur panneau | URL |
|---------|-----------------|-----|
| sim1-gestion-manager-1 | gestion-manager-1 | http://prem-eu4.bot-hosting.net:21357 |
| sim2-gestion-manager-2 | gestion-manager-2 | http://prem-eu2.bot-hosting.net:20405 |
| sim3-gestion-manager-3 | gestion-manager-3 | http://prem-eu4.bot-hosting.net:20695 |
| sim4-gestion-manager-4 | gestion-manager-4 | http://prem-eu2.bot-hosting.net:21774 |
| sim5-gestion-manager-5 | gestion-manager-5 | http://prem-eu2.bot-hosting.net:21871 |
| sim6-gestion-manager-6 | gestion-manager-6 | http://prem-eu2.bot-hosting.net:21724 |

Sur chaque serveur : coller `index.js` + le `.env` du dossier (déjà rempli), puis **Start**.

Anti-ban : 12 msg / 30 min, ~2m30 d’écart, un destinataire ne peut pas être pris par 2 bots (claim SQL).

Les bots **club** (Minimes 20125, etc.) restent séparés.

## E-mail

Voir `email-resend/` — Resend Pro sur Vercel.
