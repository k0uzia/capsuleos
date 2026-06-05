---
name: capsuleos-distro-linux-mint
description: CapsuleOS distribution Linux Mint (Cinnamon) (linux-mint) — linux, tier P0, active. Use when editing OS/linux/families/debian/mint/index.html, cinnamon toolkit, or mint vendor assets.
---

# Distribution — Linux Mint (Cinnamon)

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `linux-mint` |
| Vendor | [`mint`](../vendors/mint/SKILL.md) |
| Famille | `linux` |
| Tier / statut | P0 / active |
| Toolkit | cinnamon |
| embedKey | `mint` |

## Chemins

- Façade : [`OS/linux/families/debian/mint/index.html`](../../../OS/linux/families/debian/mint/index.html)
- Skin : [`home/Debian/Mint/index.html`](../../../home/Debian/Mint/index.html)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-linux` (famille) |
| 3 | `capsuleos-vendor-mint` (vendor) |
| 4 | `capsuleos-distro-linux-mint` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-mint`

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

