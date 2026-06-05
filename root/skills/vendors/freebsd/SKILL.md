---
name: capsuleos-vendor-freebsd
description: CapsuleOS vendor freebsd — distributions freebsd. Use when working on freebsd branding, assets vendors/freebsd, or any freebsd simulated OS entry.
---

# Vendor — freebsd

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `freebsd` |
| Familles | bsd |
| Skill famille OS | `os-bsd` |

## Distributions (registre)

- [`freebsd`](../distributions/freebsd/SKILL.md) — skill `capsuleos-distro-freebsd`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-bsd
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/freebsd/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

