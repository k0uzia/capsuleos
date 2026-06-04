---
name: capsuleos-distro-linux-rocky
description: CapsuleOS distribution Rocky Linux (GNOME) (linux-rocky) — linux, tier P3, planned. Use when editing linux-rocky, gnome toolkit, or rocky vendor assets.
---

# Distribution — Rocky Linux (GNOME)

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `linux-rocky` |
| Vendor | [`rocky`](../vendors/rocky/SKILL.md) |
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
| 3 | `capsuleos-vendor-rocky` (vendor) |
| 4 | `capsuleos-distro-linux-rocky` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-rocky`

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

