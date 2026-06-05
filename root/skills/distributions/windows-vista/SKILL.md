---
name: capsuleos-distro-windows-vista
description: CapsuleOS distribution Windows Vista (windows-vista) — windows, tier P2, active. Use when editing OS/windows/versions/vista/index.html, windows-shell toolkit, or microsoft vendor assets.
---

# Distribution — Windows Vista

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `windows-vista` |
| Vendor | [`microsoft`](../vendors/microsoft/SKILL.md) |
| Famille | `windows` |
| Tier / statut | P2 / active |
| Toolkit | windows-shell |
| embedKey | `winvista` |

## Chemins

- Façade : [`OS/windows/versions/vista/index.html`](../../../OS/windows/versions/vista/index.html)
- Version : [`windows-vista`](../versions/windows-vista/SKILL.md)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-windows` (famille) |
| 3 | `capsuleos-vendor-microsoft` (vendor) |
| 4 | `capsuleos-distro-windows-vista` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs windows-vista`

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

