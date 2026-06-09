---
name: capsuleos-distro-linux-debian-kde
description: CapsuleOS distribution Debian KDE (Plasma) (linux-debian-kde) — linux, tier P2, active. Use when editing OS/linux/families/debian/debian-kde/index.html, kde toolkit, or debian vendor assets.
---

# Distribution — Debian KDE (Plasma)

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `linux-debian-kde` |
| Vendor | [`debian`](../vendors/debian/SKILL.md) |
| Famille | `linux` |
| Tier / statut | P2 / active |
| Toolkit | kde |
| embedKey | `debiankde` |

## Chemins

- Façade : [`OS/linux/families/debian/debian-kde/index.html`](../../../OS/linux/families/debian/debian-kde/index.html)
- Skin : [`home/Debian/Debian-KDE/index.html`](../../../home/Debian/Debian-KDE/index.html)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-clone-from-vm` |
| 3 | `kde-hig-replication` (HIG officiel — Breeze, patterns Plasma) |
| 4 | `os-linux` (famille) |
| 5 | `capsuleos-vendor-debian` (vendor) |
| 6 | `capsuleos-distro-linux-debian-kde` (cette fiche) |
| 7 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-debian-kde`

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

