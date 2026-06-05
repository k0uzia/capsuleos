---
name: capsuleos-vendor-arch
description: CapsuleOS vendor arch — distributions linux-arch. Use when working on arch branding, assets vendors/arch, or any arch simulated OS entry.
---

# Vendor — arch

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `arch` |
| Familles | linux |
| Skill famille OS | `os-linux` |

## Distributions (registre)

- [`linux-arch`](../distributions/linux-arch/SKILL.md) — skill `capsuleos-distro-linux-arch`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-linux
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/arch/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

