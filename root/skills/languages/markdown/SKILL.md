---
name: capsuleos-lang-markdown
description: CapsuleOS Markdown documentation — root/docs/, skills/, contrib.md, briefs agent. Use when editing root/, contrib.md, writing.md.
---

# Langage — Markdown documentation

## Périmètre fichiers

- `root/`
- `contrib.md`
- `writing.md`

## Skill complémentaire

Souvent couplé à : `role-manager`.

## Gates

(pas de gate dédié — suivre validate-all en release)

## Règles projet

- JavaScript : ES6 strict, pas de `?.`, `??`, spread runtime ([passe-vanilla-json.md](../../docs/passe-vanilla-json.md))
- JSON : schémas sous `etc/capsuleos/schemas/`
- CSS : pas de nesting ; préfixer `body#` sur skins ([contrib.md § toolkits](../../../contrib.md#bibliotheques-graphiques-linux-toolkits-gui))

## Hiérarchie

Les skills **vendor / distribution / version** décrivent *où* travailler ; ce skill décrit *comment* éditer ce langage.

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [code-quality](../code-quality/SKILL.md)

