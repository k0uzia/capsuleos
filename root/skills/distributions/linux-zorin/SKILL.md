---
name: capsuleos-distro-linux-zorin
description: CapsuleOS distribution Zorin OS (linux-zorin) — linux, tier P3, planned. Use when editing linux-zorin, gnome toolkit, or zorin vendor assets.
---

# Distribution — Zorin OS

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `linux-zorin` |
| Vendor | [`zorin`](../vendors/zorin/SKILL.md) |
| Famille | `linux` |
| Tier / statut | P3 / planned |
| Toolkit | gnome |
| embedKey | `—` |

## Chemins

- (façade à définir)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-linux` (famille) |
| 3 | `capsuleos-vendor-zorin` (vendor) |
| 4 | `capsuleos-distro-linux-zorin` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-zorin`

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

