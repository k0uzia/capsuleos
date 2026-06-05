---
name: capsuleos-vendor-kali
description: CapsuleOS vendor kali — distributions linux-kali. Use when working on kali branding, assets vendors/kali, or any kali simulated OS entry.
---

# Vendor — kali

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `kali` |
| Familles | linux |
| Skill famille OS | `os-linux` |

## Distributions (registre)

- [`linux-kali`](../distributions/linux-kali/SKILL.md) — skill `capsuleos-distro-linux-kali`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-linux
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/kali/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

