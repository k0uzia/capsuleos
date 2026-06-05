---
name: capsuleos-distro-linux-popos
description: CapsuleOS distribution Pop!_OS (linux-popos) — linux, tier P2, active. Use when editing OS/linux/families/debian/popos/index.html, cosmic toolkit, or popos vendor assets.
---

# Distribution — Pop!_OS

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `linux-popos` |
| Vendor | [`popos`](../vendors/popos/SKILL.md) |
| Famille | `linux` |
| Tier / statut | P2 / active |
| Toolkit | cosmic |
| embedKey | `popos` |

## Chemins

- Façade : [`OS/linux/families/debian/popos/index.html`](../../../OS/linux/families/debian/popos/index.html)
- Skin : [`home/Debian/PopOS/index.html`](../../../home/Debian/PopOS/index.html)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-linux` (famille) |
| 3 | `capsuleos-vendor-popos` (vendor) |
| 4 | `capsuleos-distro-linux-popos` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-popos`

## Build / gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
node usr/lib/capsuleos/tools/build-embeds-all.mjs  # si apps/strings
```

## Ne pas

- Doc README sous `OS/`
- Médias hors `usr/share/capsuleos/assets/` et `home/public/Images/`

## Références

- [ajouter-os-scalable.md](../../docs/ajouter-os-scalable.md)
- [skills-hierarchie.md](../../docs/skills-hierarchie.md)

