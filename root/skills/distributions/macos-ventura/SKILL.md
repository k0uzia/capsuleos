---
name: capsuleos-distro-macos-ventura
description: CapsuleOS distribution macOS Ventura (macos-ventura) — macos, tier P2, planned. Use when editing macos-ventura, macos-aqua toolkit, or apple vendor assets.
---

# Distribution — macOS Ventura

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `macos-ventura` |
| Vendor | [`apple`](../vendors/apple/SKILL.md) |
| Famille | `macos` |
| Tier / statut | P2 / planned |
| Toolkit | macos-aqua |
| embedKey | `—` |

## Chemins

- (façade à définir)
- Version : [`macos-ventura`](../versions/macos-ventura/SKILL.md)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-macos` (famille) |
| 3 | `capsuleos-vendor-apple` (vendor) |
| 4 | `capsuleos-distro-macos-ventura` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs macos-ventura`

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

