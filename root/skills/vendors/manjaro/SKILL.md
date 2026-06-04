---
name: capsuleos-vendor-manjaro
description: CapsuleOS vendor manjaro — distributions linux-manjaro-gnome, linux-manjaro-kde. Use when working on manjaro branding, assets vendors/manjaro, or any manjaro simulated OS entry.
---

# Vendor — manjaro

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `manjaro` |
| Familles | linux |
| Skill famille OS | `os-linux` |

## Distributions (registre)

- [`linux-manjaro-gnome`](../distributions/linux-manjaro-gnome/SKILL.md) — skill `capsuleos-distro-linux-manjaro-gnome`
- [`linux-manjaro-kde`](../distributions/linux-manjaro-kde/SKILL.md) — skill `capsuleos-distro-linux-manjaro-kde`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-linux
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/manjaro/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

