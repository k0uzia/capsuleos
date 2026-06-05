---
name: capsuleos-lang-html
description: CapsuleOS HTML façades & apps — index.html, gabarits apps, data-link, embed offline. Use when editing OS/, home/, usr/share/capsuleos/linux/apps/.
---

# Langage — HTML façades & apps

## Périmètre fichiers

- `OS/`
- `home/`
- `usr/share/capsuleos/linux/apps/`

## Skill complémentaire

Souvent couplé à : `link-routing`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-static-html-assets.mjs
node usr/lib/capsuleos/tools/audit-data-links.mjs
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

