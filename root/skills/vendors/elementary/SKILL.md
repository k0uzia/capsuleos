---
name: capsuleos-vendor-elementary
description: CapsuleOS vendor elementary — distributions linux-elementary. Use when working on elementary branding, assets vendors/elementary, or any elementary simulated OS entry.
---

# Vendor — elementary

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `elementary` |
| Familles | linux |
| Skill famille OS | `os-linux` |

## Distributions (registre)

- [`linux-elementary`](../distributions/linux-elementary/SKILL.md) — skill `capsuleos-distro-linux-elementary`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-linux
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/elementary/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

