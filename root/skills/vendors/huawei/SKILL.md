---
name: capsuleos-vendor-huawei
description: CapsuleOS vendor huawei — distributions harmonyos. Use when working on huawei branding, assets vendors/huawei, or any huawei simulated OS entry.
---

# Vendor — huawei

## Périmètre

| Champ | Valeur |
|-------|--------|
| Vendor | `huawei` |
| Familles | harmonyos |
| Skill famille OS | `os-harmonyos` |

## Distributions (registre)

- [`harmonyos`](../distributions/harmonyos/SKILL.md) — skill `capsuleos-distro-harmonyos`

## Chaîne agent

1. `onboarding` → `validate-all.mjs`
2. Skill **famille** : os-harmonyos
3. Skill **distribution** : `capsuleos-distro-<id>` pour l’entrée ciblée
4. Skill **version** si applicable : `capsuleos-version-*`
5. Skill **langage** selon fichiers touchés : `capsuleos-lang-javascript`, `capsuleos-lang-css`, …

## Assets

- Pack vendor : `usr/share/capsuleos/assets/images/vendors/huawei/`
- Ne pas créer de médias hors zones autorisées ([politique-assets.md](../../docs/politique-assets.md))

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Références

- [skills-hierarchie.md](../../docs/skills-hierarchie.md)
- [repertoire-os.md](../../docs/repertoire-os.md)

