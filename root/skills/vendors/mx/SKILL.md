---
name: capsuleos-vendor-mx
description: CapsuleOS vendor mx — distributions linux-mx-kde. Use when working on mx branding, assets vendors/mx, or any mx simulated OS entry.
---

# Vendor — mx

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `mx` |
| Familles | linux |
| Skill famille OS | `os-linux` |

## Distributions (registre)

- [`linux-mx-kde`](../distributions/linux-mx-kde/SKILL.md) — skill `capsuleos-distro-linux-mx-kde`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-linux
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/mx/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

