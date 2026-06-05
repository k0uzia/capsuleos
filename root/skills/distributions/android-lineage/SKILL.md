---
name: capsuleos-distro-android-lineage
description: CapsuleOS distribution LineageOS (style AOSP) (android-lineage) — android, tier P3, planned. Use when editing android-lineage, android-material toolkit, or lineage vendor assets.
---

# Distribution — LineageOS (style AOSP)

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `android-lineage` |
| Vendor | [`lineage`](../vendors/lineage/SKILL.md) |
| Famille | `android` |
| Tier / statut | P3 / planned |
| Toolkit | android-material |
| embedKey | `—` |

## Chemins

- (façade à définir)
- Version : [`android-lineage`](../versions/android-lineage/SKILL.md)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-android` (famille) |
| 3 | `capsuleos-vendor-lineage` (vendor) |
| 4 | `capsuleos-distro-android-lineage` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs android-lineage`

## Build / gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Ne pas

- Doc README sous `OS/`
- Médias hors `usr/share/capsuleos/assets/` et `home/public/Images/`

## Références

- [ajouter-os-scalable.md](../../docs/ajouter-os-scalable.md)
- [skills-hierarchie.md](../../docs/skills-hierarchie.md)

