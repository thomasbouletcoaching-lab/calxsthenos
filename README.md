# Cal X Sthenos

Application d'entraînement, de nutrition et de suivi : un corps fort et noble, le X au centre (1 Timothée 4:8).
PWA statique hébergée gratuitement sur GitHub Pages. **Aucun serveur, aucun compte, aucune base en ligne** :
les données de chaque utilisateur restent sur son téléphone (sauvegarde par fichier depuis le profil).

## Contenu

| Fichier | Rôle |
|---|---|
| `index.html` | Coquille de l'app |
| `css/app.css` | Charte graphique (onyx & or, Archivo, Inter, Fraunces) |
| `js/app.js` | Écrans : onboarding, accueil, séance, carburant, progrès, coach, profil |
| `js/engine.js` | Programmes, charges calculées (e1RM), surcharge progressive ajustée au réel |
| `js/nutrition.js` | Cibles kcal/macros, recherche d'aliments, plats types, plan du jour |
| `js/word.js` | Versets (Louis Segond 1910) et déclarations |
| `js/config.js` | **À personnaliser** : lien Calendly, Instagram, e-mail, texte de l'offre |
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
