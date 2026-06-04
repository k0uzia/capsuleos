---
name: capsuleos-role-manager
description: Plans CapsuleOS scope, priorities, and contract compliance using contrib.md checklist and writing.md. Use when defining deliverables, release readiness, or scoping multi-OS roadmap work.
---

# Manager CapsuleOS

## Responsabilités

- Cadrer le périmètre (une famille OS / une skin à la fois si possible).
- Vérifier alignement **`writing.md`** et la [checklist contrat](../../../contrib.md#checklist-contrat-avant-merge-ou-release).
- Identifier dépendances : manifestes, embeds, SW cache.

## Avant merge / démo

- [ ] Stack HTML/CSS/ES6 uniquement
- [ ] Offline testé (SW + embeds à jour si gabarits modifiés)
- [ ] Pas de doc nouvelle sous `OS/`
- [ ] Pas de symlinks versionnés ; `CAPSULE_MEDIA_BASE` si skin sans `media/` local

## Roadmap OS

Voir `root/docs/roadmap.md` (Phase 0.5 assets noyau bloquante) et `root/docs/familles-os.md` pour l’état des familles.

Migration images incomplète → ne pas prioriser skins tant que `kernel-supervisor` n’a pas validé `validate-asset-zones.mjs`.

## Délégation multi-équipe

Tâche complexe → skill `coordinator`.

## Liens

- Contrat : `writing.md`
- Checklist : [`contrib.md`](../../../contrib.md#checklist-contrat-avant-merge-ou-release)
