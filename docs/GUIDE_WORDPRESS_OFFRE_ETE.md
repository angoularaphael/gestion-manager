# Guide WordPress / Elementor — Offre Été 2026

La landing page vit sur **boxingcenter.fr** (pas sur gestion-manager).  
URL cible : **https://boxingcenter.fr/offre-d-ete**

Le suivi des clics et des vues reste géré par gestion-manager (API).

---

## Fichiers à déployer

Dans le dépôt `gestion-manager`, le dossier complet à mettre en ligne :

```
public/offre-d-ete/
├── index.html          ← page promo (intro gants + contenu)
└── assets/
    ├── intro.js
    ├── glove-left.png / .svg
    ├── glove-right.png / .svg
    ├── logo-boxing-center.png / .svg
    └── logo.png
```

---

## Étape 1 — Mettre la page sur boxingcenter.fr

### Méthode recommandée (FTP / gestionnaire de fichiers OVH)

1. Connectez-vous à l’hébergement (FTP, SFTP ou **File Manager** OVH).
2. Allez à la **racine du site** (souvent `www/` ou `public_html/`).
3. Créez un dossier **`offre-d-ete`**.
4. Téléversez **tout le contenu** de `public/offre-d-ete/` :
   - `index.html` à la racine du dossier
   - le sous-dossier `assets/` avec tous les fichiers
5. Ouvrez **https://boxingcenter.fr/offre-d-ete/** en navigation privée.

> Si WordPress affiche une page 404 à la place : voir **Étape 1b** ci-dessous.

### Étape 1b — Si WordPress intercepte l’URL

WordPress peut « capturer » `/offre-d-ete` avant le fichier statique.

**Option A — Priorité au dossier statique (.htaccess)**  
À la racine du site, **avant** les règles WordPress, ajoutez :

```apache
RewriteRule ^offre-d-ete/?$ /offre-d-ete/index.html [L]
```

**Option B — Page WordPress vide + redirection**  
1. Créez une page WordPress intitulée **Offre d'été 2026**.
2. Réglez le permalien sur **`offre-d-ete`**.
3. Modèle : **Elementor Canvas** (sans en-tête/pied).
4. Ajoutez un widget **HTML** avec :

```html
<iframe src="/offre-d-ete/index.html" style="width:100%;height:100vh;border:0" title="Offre Été 2026"></iframe>
```

*(L’option FTP directe reste préférable pour le SEO et les perfs.)*

---

## Étape 2 — Vignette sur la page d’accueil (remplacer Fight Event IV)

1. Allez sur [boxingcenter.fr](https://boxingcenter.fr/) → **Modifier avec Elementor**.
2. Section **Actualité et Évènements** → sélectionnez la carte **Fight Event IV**.
3. **Supprimez** la carte (clic droit → Supprimer).
4. **Médias → Ajouter** : importez `public/offre-ete-2026/vignette.png` (si disponible) ou une capture de la landing.
5. Dans la colonne de droite, ajoutez un widget **Image** → vignette Offre Été.
6. Sous l’image, widget **Texte** :

   > **Offre Été 2026** — **3 mois d'accès illimité** à toutes nos salles pour **89€** au lieu de 150€.

---

## Étape 3 — Lien « En savoir plus » (tracking + même site)

Le lien ne doit **pas** envoyer vers gestion-manager pour la page promo.  
Il passe par l’API de tracking, qui redirige vers **boxingcenter.fr/offre-d-ete**.

**URL à coller dans Elementor (bouton ou lien) :**

```
https://gestion-manager.vercel.app/api/offre-ete/click
```

Réglages :
- **Nouvel onglet** : Non
- Le visiteur reste sur boxingcenter.fr après redirection

**Fonctionnement :**
1. Clic sur « En savoir plus » → +1 clic en base
2. Redirection automatique → `https://boxingcenter.fr/offre-d-ete`
3. La landing enregistre +1 vue (script dans `index.html`)

---

## Étape 4 — Vérifications

| Test | Résultat attendu |
|------|------------------|
| `boxingcenter.fr/offre-d-ete` | Intro gants → logo → promo 89€ |
| Clic « En savoir plus » depuis l’accueil | Arrivée sur `/offre-d-ete` (même domaine) |
| Admin `/admin/offre-ete` | Clics et vues qui augmentent |

---

## Étape 5 — Publier Elementor

1. **Mettre à jour** la page d’accueil dans Elementor.
2. Vider le cache (plugin cache / Cloudflare si activé).
3. Retester en navigation privée.

---

## Statistiques (admin)

1. [gestion-manager.vercel.app/login](https://gestion-manager.vercel.app/login)
2. **Marketing → Offre Été 2026**

---

## Variables Vercel (gestion-manager)

| Variable | Valeur recommandée |
|----------|-------------------|
| `NEXT_PUBLIC_OFFRE_ETE_LANDING_URL` | `https://boxingcenter.fr/offre-d-ete` |
| `OFFRE_ETE_CORS_ORIGINS` | `https://boxingcenter.fr,https://www.boxingcenter.fr` |
| `OFFRE_ETE_ALLOW_RESET` | `true` (puis `false` en prod stable) |

---

## Récapitulatif des URLs

| Usage | URL |
|-------|-----|
| **Landing (visiteurs)** | `https://boxingcenter.fr/offre-d-ete` |
| Lien tracking (accueil WP) | `https://gestion-manager.vercel.app/api/offre-ete/click` |
| API vues (automatique) | `https://gestion-manager.vercel.app/api/offre-ete/track` |
| Admin stats | `https://gestion-manager.vercel.app/admin/offre-ete` |

---

## Dépannage

| Problème | Solution |
|----------|----------|
| 404 sur `/offre-d-ete` | Vérifier le dossier FTP + règle `.htaccess` |
| Intro ne se lance pas | Vérifier que `assets/intro.js` et les PNG sont bien en ligne |
| Stats vues à 0 | Vérifier `OFFRE_ETE_CORS_ORIGINS` sur Vercel + migration Supabase `007` |
| Redirection vers Vercel | Mettre à jour `NEXT_PUBLIC_OFFRE_ETE_LANDING_URL` sur Vercel |
