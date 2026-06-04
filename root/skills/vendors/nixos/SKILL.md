---
name: capsuleos-vendor-nixos
description: CapsuleOS vendor nixos — distributions linux-nixos. Use when working on nixos branding, assets vendors/nixos, or any nixos simulated OS entry.
---

# Vendor — nixos

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `nixos` |
| Familles | linux |
| Skill famille OS | `os-linux` |

## Distributions (registre)

- [`linux-nixos`](../distributions/linux-nixos/SKILL.md) — skill `capsuleos-distro-linux-nixos`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-linux
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/nixos/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

