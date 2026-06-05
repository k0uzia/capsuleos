---
name: capsuleos-distro-netbsd
description: CapsuleOS distribution NetBSD (netbsd) — bsd, tier P4, planned. Use when editing netbsd, shell toolkit, or netbsd vendor assets.
---

# Distribution — NetBSD

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `netbsd` |
| Vendor | [`netbsd`](../vendors/netbsd/SKILL.md) |
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
| 3 | `capsuleos-vendor-netbsd` (vendor) |
| 4 | `capsuleos-distro-netbsd` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs netbsd`

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

