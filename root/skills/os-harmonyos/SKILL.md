---
name: capsuleos-os-harmonyos
description: Plans CapsuleOS HarmonyOS simulation extension—Harmony shell, cards, Huawei-style patterns. Use when adding HarmonyOS to the portal or designing Harmony UI before OS/harmonyos exists in the repo.
---

# OS HarmonyOS (CapsuleOS) — extension

## Statut

Famille **non présente** encore sous `OS/harmonyos/`. Skill de cadrage pour implémentation future.

## Cible architecture

| Élément | Emplacement proposé |
|---------|---------------------|
| Façade | `OS/harmonyos/<version>/index.html` |
| Shell JS | `usr/lib/capsuleos/shells/harmonyos/` |
| Assets | `usr/share/capsuleos/harmonyos/` |
| Home skin optionnel | `home/HarmonyOS/` |

## Repères UX

Navigation par cartes / scénarios, centre de contrôle, cohérence avec guidelines Harmony (couleurs, typographie) dans la limite HTML/CSS pur.

## Procédure

1. Suivre [os-stub/SKILL.md](../os-stub/SKILL.md).
2. Documenter dans `root/docs/familles-os.md` uniquement.
3. Pas de README sous `OS/`.

## Rôles

`role-designer`, `role-web-designer`, `role-integrator`.
