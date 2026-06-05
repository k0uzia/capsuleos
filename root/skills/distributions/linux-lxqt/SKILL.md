---
name: capsuleos-distro-linux-lxqt
description: CapsuleOS distribution LXQt (générique) (linux-lxqt) — linux, tier P4, planned. Use when editing linux-lxqt, lxqt toolkit, or generic vendor assets.
---

# Distribution — LXQt (générique)

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `linux-lxqt` |
| Vendor | [`generic`](../vendors/generic/SKILL.md) |
| Famille | `linux` |
| Tier / statut | P4 / planned |
| Toolkit | lxqt |
| embedKey | `—` |

## Chemins

- (façade à définir)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-linux` (famille) |
| 3 | `capsuleos-vendor-generic` (vendor) |
| 4 | `capsuleos-distro-linux-lxqt` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-lxqt`

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

