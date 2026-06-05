---
name: capsuleos-vendor-debian
description: CapsuleOS vendor debian — distributions linux-debian-kde. Use when working on debian branding, assets vendors/debian, or any debian simulated OS entry.
---

# Vendor — debian

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `debian` |
| Familles | linux |
| Skill famille OS | `os-linux` |

## Distributions (registre)

- [`linux-debian-kde`](../distributions/linux-debian-kde/SKILL.md) — skill `capsuleos-distro-linux-debian-kde`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-linux
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/debian/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

