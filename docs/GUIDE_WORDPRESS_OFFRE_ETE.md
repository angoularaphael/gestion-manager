# Guide WordPress / Elementor — Offre Été 2026

Ce guide explique comment remplacer la carte **Fight Event IV** sur la page d'accueil de [boxingcenter.fr](https://boxingcenter.fr/) par la vignette **Offre Été 2026**, avec un lien « En savoir plus » qui enregistre les clics et redirige vers la landing page.

---

## Avant de commencer

- Vous devez être connecté à WordPress en tant qu'administrateur.
- La barre noire en haut du site doit afficher **Modifier avec Elementor**.
- L'image vignette se trouve dans ce dépôt : `public/offre-ete-2026/vignette.png`
- URL de tracking (lien « En savoir plus ») :
  ```
  https://gestion-manager.vercel.app/api/offre-ete/click
  ```
- Landing page publique :
  ```
  https://gestion-manager.vercel.app/offre-ete-2026
  ```

---

## Étape 1 — Ouvrir la page d'accueil dans Elementor

1. Allez sur [boxingcenter.fr](https://boxingcenter.fr/).
2. Dans la barre d'administration WordPress (en haut), cliquez sur **Modifier avec Elementor**.
3. Attendez le chargement complet de l'éditeur Elementor.

---

## Étape 2 — Trouver la section « Actualité et Évènements »

1. Faites défiler la page dans l'aperçu Elementor jusqu'à la section **Actualité et Évènements**.
2. Sur la droite, vous voyez la carte **Fight Event IV - Faites vos jeux** (affiche avec les boxeurs, date du 28 mars 2026).
3. Cliquez sur cette carte (ou sur le conteneur/colonne qui l'entoure) pour la sélectionner.

---

## Étape 3 — Supprimer la carte Fight Event IV

1. Une fois la carte sélectionnée, faites un **clic droit** dessus.
2. Choisissez **Supprimer** (ou appuyez sur la touche **Suppr** du clavier).
3. Vérifiez que l'ancienne carte a bien disparu. La colonne de droite doit être vide ou prête à recevoir le nouveau contenu.

> **Astuce :** Si la carte ne se supprime pas, cliquez sur l'icône **Structure** (en haut à gauche dans Elementor) pour voir l'arborescence des widgets et supprimer le bon bloc.

---

## Étape 4 — Téléverser l'image vignette

1. Dans le menu WordPress (hors Elementor), allez dans **Médias → Ajouter**.
2. Téléversez le fichier `vignette.png` (Offre Été 2026 — 3 mois illimités, 89€).
3. Notez le nom du fichier une fois importé.

---

## Étape 5 — Ajouter la nouvelle vignette dans Elementor

1. Retournez dans **Modifier avec Elementor** sur la page d'accueil.
2. Dans la colonne de droite (là où était Fight Event IV), faites glisser un widget **Image** depuis le panneau de gauche.
3. Cliquez sur **Choisir une image** et sélectionnez la vignette **Offre Été 2026**.
4. Dans l'onglet **Style** du widget Image :
   - **Largeur** : 100 %
   - **Rayon de bordure** : 4 à 8 px (optionnel, pour un rendu plus propre)
5. Dans l'onglet **Avancé** :
   - Ajoutez une **marge inférieure** de 12 à 16 px si besoin.

---

## Étape 6 — Ajouter le texte descriptif

1. Sous l'image, ajoutez un widget **Éditeur de texte** (ou **Titre + Texte**).
2. Collez ce texte :

   > **Offre Été 2026** — Profitez de **3 mois d'accès illimité** à toutes nos salles et disciplines pour **89€** au lieu de 150€. Boxe, MMA, muay thaï, kick, cross training : entraînez-vous sans limite tout l'été.

3. Mettez en forme :
   - Titre en **gras** pour « Offre Été 2026 »
   - Taille de police cohérente avec les autres cartes de la section (environ 15–16 px)

---

## Étape 7 — Ajouter le lien « En savoir plus » (avec tracking)

1. Sous le texte, ajoutez un widget **Bouton** ou **Texte** avec lien.
2. Texte du lien : **En savoir plus →**
3. **URL du lien** — copiez-collez exactement :

   ```
   https://gestion-manager.vercel.app/api/offre-ete/click
   ```

4. Dans les réglages du lien :
   - Ouvrir dans un **nouvel onglet** : **Non** (recommandé — le visiteur reste sur le parcours offre)
   - **nofollow** : laissez par défaut

5. Style du bouton/lien :
   - Couleur proche du rouge Boxing Center ou du doré de la vignette
   - Police en gras, comme le lien « Plus d'informations » de l'ancienne carte

> **Comment ça marche :** Quand un visiteur clique sur « En savoir plus », notre serveur enregistre **1 clic**, puis redirige automatiquement vers la landing page `/offre-ete-2026`. Chaque visite de la landing page enregistre **1 vue**.

---

## Étape 8 — Vérifier sur mobile

1. En bas de l'éditeur Elementor, cliquez sur l'icône **responsive** (téléphone / tablette).
2. Vérifiez que :
   - La vignette s'affiche correctement (pas coupée)
   - Le texte reste lisible
   - Le lien « En savoir plus » est bien cliquable

---

## Étape 9 — Publier

1. Cliquez sur le bouton vert **Mettre à jour** (ou **Publier**) en bas à gauche d'Elementor.
2. Ouvrez [boxingcenter.fr](https://boxingcenter.fr/) en navigation privée pour vérifier le résultat final.
3. Cliquez sur **En savoir plus** pour tester : vous devez arriver sur la page offre avec le fond bleu marine et le prix 89€.

---

## Consulter les statistiques

1. Connectez-vous à [gestion-manager.vercel.app/login](https://gestion-manager.vercel.app/login).
2. Allez dans **Marketing → Offre Été 2026** (`/admin/offre-ete`).
3. Vous y verrez :
   - Nombre de **clics** sur « En savoir plus »
   - Nombre de **vues** de la landing page
   - Liste des derniers événements
   - Bouton **Réinitialiser** (désactivable plus tard via `OFFRE_ETE_ALLOW_RESET=false` sur Vercel)

---

## Dépannage

| Problème | Solution |
|----------|----------|
| Le lien ne redirige pas | Vérifiez l'URL exacte du tracking (pas d'espace, pas de `/` en trop) |
| L'image est floue | Téléversez la vignette en taille originale, pas une capture d'écran |
| La carte Fight Event est toujours visible | Videz le cache (plugin cache ou Cloudflare) après publication |
| Les stats restent à 0 | Vérifiez que la migration Supabase `007_offre_ete_events.sql` est appliquée |

---

## Récapitulatif des URLs

| Usage | URL |
|-------|-----|
| Lien « En savoir plus » (WordPress) | `https://gestion-manager.vercel.app/api/offre-ete/click` |
| Landing page publique | `https://gestion-manager.vercel.app/offre-ete-2026` |
| Admin statistiques | `https://gestion-manager.vercel.app/admin/offre-ete` |
