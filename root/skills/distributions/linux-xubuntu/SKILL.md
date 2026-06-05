---
name: capsuleos-distro-linux-xubuntu
description: CapsuleOS distribution Xubuntu (Xfce) (linux-xubuntu) — linux, tier P3, planned. Use when editing linux-xubuntu, xfce toolkit, or ubuntu vendor assets.
---

# Distribution — Xubuntu (Xfce)

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `linux-xubuntu` |
| Vendor | [`ubuntu`](../vendors/ubuntu/SKILL.md) |
| Famille | `linux` |
| Tier / statut | P3 / planned |
| Toolkit | xfce |
| embedKey | `—` |

## Chemins

- (façade à définir)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-linux` (famille) |
| 3 | `capsuleos-vendor-ubuntu` (vendor) |
| 4 | `capsuleos-distro-linux-xubuntu` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-xubuntu`

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

