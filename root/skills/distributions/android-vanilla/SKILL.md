---
name: capsuleos-distro-android-vanilla
description: CapsuleOS distribution Android (Vanilla Ice Cream) (android-vanilla) — android, tier P1, active. Use when editing OS/android/index.html, android-material toolkit, or google vendor assets.
---

# Distribution — Android (Vanilla Ice Cream)

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `android-vanilla` |
| Vendor | [`google`](../vendors/google/SKILL.md) |
| Famille | `android` |
| Tier / statut | P1 / active |
| Toolkit | android-material |
| embedKey | `android` |

## Chemins

- Façade : [`OS/android/index.html`](../../../OS/android/index.html)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-android` (famille) |
| 3 | `capsuleos-vendor-google` (vendor) |
| 4 | `capsuleos-distro-android-vanilla` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs android-vanilla`

## Build / gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Ne pas

- Doc README sous `OS/`
- Médias hors `usr/share/capsuleos/assets/` et `home/public/Images/`

## Références

- [ajouter-os-scalable.md](../../docs/ajouter-os-scalable.md)
- [skills-hierarchie.md](../../docs/skills-hierarchie.md)

