---
name: capsuleos-vendor-zorin
description: CapsuleOS vendor zorin — distributions linux-zorin. Use when working on zorin branding, assets vendors/zorin, or any zorin simulated OS entry.
---

# Vendor — zorin

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `zorin` |
| Familles | linux |
| Skill famille OS | `os-linux` |

## Distributions (registre)

- [`linux-zorin`](../distributions/linux-zorin/SKILL.md) — skill `capsuleos-distro-linux-zorin`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-linux
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/zorin/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

