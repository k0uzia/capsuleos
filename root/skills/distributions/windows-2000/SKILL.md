---
name: capsuleos-distro-windows-2000
description: CapsuleOS distribution Windows 2000 (windows-2000) — windows, tier P2, active. Use when editing OS/windows/versions/2000/index.html, windows-shell toolkit, or microsoft vendor assets.
---

# Distribution — Windows 2000

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `windows-2000` |
| Vendor | [`microsoft`](../vendors/microsoft/SKILL.md) |
| Famille | `windows` |
| Tier / statut | P2 / active |
| Toolkit | windows-shell |
| embedKey | `win2000` |

## Chemins

- Façade : [`OS/windows/versions/2000/index.html`](../../../OS/windows/versions/2000/index.html)
- Version : [`windows-2000`](../versions/windows-2000/SKILL.md)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-windows` (famille) |
| 3 | `capsuleos-vendor-microsoft` (vendor) |
| 4 | `capsuleos-distro-windows-2000` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs windows-2000`

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

