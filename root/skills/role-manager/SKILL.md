---
name: capsuleos-role-manager
description: Plans CapsuleOS scope, priorities, and contract compliance using CONTRACT_CHECKLIST and writing.md. Use when defining deliverables, release readiness, or scoping multi-OS roadmap work.
---

# Manager CapsuleOS

## Responsabilités

- Cadrer le périmètre (une famille OS / une skin à la fois si possible).
- Vérifier alignement **`writing.md`** et **`CONTRACT_CHECKLIST.md`**.
- Identifier dépendances : manifestes, embeds, SW cache.

## Avant merge / démo

- [ ] Stack HTML/CSS/ES6 uniquement
- [ ] Offline testé (SW + embeds à jour si gabarits modifiés)
- [ ] Pas de doc nouvelle sous `OS/`
- [ ] Pas de symlinks versionnés ; `CAPSULE_MEDIA_BASE` si skin sans `media/` local

## Roadmap OS

Voir `root/docs/familles-os.md` pour l’état des familles (Arch, Slackware, ChromeOS, HarmonyOS = extension).

## Délégation multi-équipe

Tâche complexe → skill `coordinator`.

## Liens

- Contrat : `writing.md`
- Checklist : `CONTRACT_CHECKLIST.md`
