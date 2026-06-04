---
name: capsuleos-vendor-openbsd
description: CapsuleOS vendor openbsd — distributions openbsd. Use when working on openbsd branding, assets vendors/openbsd, or any openbsd simulated OS entry.
---

# Vendor — openbsd

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `openbsd` |
| Familles | bsd |
| Skill famille OS | `os-bsd` |

## Distributions (registre)

- [`openbsd`](../distributions/openbsd/SKILL.md) — skill `capsuleos-distro-openbsd`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-bsd
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/openbsd/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

