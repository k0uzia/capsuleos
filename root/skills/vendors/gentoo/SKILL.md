---
name: capsuleos-vendor-gentoo
description: CapsuleOS vendor gentoo — distributions linux-gentoo. Use when working on gentoo branding, assets vendors/gentoo, or any gentoo simulated OS entry.
---

# Vendor — gentoo

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `gentoo` |
| Familles | linux |
| Skill famille OS | `os-linux` |

## Distributions (registre)

- [`linux-gentoo`](../distributions/linux-gentoo/SKILL.md) — skill `capsuleos-distro-linux-gentoo`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-linux
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/gentoo/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

