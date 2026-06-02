---
name: capsuleos-coordinator
description: Coordinates multi-role and multi-OS CapsuleOS work by delegating to root/skills role and os skills. Use when a task spans several simulated OS families, roles (design, dev, integration), or needs a structured delivery plan.
---

# Coordinateur CapsuleOS

## Objectif

Découper la demande, assigner les skills `/root/skills/`, séquencer les livrables sans dupliquer le contrat (`writing.md`).

## Étapes

1. **Classifier** : une ou plusieurs familles OS ? Un ou plusieurs rôles ?
2. **Charger** : `os-orchestrator` si OS flou ; sinon `os-<famille>` par cible.
3. **Rôles** : ajouter `role-*` (voir [team/equipe.md](../../team/equipe.md)).
4. **Contrat** : rappeler `CONTRACT_CHECKLIST.md` avant clôture.
5. **Livrable** : liste fichiers touchés sous `CapsuleOS/` uniquement.

## Matrice rapide

| Signal utilisateur | Skills |
|--------------------|--------|
| « Mint + Ubuntu » | `os-linux`, `role-integrator` |
| « Explorer + fichiers demo » | `os-linux`, `role-designer`, `role-integrator` |
| « XP et 11 » | `os-windows`, `role-web-designer` |
| « Portail + Android » | `role-developer`, `os-android` |
| « Conformité release » | `role-manager` |

## Ne pas

- Réécrire `writing.md`.
- Créer de la doc sous `OS/`.
- Lancer des refactors hors périmètre demandé.

## Références

- [AGENTS.md](../../AGENTS.md)
- [docs/familles-os.md](../../docs/familles-os.md)
