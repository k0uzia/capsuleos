---
name: capsuleos-vendor-oracle
description: CapsuleOS vendor oracle — distributions solaris-illumos. Use when working on oracle branding, assets vendors/oracle, or any oracle simulated OS entry.
---

# Vendor — oracle

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `oracle` |
| Familles | unix |
| Skill famille OS | `os-unix` |

## Distributions (registre)

- [`solaris-illumos`](../distributions/solaris-illumos/SKILL.md) — skill `capsuleos-distro-solaris-illumos`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-unix
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/oracle/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

