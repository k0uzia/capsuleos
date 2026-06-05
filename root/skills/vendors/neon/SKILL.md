---
name: capsuleos-vendor-neon
description: CapsuleOS vendor neon — distributions linux-kde-neon. Use when working on neon branding, assets vendors/neon, or any neon simulated OS entry.
---

# Vendor — neon

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `neon` |
| Familles | linux |
| Skill famille OS | `os-linux` |

## Distributions (registre)

- [`linux-kde-neon`](../distributions/linux-kde-neon/SKILL.md) — skill `capsuleos-distro-linux-kde-neon`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-linux
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/neon/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

