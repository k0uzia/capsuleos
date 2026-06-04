---
name: capsuleos-vendor-google
description: CapsuleOS vendor google — distributions android-vanilla, chromeos. Use when working on google branding, assets vendors/google, or any google simulated OS entry.
---

# Vendor — google

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `google` |
| Familles | android, chromeos |
| Skill famille OS | `os-android`, `os-chromeos` |

## Distributions (registre)

- [`android-vanilla`](../distributions/android-vanilla/SKILL.md) — skill `capsuleos-distro-android-vanilla`
- [`chromeos`](../distributions/chromeos/SKILL.md) — skill `capsuleos-distro-chromeos`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-android ou os-chromeos
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/google/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

