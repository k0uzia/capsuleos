---
name: capsuleos-vendor-rocky
description: CapsuleOS vendor rocky — distributions linux-rocky. Use when working on rocky branding, assets vendors/rocky, or any rocky simulated OS entry.
---

# Vendor — rocky

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `rocky` |
| Familles | linux |
| Skill famille OS | `os-linux` |

## Distributions (registre)

- [`linux-rocky`](../distributions/linux-rocky/SKILL.md) — skill `capsuleos-distro-linux-rocky`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-linux
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/rocky/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

