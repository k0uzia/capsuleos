---
name: capsuleos-vendor-haiku
description: CapsuleOS vendor haiku — distributions haiku. Use when working on haiku branding, assets vendors/haiku, or any haiku simulated OS entry.
---

# Vendor — haiku

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `haiku` |
| Familles | retro |
| Skill famille OS | `os-stub` |

## Distributions (registre)

- [`haiku`](../distributions/haiku/SKILL.md) — skill `capsuleos-distro-haiku`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-stub
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/haiku/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

