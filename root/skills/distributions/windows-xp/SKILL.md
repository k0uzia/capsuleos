---
name: capsuleos-distro-windows-xp
description: CapsuleOS distribution Windows XP (windows-xp) — windows, tier P1, active. Use when editing OS/windows/versions/xp/index.html, windows-shell toolkit, or microsoft vendor assets.
---

# Distribution — Windows XP

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `windows-xp` |
| Vendor | [`microsoft`](../vendors/microsoft/SKILL.md) |
| Famille | `windows` |
| Tier / statut | P1 / active |
| Toolkit | windows-shell |
| embedKey | `winxp` |

## Chemins

- Façade : [`OS/windows/versions/xp/index.html`](../../../OS/windows/versions/xp/index.html)
- Version : [`windows-xp`](../versions/windows-xp/SKILL.md)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-windows` (famille) |
| 3 | `capsuleos-vendor-microsoft` (vendor) |
| 4 | `capsuleos-distro-windows-xp` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs windows-xp`

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

