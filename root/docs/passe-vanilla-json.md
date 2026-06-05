# Passe expertise — vanilla JS & JSON

Document de référence pour la revue qualité du code **runtime** CapsuleOS (hors outils Node `usr/lib/capsuleos/tools/*.mjs`).

## Objectif

1. **Passe manuelle / agent** : aligner le code sur le contrat stack ([checklist `contrib.md`](../contrib.md#checklist-contrat-avant-merge-ou-release), checklist noyau).
2. **Gates automatisés** : `validate-json.mjs`, `validate-vanilla-js.mjs`.
3. **Orchestrateur qualité** : `validate-quality-all.mjs` (JSON + JS).
4. **Gate release** : `validate-all.mjs` (assets + capsule + quality).

## Périmètre runtime JS

| Inclus | Exclu |
|--------|--------|
| `usr/lib/capsuleos/common/`, `shells/`, `site/` | `usr/lib/capsuleos/tools/` |
| `OS/**` (sauf embed généré si regen prévu) | `var/lib/capsuleos/generated/` |
| `home/**` (skins, `content/*.js`) | `**/capsule-*-embed.js` (générés) |

## Règles vanilla JS (erreurs gate)

- Pas de `import` / `export` dans les `.js` chargés par le navigateur.
- Pas de `require('package')` externe.
- Pas de frameworks UI (`react`, `vue`, `angular`, `jquery`, …).
- Pas de `eval(` / `new Function(` dans le runtime (toléré dans `tools/*.mjs` avec commentaire explicite).

## Règles vanilla JS (ES6 strict — gate erreurs)

- `?.` et `??` **interdits** (`validate-vanilla-js.mjs`).
- Object spread `{...obj}` **interdit** ; array spread `[...arr]`, rest `fn(...args)` et destructuring `[a, ...rest]` restent autorisés (ES6).
- Réécriture manuelle ou `callFactory()` pour les modules fenêtre — **ne pas** utiliser `rewrite-es6-strict.mjs` (codemod fragile sur chaînages `?.method`).

## Périmètre JSON

| Fichier | Contrôle |
|---------|----------|
| Tous les `*.json` du dépôt (hors `node_modules`, `.git`) | Syntaxe `JSON.parse` |
| `etc/capsuleos/os-registry.json` | `version`, `entries[]`, champs entrées actives |
| `etc/capsuleos/profiles/*.json` | Profil skin (schéma léger) |
| `**/skin.profile.json` | Idem + cohérence avec `validate-skin-profiles.mjs` |
| `usr/share/capsuleos/assets/manifest.json` | `version`, `packs` objet |
| `**/content/strings.json` | Objet plat clé → chaîne |
| `home/public/.capsule-manifest.json` | `root`, `folders` |

Schéma de référence : `etc/capsuleos/schemas/skin.profile.schema.json` (validation structurelle légère, sans dépendance npm).

## Commandes gate

```bash
node usr/lib/capsuleos/tools/validate-json.mjs
node usr/lib/capsuleos/tools/validate-vanilla-js.mjs
node usr/lib/capsuleos/tools/validate-quality-all.mjs
```

Avant release complète (avec assets + registre) :

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Séquence recommandée (agents)

| Étape | Action | Gate |
|-------|--------|------|
| 1 | Inventaire violations JSON (syntaxe + profils) | `validate-json.mjs` |
| 2 | Inventaire violations JS runtime | `validate-vanilla-js.mjs` |
| 3 | Corrections ciblées (pas de refactor massif) | les deux validateurs → exit 0 |
| 4 | Doc / skills à jour | ce fichier |
| 5 | Branchement validateur général | `validate-all.mjs` (à créer) |

## État (juin 2026)

- **JSON** : gate `validate-json.mjs` vert.
- **JS** : gate `validate-vanilla-js.mjs` vert (ES6 strict) ; avertissements `'use strict' absent` sur fichiers legacy (non bloquant).

## Liens

- [scalabilite-noyau.md § CI légère](scalabilite-noyau.md)
- [politique-assets.md](politique-assets.md)
- Skill : `root/skills/code-quality/SKILL.md`
