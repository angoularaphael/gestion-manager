# Yoast SEO — Page Offre d'été (WordPress)

Yoast ne lit **pas** le contenu de l'iframe. Remplis uniquement les **champs Yoast** (titre SEO, meta description, mot-clé).

---

## 1. Réglages Yoast (colonne droite ou sous l'éditeur)

### Titre SEO
```
Offre Été 2026 — 3 mois illimités 89€ | Boxing Center Toulouse
```

### Meta description
```
Offre été Boxing Center : 3 mois illimités à 89€ au lieu de 150€. Boxe, MMA, muay thaï, cross training. 5 salles Toulouse et agglomération. Inscrivez-vous !
```
(≈ 155 caractères)

### Mot-clé principal (focus keyphrase)
```
offre été boxing center
```
ou
```
3 mois illimités 89€
```

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

Remplace ton code par **tout** le contenu du fichier `wordpress-iframe.html` (iframe seule, sans texte au-dessus).

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
- [ ] Image mise en avant définie
- [ ] Lien interne depuis l'accueil vers `/offre-d-ete`

---

## 7. Lien accueil

Bouton « En savoir plus » :
```
https://boxingcenter.fr/offre-d-ete
```
