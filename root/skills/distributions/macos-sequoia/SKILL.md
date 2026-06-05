---
name: capsuleos-distro-macos-sequoia
description: CapsuleOS distribution macOS Sequoia (macos-sequoia) — macos, tier P2, planned. Use when editing macos-sequoia, macos-aqua toolkit, or apple vendor assets.
---

# Distribution — macOS Sequoia

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `macos-sequoia` |
| Vendor | [`apple`](../vendors/apple/SKILL.md) |
| Famille | `macos` |
| Tier / statut | P2 / planned |
| Toolkit | macos-aqua |
| embedKey | `—` |

## Chemins

- (façade à définir)
- Version : [`macos-sequoia`](../versions/macos-sequoia/SKILL.md)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-macos` (famille) |
| 3 | `capsuleos-vendor-apple` (vendor) |
| 4 | `capsuleos-distro-macos-sequoia` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs macos-sequoia`

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

