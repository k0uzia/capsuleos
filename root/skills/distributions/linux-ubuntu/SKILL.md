---
name: capsuleos-distro-linux-ubuntu
description: CapsuleOS distribution Ubuntu 25.10 (linux-ubuntu) — linux, tier P0, active. Use when editing OS/linux/families/debian/ubuntu/index.html, gnome toolkit, or ubuntu vendor assets.
---

# Distribution — Ubuntu 25.10

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `linux-ubuntu` |
| Vendor | [`ubuntu`](../vendors/ubuntu/SKILL.md) |
| Famille | `linux` |
| Tier / statut | P0 / active |
| Toolkit | gnome |
| embedKey | `ubuntu` |

## Chemins

- Façade : [`OS/linux/families/debian/ubuntu/index.html`](../../../OS/linux/families/debian/ubuntu/index.html)
- Skin : [`home/Debian/Ubuntu/index.html`](../../../home/Debian/Ubuntu/index.html)
- Version : [`linux-ubuntu-25-10`](../versions/linux-ubuntu-25-10/SKILL.md)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-linux` (famille) |
| 3 | `capsuleos-vendor-ubuntu` (vendor) |
| 4 | `capsuleos-distro-linux-ubuntu` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-ubuntu`

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

