---
name: capsuleos-lang-node-mjs
description: CapsuleOS Outils Node (.mjs) — scripts build/validate sous usr/lib/capsuleos/tools/. Use when editing usr/lib/capsuleos/tools/.
---

# Langage — Outils Node (.mjs)

## Périmètre fichiers

- `usr/lib/capsuleos/tools/`

## Skill complémentaire

Souvent couplé à : `kernel-guardian`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Règles projet

- JavaScript : ES6 strict, pas de `?.`, `??`, spread runtime ([passe-vanilla-json.md](../../docs/passe-vanilla-json.md))
- JSON : schémas sous `etc/capsuleos/schemas/`
- CSS : pas de nesting ; préfixer `body#` sur skins ([contrib.md § toolkits](../../../contrib.md#bibliotheques-graphiques-linux-toolkits-gui))

## Hiérarchie

Les skills **vendor / distribution / version** décrivent *où* travailler ; ce skill décrit *comment* éditer ce langage.

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [code-quality](../code-quality/SKILL.md)

