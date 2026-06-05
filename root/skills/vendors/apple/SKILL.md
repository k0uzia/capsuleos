---
name: capsuleos-vendor-apple
description: CapsuleOS vendor apple — distributions ios-15, ios-17, ios-18, macos-big-sur, macos-monterey, …. Use when working on apple branding, assets vendors/apple, or any apple simulated OS entry.
---

# Vendor — apple

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `apple` |
| Familles | macos, ios |
| Skill famille OS | `os-macos`, `os-ios` |

## Distributions (registre)

- [`ios-15`](../distributions/ios-15/SKILL.md) — skill `capsuleos-distro-ios-15`
- [`ios-17`](../distributions/ios-17/SKILL.md) — skill `capsuleos-distro-ios-17`
- [`ios-18`](../distributions/ios-18/SKILL.md) — skill `capsuleos-distro-ios-18`
- [`macos-big-sur`](../distributions/macos-big-sur/SKILL.md) — skill `capsuleos-distro-macos-big-sur`
- [`macos-monterey`](../distributions/macos-monterey/SKILL.md) — skill `capsuleos-distro-macos-monterey`
- [`macos-sequoia`](../distributions/macos-sequoia/SKILL.md) — skill `capsuleos-distro-macos-sequoia`
- [`macos-sonoma`](../distributions/macos-sonoma/SKILL.md) — skill `capsuleos-distro-macos-sonoma`
- [`macos-ventura`](../distributions/macos-ventura/SKILL.md) — skill `capsuleos-distro-macos-ventura`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-macos ou os-ios
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/apple/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

