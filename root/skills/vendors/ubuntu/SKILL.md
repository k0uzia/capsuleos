---
name: capsuleos-vendor-ubuntu
description: CapsuleOS vendor ubuntu — distributions linux-ubuntu, linux-xubuntu. Use when working on ubuntu branding, assets vendors/ubuntu, or any ubuntu simulated OS entry.
---

# Vendor — ubuntu

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `ubuntu` |
| Familles | linux |
| Skill famille OS | `os-linux` |

## Distributions (registre)

- [`linux-ubuntu`](../distributions/linux-ubuntu/SKILL.md) — skill `capsuleos-distro-linux-ubuntu`
- [`linux-xubuntu`](../distributions/linux-xubuntu/SKILL.md) — skill `capsuleos-distro-linux-xubuntu`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-linux
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/ubuntu/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

