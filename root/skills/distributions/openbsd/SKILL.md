---
name: capsuleos-distro-openbsd
description: CapsuleOS distribution OpenBSD (openbsd) — bsd, tier P4, planned. Use when editing openbsd, shell toolkit, or openbsd vendor assets.
---

# Distribution — OpenBSD

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `openbsd` |
| Vendor | [`openbsd`](../vendors/openbsd/SKILL.md) |
| Famille | `bsd` |
| Tier / statut | P4 / planned |
| Toolkit | — |
| embedKey | `—` |

## Chemins

- (façade à définir)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-bsd` (famille) |
| 3 | `capsuleos-vendor-openbsd` (vendor) |
| 4 | `capsuleos-distro-openbsd` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs openbsd`

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

