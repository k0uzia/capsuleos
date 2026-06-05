---
name: capsuleos-distro-windows-98
description: CapsuleOS distribution Windows 98 (windows-98) — windows, tier P2, active. Use when editing OS/windows/versions/98/index.html, windows-shell toolkit, or microsoft vendor assets.
---

# Distribution — Windows 98

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `windows-98` |
| Vendor | [`microsoft`](../vendors/microsoft/SKILL.md) |
| Famille | `windows` |
| Tier / statut | P2 / active |
| Toolkit | windows-shell |
| embedKey | `win98` |

## Chemins

- Façade : [`OS/windows/versions/98/index.html`](../../../OS/windows/versions/98/index.html)
- Version : [`windows-98`](../versions/windows-98/SKILL.md)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-windows` (famille) |
| 3 | `capsuleos-vendor-microsoft` (vendor) |
| 4 | `capsuleos-distro-windows-98` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs windows-98`

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

