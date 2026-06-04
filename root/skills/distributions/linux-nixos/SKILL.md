---
name: capsuleos-distro-linux-nixos
description: CapsuleOS distribution NixOS (concept) (linux-nixos) — linux, tier P4, stub. Use when editing linux-nixos, configurable toolkit, or nixos vendor assets.
---

# Distribution — NixOS (concept)

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `linux-nixos` |
| Vendor | [`nixos`](../vendors/nixos/SKILL.md) |
| Famille | `linux` |
| Tier / statut | P4 / stub |
| Toolkit | configurable |
| embedKey | `—` |

## Chemins

- (façade à définir)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-linux` (famille) |
| 3 | `capsuleos-vendor-nixos` (vendor) |
| 4 | `capsuleos-distro-linux-nixos` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-nixos`

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

