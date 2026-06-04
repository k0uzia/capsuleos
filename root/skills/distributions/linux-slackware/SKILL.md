---
name: capsuleos-distro-linux-slackware
description: CapsuleOS distribution Slackware (linux-slackware) — linux, tier P4, planned. Use when editing linux-slackware, xfce toolkit, or slackware vendor assets.
---

# Distribution — Slackware

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `linux-slackware` |
| Vendor | [`slackware`](../vendors/slackware/SKILL.md) |
| Famille | `linux` |
| Tier / statut | P4 / planned |
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
| 3 | `capsuleos-vendor-slackware` (vendor) |
| 4 | `capsuleos-distro-linux-slackware` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-slackware`

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

