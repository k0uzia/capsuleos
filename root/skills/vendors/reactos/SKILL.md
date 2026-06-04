---
name: capsuleos-vendor-reactos
description: CapsuleOS vendor reactos — distributions reactos. Use when working on reactos branding, assets vendors/reactos, or any reactos simulated OS entry.
---

# Vendor — reactos

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `reactos` |
| Familles | retro |
| Skill famille OS | `os-stub` |

## Distributions (registre)

- [`reactos`](../distributions/reactos/SKILL.md) — skill `capsuleos-distro-reactos`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-stub
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/reactos/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

