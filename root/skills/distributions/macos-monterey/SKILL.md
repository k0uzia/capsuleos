---
name: capsuleos-distro-macos-monterey
description: CapsuleOS distribution macOS Monterey (macos-monterey) — macos, tier P3, planned. Use when editing macos-monterey, macos-aqua toolkit, or apple vendor assets.
---

# Distribution — macOS Monterey

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `macos-monterey` |
| Vendor | [`apple`](../vendors/apple/SKILL.md) |
| Famille | `macos` |
| Tier / statut | P3 / planned |
| Toolkit | macos-aqua |
| embedKey | `—` |

## Chemins

- (façade à définir)
- Version : [`macos-monterey`](../versions/macos-monterey/SKILL.md)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-macos` (famille) |
| 3 | `capsuleos-vendor-apple` (vendor) |
| 4 | `capsuleos-distro-macos-monterey` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs macos-monterey`

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

