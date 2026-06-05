---
name: capsuleos-vendor-opensuse
description: CapsuleOS vendor opensuse — distributions linux-opensuse. Use when working on opensuse branding, assets vendors/opensuse, or any opensuse simulated OS entry.
---

# Vendor — opensuse

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `opensuse` |
| Familles | linux |
| Skill famille OS | `os-linux` |

## Distributions (registre)

- [`linux-opensuse`](../distributions/linux-opensuse/SKILL.md) — skill `capsuleos-distro-linux-opensuse`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-linux
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/opensuse/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

