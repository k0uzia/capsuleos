---
name: capsuleos-distro-ios-18
description: CapsuleOS distribution iOS 18 (ios-18) — ios, tier P3, planned. Use when editing ios-18, macos-aqua toolkit, or apple vendor assets.
---

# Distribution — iOS 18

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `ios-18` |
| Vendor | [`apple`](../vendors/apple/SKILL.md) |
| Famille | `ios` |
| Tier / statut | P3 / planned |
| Toolkit | macos-aqua |
| embedKey | `—` |

## Chemins

- (façade à définir)
- Version : [`ios-18`](../versions/ios-18/SKILL.md)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-ios` (famille) |
| 3 | `capsuleos-vendor-apple` (vendor) |
| 4 | `capsuleos-distro-ios-18` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs ios-18`

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

