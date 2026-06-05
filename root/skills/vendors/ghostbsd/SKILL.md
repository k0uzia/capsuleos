---
name: capsuleos-vendor-ghostbsd
description: CapsuleOS vendor ghostbsd — distributions ghostbsd. Use when working on ghostbsd branding, assets vendors/ghostbsd, or any ghostbsd simulated OS entry.
---

# Vendor — ghostbsd

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `ghostbsd` |
| Familles | bsd |
| Skill famille OS | `os-bsd` |

## Distributions (registre)

- [`ghostbsd`](../distributions/ghostbsd/SKILL.md) — skill `capsuleos-distro-ghostbsd`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-bsd
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/ghostbsd/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

