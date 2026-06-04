---
name: capsuleos-distro-ghostbsd
description: CapsuleOS distribution GhostBSD (ghostbsd) — bsd, tier P3, planned. Use when editing ghostbsd, mate toolkit, or ghostbsd vendor assets.
---

# Distribution — GhostBSD

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `ghostbsd` |
| Vendor | [`ghostbsd`](../vendors/ghostbsd/SKILL.md) |
| Famille | `bsd` |
| Tier / statut | P3 / planned |
| Toolkit | mate |
| embedKey | `—` |

## Chemins

- (façade à définir)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-bsd` (famille) |
| 3 | `capsuleos-vendor-ghostbsd` (vendor) |
| 4 | `capsuleos-distro-ghostbsd` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs ghostbsd`

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

