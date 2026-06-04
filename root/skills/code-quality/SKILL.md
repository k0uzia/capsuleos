---
name: capsuleos-code-quality
description: Passe vanilla JS et contrôle JSON CapsuleOS — gates validate-json, validate-vanilla-js, validate-quality-all. Use when reviewing runtime JS, skin profiles, strings.json, or before extending validate-capsule with schema checks.
---

# Qualité code — vanilla JS & JSON

## Quand invoquer

- Revue ou refactor JS sous `usr/lib/capsuleos/`, `OS/`, `home/`
- Ajout / modification de `skin.profile.json`, `strings.json`, `os-registry.json`
- Avant d’étendre `validate-capsule.mjs` ou créer `validate-all.mjs`

## Gates (sans npm)

```bash
node usr/lib/capsuleos/tools/validate-quality-all.mjs
node usr/lib/capsuleos/tools/validate-all.mjs   # release complète
```

**Exit 0 attendu** — ES6 strict : pas de `?.`, `??`, ni `{...obj}` ; warnings `'use strict'` non bloquants.

## Périmètre

| Outil | Couvre |
|-------|--------|
| `validate-json.mjs` | Syntaxe + structure registre, manifest, profils, strings |
| `validate-vanilla-js.mjs` | Pas de modules ES / frameworks / eval runtime |
| `validate-skin-profiles.mjs` | Règles migration assets (complément, pas doublon) |

## Séquence

1. Lire [passe-vanilla-json.md](../../docs/passe-vanilla-json.md)
2. `validate-quality-all.mjs` → corriger erreurs
3. Si profils/assets : `validate-assets-all.mjs` + `validate-capsule.mjs`
4. Release : `validate-all.mjs` (assets + capsule + quality)

## Ne pas

- Ajouter de dépendance npm pour JSON Schema
- Valider les embeds générés à la main (regen via `build-*-embed.mjs`)
- Traiter les warnings `?.` / `??` comme bloquants sans décision produit

## Références

- [passe-vanilla-json.md](../../docs/passe-vanilla-json.md)
- [scalabilite-noyau.md](../../docs/scalabilite-noyau.md)
- `etc/capsuleos/schemas/skin.profile.schema.json`
