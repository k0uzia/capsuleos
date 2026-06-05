---
name: capsuleos-lang-css
description: CapsuleOS CSS skins & toolkits — style/, themes/, *.skin.css, variables-linux, window-chrome. Use when editing usr/share/capsuleos/themes/, home/, contrib.md.
---

# Langage — CSS skins & toolkits

## Périmètre fichiers

- `usr/share/capsuleos/themes/`
- `home/`
- `contrib.md`

## Skill complémentaire

Souvent couplé à : `role-web-designer`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-css-asset-urls.mjs
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

