---
name: capsuleos-distro-linux-elementary
description: CapsuleOS distribution elementary OS (linux-elementary) — linux, tier P2, planned. Use when editing linux-elementary, pantheon toolkit, or elementary vendor assets.
---

# Distribution — elementary OS

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `linux-elementary` |
| Vendor | [`elementary`](../vendors/elementary/SKILL.md) |
| Famille | `linux` |
| Tier / statut | P2 / planned |
| Toolkit | pantheon |
| embedKey | `—` |

## Chemins

- (façade à définir)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-linux` (famille) |
| 3 | `capsuleos-vendor-elementary` (vendor) |
| 4 | `capsuleos-distro-linux-elementary` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-elementary`

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

