---
name: capsuleos-vendor-mint
description: CapsuleOS vendor mint — distributions linux-mint. Use when working on mint branding, assets vendors/mint, or any mint simulated OS entry.
---

# Vendor — mint

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `mint` |
| Familles | linux |
| Skill famille OS | `os-linux` |

## Distributions (registre)

- [`linux-mint`](../distributions/linux-mint/SKILL.md) — skill `capsuleos-distro-linux-mint`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-linux
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/mint/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

