---
name: capsuleos-distro-macos-big-sur
description: CapsuleOS distribution macOS Big Sur (macos-big-sur) — macos, tier P3, planned. Use when editing macos-big-sur, macos-aqua toolkit, or apple vendor assets.
---

# Distribution — macOS Big Sur

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `macos-big-sur` |
| Vendor | [`apple`](../vendors/apple/SKILL.md) |
| Famille | `macos` |
| Tier / statut | P3 / planned |
| Toolkit | macos-aqua |
| embedKey | `—` |

## Chemins

- (façade à définir)
- Version : [`macos-big-sur`](../versions/macos-big-sur/SKILL.md)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-macos` (famille) |
| 3 | `capsuleos-vendor-apple` (vendor) |
| 4 | `capsuleos-distro-macos-big-sur` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs macos-big-sur`

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

