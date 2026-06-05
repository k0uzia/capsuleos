---
name: capsuleos-distro-haiku
description: CapsuleOS distribution Haiku OS (haiku) — retro, tier P4, stub. Use when editing haiku, shell toolkit, or haiku vendor assets.
---

# Distribution — Haiku OS

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `haiku` |
| Vendor | [`haiku`](../vendors/haiku/SKILL.md) |
| Famille | `retro` |
| Tier / statut | P4 / stub |
| Toolkit | — |
| embedKey | `—` |

## Chemins

- (façade à définir)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-stub` (famille) |
| 3 | `capsuleos-vendor-haiku` (vendor) |
| 4 | `capsuleos-distro-haiku` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs haiku`

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

