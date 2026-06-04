---
name: capsuleos-os-chromeos
description: Plans CapsuleOS ChromeOS simulation extension—shelf, launcher, Chrome-like shell. Use when adding ChromeOS to the portal or designing Chromebook UI before OS/chromeos exists in the repo.
---

# OS ChromeOS (CapsuleOS) — extension

## Statut

Famille **non présente** encore sous `OS/chromeos/`. Ce skill cadrage l’implémentation future conforme à `writing.md`.

## Cible architecture

| Élément | Emplacement proposé |
|---------|---------------------|
| Façade | `OS/chromeos/<version>/index.html` |
| Shell JS | `usr/lib/capsuleos/shells/chromeos/` |
| Assets | `usr/share/capsuleos/chromeos/` ou skin sous `home/ChromeOS/` |
| Fichiers user | réutiliser `home/public/` si explorateur « Files » |

## Repères UX

Shelf (barre basse), launcher circulaire/grille, fenêtres arrondies type Ash, intégration navigateur simulé (HTML statique).

## Procédure

1. Lire [os-stub/SKILL.md](../os-stub/SKILL.md).
2. Mettre à jour [docs/familles-os.md](../../docs/familles-os.md) à la création.
3. Carte portail + icônes `./assets/images/platforms/pick-os/`.

## Rôles

`coordinator`, `role-designer`, `role-integrator` en phase 1.
