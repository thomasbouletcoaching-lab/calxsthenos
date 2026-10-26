# CalXsthenos

Entraînement, nutrition et progression personnalisés qui édifient corps, âme et esprit, pour cette vie et l'éternité. Fondée sur 1 Timothée 4:8.
PWA hébergée gratuitement sur GitHub Pages, avec un serveur Supabase dédié (projet `calxsthenos`, Paris),
séparé de TB my Coach. Le serveur garde : profils (e-mail, réponses de l'onboarding), formules, messages, notifications.
Le détail des séances, le journal alimentaire et les photos restent sur le téléphone.

## Formules

Définies dans `js/config.js` (prix, contenu, quota de messages). Le quota est aussi appliqué par le serveur (table `tiers`).
Le coach change la formule d'un membre depuis l'espace coach. Les liens de paiement Stripe se collent dans `OFFERS[].pay`.

## Devenir coach dans l'app

Après avoir fait l'onboarding avec son e-mail, exécuter dans Supabase :
`update profiles set is_coach = true where email = 'ton@email';`

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html` | Coquille de l'app |
| `css/app.css` | Charte graphique (onyx & or, Archivo, Inter, Fraunces) |
| `js/app.js` | Écrans : onboarding, accueil, séance, carburant, progrès, coach, profil |
| `js/engine.js` | Programmes, charges calculées (e1RM), surcharge progressive ajustée au réel |
| `js/nutrition.js` | Cibles kcal/macros, recherche d'aliments, plats types, plan du jour |
| `js/word.js` | Versets (Louis Segond 1910) et déclarations |
| `js/config.js` | **À personnaliser** : liens, formules et prix |
| `js/cloud.js` | Lien avec le serveur (comptes, messages, notifications, espace coach) |
| `data/programs.json` | 8 programmes de la Méthode Thomas Boulet (repris de TB my Coach) |
| `data/nutrition-models.json` | 10 modèles nutritionnels |
| `data/fiches.json` | 280 fiches d'exercices et schémas (brouillon à valider) |
| `data/ciqual.json` | Table Ciqual 2020, ANSES (Licence Ouverte Etalab 2.0) |
| `sw.js` | Hors ligne (salle sans réseau) |

## Mettre en ligne

1. Settings → Pages → Source : branche `main`, dossier `/ (root)`.
2. L'app est servie à `https://thomasbouletcoaching-lab.github.io/calxsthenos/`.
3. Après chaque modification, augmenter la version dans `sw.js` (`cxs-v1` → `cxs-v2`).

## À faire avant le lancement

- Remplir `js/config.js` (Instagram, e-mail de réception des candidatures).
- Relire chaque verset de `js/word.js` sur une Bible Louis Segond 1910.
- Valider les fiches d'exercices (`data/fiches.json`, marquées « brouillon »).
