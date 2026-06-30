# Checklist campagne mail / WhatsApp

## 1. Variables Vercel (gestion-manager)

Dans **Vercel → gestion-manager → Settings → Environment Variables** (Production).
Mêmes hôtes/ports que **compta-boxing** (`BOT_URL_*` / `bots/deploy/`).

| Variable | Valeur |
|----------|--------|
| `WHATSAPP_BOT_URL_MINIMES` | `http://prem-eu4.bot-hosting.net:20125` |
| `WHATSAPP_BOT_URL_ST_CYPRIEN` | `http://prem-eu2.bot-hosting.net:20405` |
| `WHATSAPP_BOT_URL_RAMONVILLE` | `http://prem-eu4.bot-hosting.net:21357` |
| `NEXT_PUBLIC_WHATSAPP_BOT_URL` | `http://prem-eu4.bot-hosting.net:20125` (legacy / Minimes) |
| `CAMPAIGN_WA_PER_BOT_WAVE` | `12` |
| `CAMPAIGN_WA_WINDOW_MINUTES` | `30` |
| `CAMPAIGN_TEST_PHONE` | `237693646080` |
| `SITE_API_SECRET` | **identique** sur les 3 bots Bothosting |
| `CRON_SECRET` | chaîne aléatoire pour le cron (toutes les 30 min) |
| `EMAIL_PROVIDER` | `mailjet` |

**Important :** ne pas définir `OFFRE_ETE_WHATSAPP_SENT_OVERRIDE` ni `OFFRE_ETE_WHATSAPP_READ_OVERRIDE` — les compteurs viennent de Supabase.

Puis **Redeploy** gestion-manager.

## 2. Bothosting — 3 serveurs bot

Sur **chaque** serveur (`boxing-center-bot`), fichier `.env` :

| Serveur | `BOT_INSTANCE_ID` | Port typique |
|---------|-------------------|--------------|
| Minimes | `minimes` | **20125** (`prem-eu4`) |
| Saint-Cyprien | `st_cyprien` | 20405 |
| Ramonville | `ramonville` | 21357 |

Variables communes sur chaque serveur :

```env
SITE_API_SECRET=<même que Vercel>
WA_BULK_WINDOW_MS=1800000
WA_BULK_MAX_PER_WINDOW=12
WA_BULK_DELAY_MS=150000
WA_BULK_DELAY_JITTER_MS=20000
```

Redémarrer chaque serveur après modification du `.env`.

## 3. Connexion WhatsApp (QR)

1. Aller sur `/admin/campagne-whatsapp`
2. Pour **Minimes**, **Saint-Cyprien**, **Ramonville** :
   - Cliquer **Générer le QR**
   - Scanner avec le téléphone WhatsApp de la salle
   - Attendre le badge **Connecté ✓**
3. Vérifier **3/3 connectés** sur `/admin/campagne-planning`

Si erreur « Bot inaccessible » : Bothosting est arrêté ou l’URL Vercel est incorrecte.

## 4. Test avant envoi massif

1. `/admin/campagne-whatsapp` → **Test WhatsApp**
2. Le message part vers `237693646080` (ou `CAMPAIGN_TEST_PHONE`)
3. Vérifier réception sur le téléphone test

## 5. Envoi campagne

- **Manuel :** `/admin/campagne-whatsapp` → **Lancer vague (3 bots)**
  - Chaque bot connecté envoie jusqu’à **12 messages / 30 min** (~2m30 entre chaque)
  - La page affiche **Envoyé à …** pour chaque contact assigné
- **Historique :** `/admin/campagne-wa-envoyes`
- **Auto :** `/admin/campagne-planning` → démarrer la campagne (cron **toutes les 30 min**)

## 6. Réinitialiser les compteurs WhatsApp

Pour repartir de zéro (envoyés + lus) :

- `/admin/campagne-wa-envoyes` → **Réinitialiser envois WA**
- ou `/admin/offre-ete` → **Réinitialiser** (clics + vues + WA)

## Avant juillet (infra)

- [ ] `EMAIL_PROVIDER=mailjet` sur Vercel
- [ ] `CRON_SECRET` défini
- [ ] SPF + DKIM + DMARC validés sur boxing-center-portet.fr
- [ ] Migrations Supabase : `014_campaign_settings.sql`, `015_tunnel_leads.sql`
- [ ] 3 bots Bothosting à jour + `.env` 12/30 min

## WhatsApp — reconnexion (si bannis)

1. Attendre **24–48 h** sans envoyer depuis le numéro banni
2. `/admin/campagne-whatsapp` → **Déconnecter** puis **Générer le QR** sur chaque serveur
3. Scanner avec le nouveau téléphone / numéro reposé
4. Vérifier **3/3 connectés**

## Réchauffage (juillet → 23 août)

| Phase | Admin | Volume |
|-------|-------|--------|
| `test` | `/admin/campagne-planning` | 50 emails/jour max |
| `ramp` | idem | 200 emails/jour max |
| `full` | idem | 200 emails/heure (cron) |

## Tunnels

| Page | URL gestion-manager |
|------|---------------------|
| Offre 29€ | `/offre-29/` |
| Offre 259€ | `/offre-259/` |
| Séance essai | `/seance-essai/` |
| Offre été 89€ | `/offre-d-ete/` |
