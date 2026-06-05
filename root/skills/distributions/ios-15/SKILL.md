---
name: capsuleos-distro-ios-15
description: CapsuleOS distribution iOS 15 (ios-15) — ios, tier P2, active. Use when editing OS/ios/15/index.html, macos-aqua toolkit, or apple vendor assets.
---

# Distribution — iOS 15

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `ios-15` |
| Vendor | [`apple`](../vendors/apple/SKILL.md) |
| Famille | `ios` |
| Tier / statut | P2 / active |
| Toolkit | macos-aqua |
| embedKey | `—` |

## Chemins

- Façade : [`OS/ios/15/index.html`](../../../OS/ios/15/index.html)
- Version : [`ios-15`](../versions/ios-15/SKILL.md)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-ios` (famille) |
| 3 | `capsuleos-vendor-apple` (vendor) |
| 4 | `capsuleos-distro-ios-15` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs ios-15`

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

