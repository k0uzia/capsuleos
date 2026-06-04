---
name: capsuleos-os-unix
description: Guides CapsuleOS UNIX-family conventions and extension when adding generic UNIX workstations. Use for Solaris, AIX-like, or heritage UNIX UI patterns not covered by Linux or BSD facades.
---

# OS UNIX (CapsuleOS)

## Statut dépôt

Famille **ciblée par le contrat** (`writing.md`) ; structuration dédiée à consolider sous `OS/` (éviter confusion avec Linux/BSD).

## Principes d’extension

1. Créer `OS/unix/<variant>/index.html` (façade).
2. Placer la logique réutilisable dans `usr/lib/capsuleos/shells/unix/` (à créer).
3. Réutiliser **`home/public/`** si un explorateur fichiers type Filer est nécessaire.
4. Documenter l’agent uniquement sous `root/docs/familles-os.md` — pas de README sous `OS/`.

## Différenciation

| Famille | Skill |
|---------|--------|
| Linux distributions | `os-linux` |
| BSD variants | `os-bsd` |
| UNIX générique / legacy | `os-unix` (ce skill) |

## Rôles fréquents

`role-designer`, `role-integrator`, `coordinator` pour cadrage initial.
