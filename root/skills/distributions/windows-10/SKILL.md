---
name: capsuleos-distro-windows-10
description: CapsuleOS distribution Windows 10 (windows-10) — windows, tier P0, active. Use when editing OS/windows/versions/10/index.html, windows-shell toolkit, or microsoft vendor assets.
---

# Distribution — Windows 10

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `windows-10` |
| Vendor | [`microsoft`](../vendors/microsoft/SKILL.md) |
| Famille | `windows` |
| Tier / statut | P0 / active |
| Toolkit | windows-shell |
| embedKey | `win10` |

## Chemins

- Façade : [`OS/windows/versions/10/index.html`](../../../OS/windows/versions/10/index.html)
- Version : [`windows-10`](../versions/windows-10/SKILL.md)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-windows` (famille) |
| 3 | `capsuleos-vendor-microsoft` (vendor) |
| 4 | `capsuleos-distro-windows-10` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs windows-10`

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

