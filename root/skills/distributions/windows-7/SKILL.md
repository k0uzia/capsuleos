---
name: capsuleos-distro-windows-7
description: CapsuleOS distribution Windows 7 (windows-7) — windows, tier P1, active. Use when editing OS/windows/versions/7/index.html, windows-shell toolkit, or microsoft vendor assets.
---

# Distribution — Windows 7

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `windows-7` |
| Vendor | [`microsoft`](../vendors/microsoft/SKILL.md) |
| Famille | `windows` |
| Tier / statut | P1 / active |
| Toolkit | windows-shell |
| embedKey | `win7` |

## Chemins

- Façade : [`OS/windows/versions/7/index.html`](../../../OS/windows/versions/7/index.html)
- Version : [`windows-7`](../versions/windows-7/SKILL.md)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-windows` (famille) |
| 3 | `capsuleos-vendor-microsoft` (vendor) |
| 4 | `capsuleos-distro-windows-7` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs windows-7`

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

