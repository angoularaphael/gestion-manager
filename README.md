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
| `NEXT_PUBLIC_WHATSAPP_BOT_URL` | URL du bot Bothosting (`http://IP:3002`) |
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
3. `007_offre_ete_events.sql` (tracking Offre Été 2026 — voir `infobox/supabase/migrations/`)

## Local

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Login : `/login` — super admin via variables d'env.

## Bot

[Dépôt boxing-center-bot](https://github.com/angoularaphael/boxing-center-bot) — voir `bootstrap.js` pour Bothosting.
