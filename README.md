# Gestion Manager — Boxing Center

Console web (login, dashboard, envoi WhatsApp / email aux managers boxe).

## Déploiement Vercel

1. Importer ce repo sur [Vercel](https://vercel.com)
2. Variable d'environnement :
   - `BC_API_BASE` = URL du bot (ex. `https://bot.votredomaine.com`)
3. Le build génère `config.js` automatiquement
4. Sur le bot, définir `CORS_ORIGIN` = URL Vercel de cette app

## Connexion

- Super admin : configuré via `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` sur le **bot**
- Création d'accès : Paramètres → Gestion des accès (super admin)

## Bot backend

[Dépôt boxing-center-bot](https://github.com/angoularaphael/boxing-center-bot)
