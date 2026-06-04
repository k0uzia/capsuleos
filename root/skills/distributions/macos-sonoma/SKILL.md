---
name: capsuleos-distro-macos-sonoma
description: CapsuleOS distribution macOS Sonoma (macos-sonoma) — macos, tier P1, active. Use when editing OS/macos/sonoma/index.html, macos-aqua toolkit, or apple vendor assets.
---

# Distribution — macOS Sonoma

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `macos-sonoma` |
| Vendor | [`apple`](../vendors/apple/SKILL.md) |
| Famille | `macos` |
| Tier / statut | P1 / active |
| Toolkit | macos-aqua |
| embedKey | `sonoma` |

## Chemins

- Façade : [`OS/macos/sonoma/index.html`](../../../OS/macos/sonoma/index.html)
- Version : [`macos-sonoma`](../versions/macos-sonoma/SKILL.md)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-macos` (famille) |
| 3 | `capsuleos-vendor-apple` (vendor) |
| 4 | `capsuleos-distro-macos-sonoma` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs macos-sonoma`

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

