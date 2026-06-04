---
name: capsuleos-distro-reactos
description: CapsuleOS distribution ReactOS (reactos) — retro, tier P4, stub. Use when editing reactos, windows-shell toolkit, or reactos vendor assets.
---

# Distribution — ReactOS

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `reactos` |
| Vendor | [`reactos`](../vendors/reactos/SKILL.md) |
| Famille | `retro` |
| Tier / statut | P4 / stub |
| Toolkit | windows-shell |
| embedKey | `—` |

## Chemins

- (façade à définir)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-stub` (famille) |
| 3 | `capsuleos-vendor-reactos` (vendor) |
| 4 | `capsuleos-distro-reactos` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs reactos`

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

