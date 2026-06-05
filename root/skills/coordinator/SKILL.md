---
name: capsuleos-coordinator
description: Coordinates multi-role and multi-OS CapsuleOS work by delegating to root/skills role and os skills. Use when a task spans several simulated OS families, roles (design, dev, integration), or needs a structured delivery plan.
---

# Coordinateur CapsuleOS

## Objectif

Découper la demande, assigner les skills `/root/skills/`, séquencer les livrables sans dupliquer le contrat (`writing.md`).

## Étapes

1. **Classifier** : une ou plusieurs familles OS ? Un ou plusieurs rôles ? Migration assets / noyau ?
2. **Noyau / assets** : si migration images, routage `CapsuleResource`, ou `validate-asset-zones` en échec → **`kernel-supervisor`** pilote ; ce coordinateur ne fait que le produit multi-familles.
3. **Charger** : `os-orchestrator` si OS flou ; sinon `os-<famille>` par cible.
4. **Rôles** : ajouter `role-*` (voir [team/equipe.md](../../team/equipe.md)).
5. **Contrat** : rappeler la [checklist `contrib.md`](../../../contrib.md#checklist-contrat-avant-merge-ou-release) avant clôture.
6. **Livrable** : liste fichiers touchés sous `CapsuleOS/` uniquement.

## Matrice rapide

| Signal utilisateur | Skills |
|--------------------|--------|
| « Mint + Ubuntu » | `os-linux`, `role-integrator` |
| « Explorer + fichiers demo » | `os-linux`, `role-designer`, `role-integrator` |
| « XP et 11 » | `os-windows`, `role-web-designer` |
| « Portail + Android » | `role-developer`, `os-android` |
| « Conformité release » | `role-manager` |
| « Migration assets noyau » | `kernel-supervisor` → `asset-pipeline` + `kernel-guardian` |
| « validate-asset-zones échoue » | `kernel-supervisor` (bloquer skins jusqu’à vert) |

## Ne pas

- Réécrire `writing.md`.
- Créer de la doc sous `OS/`.
- Lancer des refactors hors périmètre demandé.
- Contourner `kernel-supervisor` sur une migration assets multi-skins.

## Références

- [AGENTS.md](../../AGENTS.md)
- [docs/familles-os.md](../../docs/familles-os.md)
- [kernel-supervisor/SKILL.md](../kernel-supervisor/SKILL.md)
