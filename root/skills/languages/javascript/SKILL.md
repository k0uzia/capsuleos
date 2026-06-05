---
name: capsuleos-lang-javascript
description: CapsuleOS JavaScript vanilla ES6 — JS runtime sous usr/lib/capsuleos, OS/, home/, window/, shells/. Use when editing usr/lib/capsuleos/, OS/, home/.
---

# Langage — JavaScript vanilla ES6

## Périmètre fichiers

- `usr/lib/capsuleos/`
- `OS/`
- `home/`

## Skill complémentaire

Souvent couplé à : `code-quality`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-vanilla-js.mjs
node usr/lib/capsuleos/tools/validate-quality-all.mjs
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

