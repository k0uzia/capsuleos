---
name: capsuleos-vendor-lineage
description: CapsuleOS vendor lineage — distributions android-lineage. Use when working on lineage branding, assets vendors/lineage, or any lineage simulated OS entry.
---

# Vendor — lineage

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `lineage` |
| Familles | android |
| Skill famille OS | `os-android` |

## Distributions (registre)

- [`android-lineage`](../distributions/android-lineage/SKILL.md) — skill `capsuleos-distro-android-lineage`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-android
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/lineage/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

