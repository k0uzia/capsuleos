---
name: capsuleos-distro-ios-17
description: CapsuleOS distribution iOS 17 (ios-17) — ios, tier P3, planned. Use when editing ios-17, macos-aqua toolkit, or apple vendor assets.
---

# Distribution — iOS 17

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `ios-17` |
| Vendor | [`apple`](../vendors/apple/SKILL.md) |
| Famille | `ios` |
| Tier / statut | P3 / planned |
| Toolkit | macos-aqua |
| embedKey | `—` |

## Chemins

- (façade à définir)
- Version : [`ios-17`](../versions/ios-17/SKILL.md)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-ios` (famille) |
| 3 | `capsuleos-vendor-apple` (vendor) |
| 4 | `capsuleos-distro-ios-17` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs ios-17`

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

