---
name: capsuleos-distro-linux-fedora
description: CapsuleOS distribution Fedora Workstation (linux-fedora) — linux, tier P1, active. Use when editing OS/linux/families/redhat/fedora/index.html, gnome toolkit, or fedora vendor assets.
---

# Distribution — Fedora Workstation

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `linux-fedora` |
| Vendor | [`fedora`](../vendors/fedora/SKILL.md) |
| Famille | `linux` |
| Tier / statut | P1 / active |
| Toolkit | gnome |
| embedKey | `fedora` |

## Chemins

- Façade : [`OS/linux/families/redhat/fedora/index.html`](../../../OS/linux/families/redhat/fedora/index.html)
- Skin : [`home/RedHat/Fedora/index.html`](../../../home/RedHat/Fedora/index.html)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `gnome-hig-replication` |
| 3 | `design-shell-layout` |
| 4 | `os-linux` (famille) |
| 5 | `capsuleos-vendor-fedora` (vendor) |
| 6 | `capsuleos-distro-linux-fedora` (cette fiche) |
| 7 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-fedora`

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

