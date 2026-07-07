# 🦌 Journée Pâtés de Gibier — Maninghem

Site de gestion de la journée annuelle de fabrication de pâtés de gibier.
Reprend fidèlement le classeur Excel « pâté 2026 » : stocks, recettes, production,
bocaux, liste de courses et budget — le tout **modifiable** depuis le site.

## Utilisation
Ouvre **`index.html`** dans un navigateur (ou via l'adresse GitHub Pages).

- **Frédéric (gestion)** → bouton « Je suis Frédéric », mot de passe par défaut **`pate`**
  (modifiable dans *Paramètres › Général*). Accès complet.
- **Participants** → bouton « Je suis un participant », choisir son nom.
  Accès au formulaire « Ma contribution » (ses kg de gibier) et aux « Années passées » (photos).

Tout est **évolutif** : ajouter/supprimer participants, gibier, ingrédients, recettes,
formats de bocaux, modifier prix et rendements, archiver une année avec photos.

## Mode actuel : démo locale
Les données sont enregistrées **dans le navigateur** (localStorage) : chaque appareil
a ses propres données. Pense à **Exporter** régulièrement (bas de page) pour sauvegarder.

Pour un vrai **partage multi-personnes** (chacun remplit depuis son téléphone, Frédéric
agrège), l'étape suivante est de brancher **Supabase** (base de données + comptes + photos,
gratuit). La couche de données (`js/store.js`) est déjà prévue pour ça.

## Vérification
`verification.html` teste automatiquement le moteur de calcul et le compare à l'Excel
(tous les contrôles doivent être verts).

## Mise en ligne (GitHub Pages)
1. Pousser ce dossier sur un dépôt GitHub.
2. *Settings › Pages* → **Deploy from a branch** → branche `main`, dossier `/ (root)`.
3. Le site est en ligne à `https://<utilisateur>.github.io/<depot>/`.

## Structure
```
index.html            page unique (l'appli)
verification.html     auto-test des calculs
assets/css/styles.css design
js/store.js           stockage (localStorage, prêt Supabase)
js/seed.js            données d'origine (recopiées de l'Excel)
js/calc.js            moteur de calcul
js/auth.js js/router.js js/ui.js js/app.js   infrastructure
js/pages/*.js         les pages (dashboard, stocks, recettes, production, courses, budget, paramètres, contribution, années)
```
