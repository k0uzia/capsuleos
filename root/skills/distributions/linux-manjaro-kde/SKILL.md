---
name: capsuleos-distro-linux-manjaro-kde
description: CapsuleOS distribution Manjaro KDE (linux-manjaro-kde) — linux, tier P2, planned. Use when editing linux-manjaro-kde, kde toolkit, or manjaro vendor assets.
---

# Distribution — Manjaro KDE

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `linux-manjaro-kde` |
| Vendor | [`manjaro`](../vendors/manjaro/SKILL.md) |
| Famille | `linux` |
| Tier / statut | P2 / planned |
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
| 3 | `capsuleos-vendor-manjaro` (vendor) |
| 4 | `capsuleos-distro-linux-manjaro-kde` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-manjaro-kde`

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

