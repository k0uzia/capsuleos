---
name: capsuleos-distro-linux-kde-neon
description: CapsuleOS distribution KDE neon User Edition (linux-kde-neon) — linux, tier P2, active. Use when editing OS/linux/families/debian/kde-neon/index.html, kde toolkit, or neon vendor assets.
---

# Distribution — KDE neon User Edition

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `linux-kde-neon` |
| Vendor | [`neon`](../vendors/neon/SKILL.md) |
| Famille | `linux` |
| Tier / statut | P2 / planned |
| Toolkit | kde |
| embedKey | `kde-neon` |

## Chemins

- Façade : [`OS/linux/families/debian/kde-neon/index.html`](../../../OS/linux/families/debian/kde-neon/index.html)
- Skin : [`home/Debian/KDE-Neon/index.html`](../../../home/Debian/KDE-Neon/index.html)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-linux` (famille) |
| 3 | `capsuleos-vendor-neon` (vendor) |
| 4 | `capsuleos-distro-linux-kde-neon` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-kde-neon`

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

