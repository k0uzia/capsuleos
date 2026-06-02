---
name: capsuleos-os-bsd
description: Expert on CapsuleOS simulated BSD variants under OS/bsd—FreeBSD, GhostBSD, etc. Use when working on BSD desktops, branding icons/bsd, or extending BSD facades.
---

# OS BSD (CapsuleOS)

## Arborescence

| Zone | Chemin |
|------|--------|
| Façade | `OS/bsd/` (ex. sous-dossiers par variante) |
| Icônes | `usr/share/capsuleos/branding/icons/bsd/` (`freebsd.png`, `ghostbsd.png`, …) |

## Extension

Nouvelle variante : miroir du pattern `OS/linux/families/` — entrée HTML sous `OS/bsd/<variant>/`, assets locaux, shell JS partagé dans `usr/lib/capsuleos/shells/` si logique commune.

## Contrat

BSD listé dans `writing.md` §3 ; même stack HTML/CSS/ES6.

## Rôles fréquents

`role-integrator`, `role-graphic-artist`, `role-developer`.
