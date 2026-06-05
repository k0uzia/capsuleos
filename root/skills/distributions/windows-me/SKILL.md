---
name: capsuleos-distro-windows-me
description: CapsuleOS distribution Windows ME (windows-me) — windows, tier P2, active. Use when editing OS/windows/versions/me/index.html, windows-shell toolkit, or microsoft vendor assets.
---

# Distribution — Windows ME

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `windows-me` |
| Vendor | [`microsoft`](../vendors/microsoft/SKILL.md) |
| Famille | `windows` |
| Tier / statut | P2 / active |
| Toolkit | windows-shell |
| embedKey | `winme` |

## Chemins

- Façade : [`OS/windows/versions/me/index.html`](../../../OS/windows/versions/me/index.html)
- Version : [`windows-me`](../versions/windows-me/SKILL.md)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-windows` (famille) |
| 3 | `capsuleos-vendor-microsoft` (vendor) |
| 4 | `capsuleos-distro-windows-me` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs windows-me`

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

