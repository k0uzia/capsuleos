---
name: capsuleos-distro-linux-opensuse
description: CapsuleOS distribution openSUSE Tumbleweed (linux-opensuse) — linux, tier P1, active. Use when editing OS/linux/families/suse/opensuse/index.html, kde toolkit, or opensuse vendor assets.
---

# Distribution — openSUSE Tumbleweed

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `linux-opensuse` |
| Vendor | [`opensuse`](../vendors/opensuse/SKILL.md) |
| Famille | `linux` |
| Tier / statut | P1 / active |
| Toolkit | kde |
| embedKey | `opensuse` |

## Chemins

- Façade : [`OS/linux/families/suse/opensuse/index.html`](../../../OS/linux/families/suse/opensuse/index.html)
- Skin : [`home/SUSE/openSUSE/index.html`](../../../home/SUSE/openSUSE/index.html)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-linux` (famille) |
| 3 | `capsuleos-vendor-opensuse` (vendor) |
| 4 | `capsuleos-distro-linux-opensuse` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-opensuse`

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

