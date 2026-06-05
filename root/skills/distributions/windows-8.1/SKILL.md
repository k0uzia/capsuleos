---
name: capsuleos-distro-windows-8.1
description: CapsuleOS distribution Windows 8.1 (windows-8.1) — windows, tier P2, active. Use when editing OS/windows/versions/8.1/index.html, windows-shell toolkit, or microsoft vendor assets.
---

# Distribution — Windows 8.1

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `windows-8.1` |
| Vendor | [`microsoft`](../vendors/microsoft/SKILL.md) |
| Famille | `windows` |
| Tier / statut | P2 / active |
| Toolkit | windows-shell |
| embedKey | `win8.1` |

## Chemins

- Façade : [`OS/windows/versions/8.1/index.html`](../../../OS/windows/versions/8.1/index.html)
- Version : [`windows-8.1`](../versions/windows-8.1/SKILL.md)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-windows` (famille) |
| 3 | `capsuleos-vendor-microsoft` (vendor) |
| 4 | `capsuleos-distro-windows-8.1` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs windows-8.1`

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

