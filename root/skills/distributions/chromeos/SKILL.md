---
name: capsuleos-distro-chromeos
description: CapsuleOS distribution ChromeOS (chromeos) — chromeos, tier P2, planned. Use when editing chromeos, chromeos toolkit, or google vendor assets.
---

# Distribution — ChromeOS

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `chromeos` |
| Vendor | [`google`](../vendors/google/SKILL.md) |
| Famille | `chromeos` |
| Tier / statut | P2 / planned |
| Toolkit | chromeos |
| embedKey | `—` |

## Chemins

- (façade à définir)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-chromeos` (famille) |
| 3 | `capsuleos-vendor-google` (vendor) |
| 4 | `capsuleos-distro-chromeos` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs chromeos`

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

