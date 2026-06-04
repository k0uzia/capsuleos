---
name: capsuleos-distro-linux-anduinos
description: CapsuleOS distribution AnduinOS (linux-anduinos) — linux, tier P3, active. Use when editing OS/linux/families/debian/anduinos/index.html, gnome toolkit, or anduin vendor assets.
---

# Distribution — AnduinOS

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `linux-anduinos` |
| Vendor | [`anduin`](../vendors/anduin/SKILL.md) |
| Famille | `linux` |
| Tier / statut | P3 / active |
| Toolkit | gnome |
| embedKey | `anduinos` |

## Chemins

- Façade : [`OS/linux/families/debian/anduinos/index.html`](../../../OS/linux/families/debian/anduinos/index.html)
- Skin : [`home/Debian/AnduinOS/index.html`](../../../home/Debian/AnduinOS/index.html)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-linux` (famille) |
| 3 | `capsuleos-vendor-anduin` (vendor) |
| 4 | `capsuleos-distro-linux-anduinos` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-anduinos`

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

