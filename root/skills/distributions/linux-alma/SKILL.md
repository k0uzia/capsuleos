---
name: capsuleos-distro-linux-alma
description: CapsuleOS distribution AlmaLinux (GNOME) (linux-alma) — linux, tier P3, planned. Use when editing linux-alma, gnome toolkit, or alma vendor assets.
---

# Distribution — AlmaLinux (GNOME)

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `linux-alma` |
| Vendor | [`alma`](../vendors/alma/SKILL.md) |
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
| 2 | `gnome-hig-replication` |
| 3 | `design-shell-layout` |
| 4 | `os-linux` (famille) |
| 5 | `capsuleos-vendor-alma` (vendor) |
| 6 | `capsuleos-distro-linux-alma` (cette fiche) |
| 7 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-alma`

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

