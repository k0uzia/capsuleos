---
name: capsuleos-distro-linux-steamos
description: CapsuleOS distribution SteamOS / Steam Deck UI (linux-steamos) — linux, tier P3, planned. Use when editing linux-steamos, kde toolkit, or valve vendor assets.
---

# Distribution — SteamOS / Steam Deck UI

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `linux-steamos` |
| Vendor | [`valve`](../vendors/valve/SKILL.md) |
| Famille | `linux` |
| Tier / statut | P3 / planned |
| Toolkit | kde |
| embedKey | `—` |

## Chemins

- (façade à définir)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-linux` (famille) |
| 3 | `capsuleos-vendor-valve` (vendor) |
| 4 | `capsuleos-distro-linux-steamos` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-steamos`

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

