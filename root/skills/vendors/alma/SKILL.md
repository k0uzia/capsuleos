---
name: capsuleos-vendor-alma
description: CapsuleOS vendor alma — distributions linux-alma. Use when working on alma branding, assets vendors/alma, or any alma simulated OS entry.
---

# Vendor — alma

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `alma` |
| Familles | linux |
| Skill famille OS | `os-linux` |

## Distributions (registre)

- [`linux-alma`](../distributions/linux-alma/SKILL.md) — skill `capsuleos-distro-linux-alma`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-linux
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/alma/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

