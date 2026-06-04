---
name: capsuleos-vendor-anduin
description: CapsuleOS vendor anduin — distributions linux-anduinos. Use when working on anduin branding, assets vendors/anduin, or any anduin simulated OS entry.
---

# Vendor — anduin

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `anduin` |
| Familles | linux |
| Skill famille OS | `os-linux` |

## Distributions (registre)

- [`linux-anduinos`](../distributions/linux-anduinos/SKILL.md) — skill `capsuleos-distro-linux-anduinos`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-linux
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/anduin/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

