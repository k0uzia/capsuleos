---
name: capsuleos-distro-linux-arch
description: CapsuleOS distribution Arch Linux (linux-arch) — linux, tier P2, planned. Use when editing linux-arch, minimal toolkit, or arch vendor assets.
---

# Distribution — Arch Linux

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `linux-arch` |
| Vendor | [`arch`](../vendors/arch/SKILL.md) |
| Famille | `linux` |
| Tier / statut | P2 / planned |
| Toolkit | minimal |
| embedKey | `—` |

## Chemins

- (façade à définir)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-linux` (famille) |
| 3 | `capsuleos-vendor-arch` (vendor) |
| 4 | `capsuleos-distro-linux-arch` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-arch`

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

