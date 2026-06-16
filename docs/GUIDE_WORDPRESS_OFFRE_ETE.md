# Guide débutant — WordPress / Elementor — Offre Été 2026

Ce guide explique **clic par clic** comment :
1. **Supprimer** la carte **Fight Event IV** sur la page d'accueil
2. **Ajouter** la nouvelle carte **Offre Été 2026**
3. Mettre en ligne la page promo sur **boxingcenter.fr/offre-d-ete**

> Vous n'avez pas besoin de savoir coder. Suivez les étapes dans l'ordre.

---

## Ce dont vous avez besoin avant de commencer

- [ ] Vos identifiants **WordPress** (boxingcenter.fr/wp-admin)
- [ ] Le droit **Administrateur** sur le site
- [ ] L'image vignette (demandez-la ou faites une capture de la page offre)
- [ ] Le dossier `public/offre-d-ete/` du dépôt (pour la page complète `/offre-d-ete`)

---

# PARTIE A — Page d'accueil : enlever Fight Event IV et ajouter l'Offre Été

## Étape 1 — Se connecter à WordPress

1. Ouvrez votre navigateur (Chrome, Firefox, Edge…).
2. Allez sur : **https://boxingcenter.fr/wp-admin**
3. Entrez votre **identifiant** et **mot de passe**.
4. Cliquez sur **Se connecter**.
5. Vous arrivez sur le **tableau de bord** WordPress (menu noir à gauche).

---

## Étape 2 — Ouvrir la page d'accueil dans Elementor

1. Dans le menu de gauche, cliquez sur **Pages**.
2. Cherchez la page **Accueil** (ou **Home**).
3. Passez la souris dessus → cliquez sur **Modifier avec Elementor**.
4. Attendez que l'écran se charge (aperçu du site + panneau Elementor à gauche).

> **Astuce :** Vous pouvez aussi aller sur boxingcenter.fr, être connecté en admin, et cliquer la barre noire en haut : **Modifier avec Elementor**.

---

## Étape 3 — Trouver la section « Actualité et Évènements »

1. Dans l'aperçu au centre, **faites défiler vers le bas** avec la molette.
2. Cherchez le titre **Actualité et Évènements** (ou une section avec des cartes d'actus).
3. À **droite**, vous voyez la carte **Fight Event IV** :
   - Image avec des boxeurs
   - Texte du type « Faites vos jeux »
   - Date **28 mars 2026**

---

## Étape 4 — Sélectionner la carte Fight Event IV

1. **Cliquez une fois** sur l'image ou le texte de Fight Event IV.
2. Un **cadre bleu** apparaît autour de l'élément sélectionné.
3. Si ce n'est pas le bon bloc :
   - Cliquez l'icône **Structure** (en haut à gauche, liste empilée)
   - Dépliez les sections jusqu'à trouver **Fight Event** ou l'image de l'événement
   - Cliquez sur le bon widget dans la liste

---

## Étape 5 — Supprimer Fight Event IV

**Méthode 1 (la plus simple)**
1. La carte est sélectionnée (cadre bleu).
2. Appuyez sur la touche **Suppr** (ou **Delete**) du clavier.
3. Confirmez si WordPress demande confirmation.

**Méthode 2 (clic droit)**
1. **Clic droit** sur la carte sélectionnée.
2. Cliquez sur **Supprimer**.

**Méthode 3 (poubelle Elementor)**
1. Sélectionnez la carte.
2. Clic droit → **Supprimer**, ou icône **poubelle** dans le panneau de droite.

4. Vérifiez : la carte Fight Event IV a **disparu**. La colonne de droite est vide (ou ne contient plus cette carte).

> ⚠️ Ne cliquez pas encore sur **Mettre à jour** — on ajoute d'abord la nouvelle carte.

---

## Étape 6 — Importer l'image vignette Offre Été

1. **Ouvrez un nouvel onglet** (gardez Elementor ouvert).
2. Allez dans le menu WordPress : **Médias** → **Ajouter un fichier média**.
3. Cliquez sur **Sélectionner des fichiers**.
4. Choisissez l'image **vignette Offre Été 2026** (fichier PNG).
5. Attendez la fin de l'envoi.
6. Notez le nom du fichier (ex. `vignette-offre-ete-2026.png`).
7. Revenez sur l'onglet **Elementor**.

---

## Étape 7 — Ajouter l'image de la nouvelle offre

1. Dans Elementor, panneau de **gauche** : cherchez le widget **Image** (icône petit paysage).
2. **Glissez-déposez** le widget **Image** dans la colonne où était Fight Event IV (à droite).
3. Cliquez sur **Choisir une image**.
4. Sélectionnez la vignette **Offre Été 2026** que vous venez d'importer.
5. Cliquez sur **Insérer le média**.
6. Dans l'onglet **Style** (panneau gauche) :
   - **Largeur** → `100 %`
   - **Rayon de bordure** → `6` px (optionnel, coins arrondis)

---

## Étape 8 — Ajouter le texte sous l'image

1. Panneau gauche → widget **Éditeur de texte** (ou **Texte**).
2. Glissez-le **sous** l'image.
3. Copiez-collez ce texte :

```
Offre Été 2026

Profitez de 3 mois d'accès illimité à toutes nos salles et disciplines pour 89€ au lieu de 150€.

Boxe, MMA, muay thaï, kick, cross training : entraînez-vous sans limite tout l'été.
```

4. Mettez **Offre Été 2026** en **gras** (sélectionnez le texte → bouton **B**).
5. Taille de police : environ **15–16 px** (onglet Style → Typographie).

---

## Étape 9 — Ajouter le bouton « En savoir plus »

1. Panneau gauche → widget **Bouton**.
2. Glissez-le **sous** le texte.
3. Dans le champ **Texte** du bouton, tapez : `En savoir plus →`
4. Dans le champ **Lien** (URL), collez **exactement** :

```
https://gestion-manager.vercel.app/api/offre-ete/click
```

5. Réglages importants du lien :
   - **Ouvrir dans un nouvel onglet** → **Non** / désactivé
   - Ne modifiez pas l'URL (pas d'espace avant ou après)

6. Style du bouton (onglet **Style**) :
   - Couleur de fond : rouge Boxing Center ou proche de la vignette
   - Texte en blanc, en gras

> **Ce que fait ce lien :** il compte 1 clic, puis envoie le visiteur sur **boxingcenter.fr/offre-d-ete** (votre page promo, pas un autre site).

---

## Étape 10 — Vérifier sur mobile

1. En bas de l'écran Elementor, cliquez l'icône **téléphone** (mode mobile).
2. Vérifiez :
   - [ ] L'image n'est pas coupée
   - [ ] Le texte est lisible
   - [ ] Le bouton est bien visible et cliquable
3. Recliquez l'icône **ordinateur** pour revenir au mode bureau.

---

## Étape 11 — Publier les changements sur l'accueil

1. En bas à gauche d'Elementor, cliquez le bouton vert **Mettre à jour**.
2. Attendez le message de confirmation.
3. Ouvrez **https://boxingcenter.fr** en **navigation privée** (Ctrl+Shift+N).
4. Descendez jusqu'à **Actualité et Évènements** :
   - [ ] Fight Event IV a disparu
   - [ ] La vignette Offre Été est visible
   - [ ] Le bouton « En savoir plus » est là

---

## Étape 12 — Tester le bouton

1. Sur boxingcenter.fr (navigation privée), cliquez **En savoir plus**.
2. Vous devez arriver sur : **https://boxingcenter.fr/offre-d-ete**
3. Vous voyez l'animation des gants, puis la promo **89€**.

Si vous arrivez sur une autre adresse (vercel.app, erreur 404…) → voir **Partie B** ci-dessous.

---

# PARTIE B — Mettre en ligne la page /offre-d-ete (une seule fois)

La page promo complète (animation + contenu) doit être **sur votre hébergement**, pas seulement dans Elementor.

### Étape B1 — Récupérer les fichiers

Dans le dépôt GitHub `gestion-manager`, dossier :

```
public/offre-d-ete/
├── index.html
└── assets/
    (tous les fichiers)
```

Téléchargez ce dossier sur votre PC (ou demandez à quelqu'un de vous l'envoyer en ZIP).

### Étape B2 — Connexion à l'hébergement (OVH ou autre)

1. Connectez-vous à votre **espace client OVH** (ou hébergeur).
2. Ouvrez le **Gestionnaire de fichiers** (ou utilisez **FileZilla** en FTP).
3. Allez dans le dossier du site : souvent `www` ou `public_html`.

### Étape B3 — Créer le dossier et envoyer les fichiers

1. Créez un nouveau dossier nommé exactement : `offre-d-ete`
2. À l'intérieur, mettez :
   - le fichier `index.html`
   - le dossier `assets` (avec tout son contenu)
3. Structure finale sur le serveur :

```
www/
  offre-d-ete/
    index.html
    assets/
      intro.js
      glove-left.png
      ...
```

### Étape B4 — Tester

1. Ouvrez : **https://boxingcenter.fr/offre-d-ete/**
2. L'intro et la promo doivent s'afficher.

### Si vous avez une erreur 404

WordPress « prend » parfois l'adresse avant le fichier. Contactez votre hébergeur ou ajoutez dans `.htaccess` (à la racine, **avant** les lignes WordPress) :

```apache
RewriteRule ^offre-d-ete/?$ /offre-d-ete/index.html [L]
```

---

# PARTIE C — Vider le cache (si les changements ne s'affichent pas)

1. Si vous avez un plugin **cache** (WP Rocket, LiteSpeed, etc.) → **Vider le cache**.
2. Si vous utilisez **Cloudflare** → Purger le cache du domaine.
3. Rechargez la page avec **Ctrl + F5**.

---

# PARTIE D — Voir les statistiques (clics / vues)

1. Allez sur : **https://gestion-manager.vercel.app/login**
2. Connectez-vous.
3. Menu : **Marketing → Offre Été 2026**
4. Vous voyez :
   - **Clics** = clics sur « En savoir plus » depuis l'accueil
   - **Vues** = visites de la page `/offre-d-ete`

---

# Récapitulatif des URLs

| Où ? | URL à utiliser |
|------|----------------|
| Page promo (visiteurs) | `https://boxingcenter.fr/offre-d-ete` |
| Lien du bouton Elementor | `https://gestion-manager.vercel.app/api/offre-ete/click` |
| Admin statistiques | `https://gestion-manager.vercel.app/admin/offre-ete` |

---

# Aide rapide — Problèmes fréquents

| Problème | Que faire |
|----------|-----------|
| Je ne trouve pas Fight Event | Utilisez l'icône **Structure** en haut à gauche dans Elementor |
| La carte ne se supprime pas | Sélectionnez la **colonne** parente, puis supprimez |
| Le bouton va vers une mauvaise page | Vérifiez l'URL du lien (étape 9) |
| Page offre en 404 | Refaire la Partie B (fichiers FTP) |
| Rien ne change sur le site | Vider le cache (Partie C) |

---

# Checklist finale

- [ ] Fight Event IV supprimé
- [ ] Image Offre Été ajoutée
- [ ] Texte ajouté
- [ ] Bouton « En savoir plus » avec la bonne URL
- [ ] **Mettre à jour** cliqué dans Elementor
- [ ] Dossier `offre-d-ete` en ligne sur l'hébergement
- [ ] Test du bouton OK → page 89€ sur boxingcenter.fr
