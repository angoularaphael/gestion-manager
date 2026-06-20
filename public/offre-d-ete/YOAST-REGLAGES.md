# Yoast SEO — Page Offre d'été (WordPress)

Yoast ne lit **pas** le contenu de l'iframe. Remplis uniquement les **champs Yoast** (titre SEO, meta description, mot-clé).

---

## 1. Réglages Yoast (colonne droite ou sous l'éditeur)

### Titre SEO
```
Offre Été 2026 — 3 mois illimités 89€ | Boxing Center Toulouse
```
*(identique au H1 de la page — important pour le référencement local)*

### Meta description
```
Offre été Boxing Center Toulouse : 3 mois illimités à 89€ au lieu de 150€. Boxe, MMA, muay thai, cross training. 5 salles — Saint-Cyprien, Minimes, Ramonville, Portet. T-shirt offert inclus.
```
(≈ 165 caractères)

### Mot-clé principal (focus keyphrase)
```
offre été boxing center toulouse
```
Variantes secondaires Yoast :
- `abonnement boxe toulouse 89€`
- `3 mois illimités boxing center`

---

## 2. Page WordPress

| Champ | Valeur |
|-------|--------|
| Titre de la page | Offre d'été 2026 |
| Slug | offre-d-ete |
| Statut | Publié |

---

## 3. Image pour les réseaux (Yoast / Open Graph)

1. **Médias** → envoie `image.png` (vignette promo)
2. Dans Yoast → **Réglages sociaux** ou image mise en avant
3. Sélectionne la vignette Offre Été 2026

---

## 4. Iframe pleine largeur

Remplace ton code par **tout** le contenu du fichier `wordpress-iframe.html` (iframe seule, sans texte au-dessus — l'affichage de la page ne change pas).

**Référencement sans changer l'affichage :**
- Remplis les champs **Yoast** ci-dessus sur la page WordPress (titre, meta, image OG)
- Le SEO technique (meta, schema, FAQ) est dans `index.html` chargé dans l'iframe
- Soumets le sitemap dans Google Search Console (voir section 8)

---

## 5. Modèle de page (optionnel mais recommandé)

Dans la colonne droite **Page** → **Modèle** :
- Choisis **Pleine largeur** ou **Elementor Canvas** si disponible
- Ça réduit les marges blanches du thème

---

## 6. Checklist Yoast vert

- [ ] Mot-clé dans le titre SEO
- [ ] Mot-clé dans la meta description
- [ ] Mot-clé dans le slug (`offre-d-ete` contient "offre")
- [ ] Image mise en avant définie (`email-offre.jpg` ou vignette promo)
- [ ] Lien interne depuis l'accueil vers `/offre-d-ete`
- [ ] Page indexée (pas de noindex)
- [ ] Sitemap WordPress inclut `/offre-d-ete` (priorité haute si possible)

## 8. Sitemap dédié (déjà dans le dépôt)

Fichier : `public/offre-d-ete/sitemap.xml` — à copier sur l'hébergement si la page est servie en statique, ou soumettre dans Google Search Console :
`https://boxingcenter.fr/offre-d-ete/sitemap.xml`

---

## 7. Lien accueil

Bouton « En savoir plus » :
```
https://boxingcenter.fr/offre-d-ete
```
