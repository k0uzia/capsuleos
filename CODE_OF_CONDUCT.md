# Code de conduite — CapsuleOS

## Notre engagement

Les personnes qui participent à CapsuleOS — contributeurs, conseillers numériques, agents automatisés pilotés par des humains, et mainteneurs — s’engagent à maintenir un espace **respectueux**, **ouvert** et **utile** au public visé par le projet : personnes éloignées du numérique, formateurs et acteurs de terrain.

Ce document complète les normes **techniques** du projet : [root/docs/README.md](root/docs/README.md) · [convention-clean-code.md](root/docs/convention-clean-code.md) (**P12**).

Contact pour signalement : **info@noref.fr**

---

## Standards de comportement (communauté)

Comportements attendus :

- Empathie et respect des personnes, des parcours et des niveaux de compétence
- Feedback constructif ; acceptation des critiques techniques argumentées
- Responsabilité en cas d’erreur ; correction transparente
- Intérêt du collectif et des apprenants avant l’ego individuel

Comportements inacceptables :

- Harcèlement, insultes, attaques personnelles ou politiques
- Langage ou imagerie sexualisés ; avances non sollicitées
- Publication d’informations privées sans consentement
- Tout comportement inapproprié en contexte professionnel ou éducatif

Les mainteneurs peuvent modérer contributions (issues, commits, docs) non alignées avec ce code, avec explication lorsque c’est possible.

---

## Standards techniques (contributions au dépôt)

Au-delà de la conduite interpersonnelle, une contribution **technique** doit respecter l’architecture du projet. Les violations répétées ou volontaires sont traitées comme des manquements au code de conduite **au même titre** que les comportements interpersonnels graves.

| Obligation | Référence |
|------------|-----------|
| Écrire dans la bonne zone (Z0–Z4) | Plan maître §1 bis · README §2 |
| Suivre le pipeline unique (pas de plan parallèle) | `run-capsule-pipeline.mjs` |
| Clean code & corpus (**P12**) | [convention-clean-code.md](root/docs/convention-clean-code.md) |
| Pas d’emprunt cross-vendor (**P11**) | fondements §9 |
| Gates avant merge skin (**H₂**, **I**, **A**) | logique-formelle.md |

Exemples de manquements techniques :

- Commits qui priorisent depuis `roadmap.md` ou un inventaire JSON obsolète
- Code vendor-specific dans le noyau agnostique
- Documentation « roadmap » concurrente au plan maître
- Versionnement d’instantanés `*-resolve.json` induisant des agents en erreur

---

## Portée

Ce code s’applique aux espaces du projet (dépôt, issues, discussions liées) et lorsque une personne représente officiellement CapsuleOS.

---

## Application

Les signalements sont examinés de façon confidentielle à **info@noref.fr**. Les mainteneurs peuvent appliquer avertissement, suspension temporaire ou exclusion selon la gravité.

---

## Attribution — Contributor Covenant

La section « Standards de comportement (communauté) » s’inspire du [Contributor Covenant](https://www.contributor-covenant.org/) v2.0.  
Guidelines d’application : [Mozilla enforcement ladder](https://github.com/mozilla/diversity).

Traductions Contributor Covenant : [contributor-covenant.org/translations](https://www.contributor-covenant.org/translations).
