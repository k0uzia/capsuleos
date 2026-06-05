---
name: capsuleos-vendor-valve
description: CapsuleOS vendor valve — distributions linux-steamos. Use when working on valve branding, assets vendors/valve, or any valve simulated OS entry.
---

# Vendor — valve

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `valve` |
| Familles | linux |
| Skill famille OS | `os-linux` |

## Distributions (registre)

- [`linux-steamos`](../distributions/linux-steamos/SKILL.md) — skill `capsuleos-distro-linux-steamos`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-linux
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/valve/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

