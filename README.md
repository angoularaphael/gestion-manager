# Gestion Manager — Boxing Center

Console Next.js (style **NYC Cookies**) pour gérer les managers et envoyer WhatsApp / emails Brevo.

## Architecture

```
Vercel (ce site)  ←── SITE_API_SECRET ──→  Bot Bothosting (boxing-center-bot)
       ↓                                          ↓
   Supabase                                  WhatsApp + Brevo
```

## Variables Vercel

Copier `.env.local.example` → variables d'environnement Vercel :

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_WHATSAPP_BOT_URL` | Bot legacy / Minimes (`http://us2.bot-hosting.net:21334`) |
| `WHATSAPP_BOT_URL_MINIMES` | Bot campagne Minimes (compta-boxing : port 21334) |
| `WHATSAPP_BOT_URL_ST_CYPRIEN` | Bot campagne Saint-Cyprien (`http://prem-eu2.bot-hosting.net:20405`) |
| `WHATSAPP_BOT_URL_RAMONVILLE` | Bot campagne Ramonville (`http://prem-eu4.bot-hosting.net:21357`) |
| `CAMPAIGN_WA_PER_BOT_WAVE` | `12` — messages par vague (30 min) |
| `CAMPAIGN_WA_WINDOW_MINUTES` | `30` — fenêtre entre vagues |
| `CAMPAIGN_TEST_PHONE` | `237693646080` — numéro test WhatsApp |
| `SITE_API_SECRET` | Secret partagé avec le bot |
| `SESSION_SECRET` | Signature session (peut = SITE_API_SECRET) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role |
| `SUPER_ADMIN_EMAIL` | `angoularaphael05@gmail.com` |
| `SUPER_ADMIN_PASSWORD` | `#Fareno12` |
| `NEXT_PUBLIC_SITE_URL` | URL Vercel de ce site |

## Supabase

Exécuter dans le SQL Editor :
1. `001_boxing_center.sql` (managers)
2. `002_app_users.sql` (comptes console)
3. `007_offre_ete_events.sql` (tracking Offre Été 2026 — voir `../infobox/supabase/migrations/`)
4. `012_offre_ete_whatsapp_reads.sql` (ouvertures WhatsApp campagne offre été)
5. `008_chatbot.sql` (leads & stats chatbot Portet)
6. `014_campaign_settings.sql` (cron campagne horaire — pause / réchauffement)
7. `015_tunnel_leads.sql` (leads tunnels 29€, 259€, séance d'essai)

Voir aussi [docs/CAMPAGNE_CHECKLIST.md](docs/CAMPAGNE_CHECKLIST.md) — planning : `/admin/campagne-planning`.

## Local

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Login : `/login` — super admin via variables d'env.

## Bot

[Dépôt boxing-center-bot](https://github.com/angoularaphael/boxing-center-bot) — voir `bootstrap.js` pour Bothosting.
