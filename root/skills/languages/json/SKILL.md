---
name: capsuleos-lang-json
description: CapsuleOS JSON canonique — os-registry.json, skin.profile.json, strings.json, manifest, profils etc/. Use when editing etc/capsuleos/, home/, var/lib/capsuleos/generated/.
---

# Langage — JSON canonique

## Périmètre fichiers

- `etc/capsuleos/`
- `home/`
- `var/lib/capsuleos/generated/`

## Skill complémentaire

Souvent couplé à : `code-quality`.

## Gates

```bash
node usr/lib/capsuleos/tools/validate-json.mjs
node usr/lib/capsuleos/tools/validate-skin-profiles.mjs
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

