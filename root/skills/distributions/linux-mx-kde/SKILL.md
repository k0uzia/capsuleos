---
name: capsuleos-distro-linux-mx-kde
description: CapsuleOS distribution MX Linux KDE (linux-mx-kde) — linux, tier P1, active. Use when editing OS/linux/families/debian/mx-kde/index.html, kde toolkit, or mx vendor assets.
---

# Distribution — MX Linux KDE

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `linux-mx-kde` |
| Vendor | [`mx`](../vendors/mx/SKILL.md) |
| Famille | `linux` |
| Tier / statut | P1 / active |
| Toolkit | kde |
| embedKey | `mxkde` |

## Chemins

- Façade : [`OS/linux/families/debian/mx-kde/index.html`](../../../OS/linux/families/debian/mx-kde/index.html)
- Skin : [`home/Debian/MX-KDE/index.html`](../../../home/Debian/MX-KDE/index.html)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-linux` (famille) |
| 3 | `capsuleos-vendor-mx` (vendor) |
| 4 | `capsuleos-distro-linux-mx-kde` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-mx-kde`

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

