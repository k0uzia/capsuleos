---
name: capsuleos-distro-harmonyos
description: CapsuleOS distribution HarmonyOS (harmonyos) — harmonyos, tier P4, stub. Use when editing harmonyos, shell toolkit, or huawei vendor assets.
---

# Distribution — HarmonyOS

## Identité

| Clé | Valeur |
|-----|--------|
| ID registre | `harmonyos` |
| Vendor | [`huawei`](../vendors/huawei/SKILL.md) |
| Famille | `harmonyos` |
| Tier / statut | P4 / stub |
| Toolkit | — |
| embedKey | `—` |

## Chemins

- (façade à définir)
- Version : (entrée catalogue unique — pas de skill version séparé)

## Skills à charger

| Ordre | Skill |
|-------|--------|
| 1 | `onboarding` |
| 2 | `os-harmonyos` (famille) |
| 3 | `capsuleos-vendor-huawei` (vendor) |
| 4 | `capsuleos-distro-harmonyos` (cette fiche) |
| 5 | `capsuleos-lang-*` selon fichiers |

Brief détaillé : `node usr/lib/capsuleos/tools/print-agent-brief.mjs harmonyos`

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

