---
name: capsuleos-os-windows
description: Expert on CapsuleOS simulated Windows—versions under OS/windows, shared explorer pages, win shell JS. Use for Windows 95–11, taskbar, or Explorer content wired to home/public manifests.
---

# OS Windows (CapsuleOS)

## Arborescence

| Zone | Chemin |
|------|--------|
| Versions | `OS/windows/versions/<95|98|xp|…|11>/` |
| Partagé | `OS/windows/shared/` (pages, apps style) |
| Shell JS | `usr/lib/capsuleos/shells/windows/` (ex. `win-explorer-content.js`) |
| Contenu FS | `home/public/` — `.capsule-manifest.json` |
| Explorer page | `OS/windows/shared/pages/explorateur.html` |

## Conventions

- Styles par version : `style/imports.css`, `shell.css`, `windows.css`
- Médias : `versions/<ver>/media/img/`
- Fidélité par époque (95 vs 11) — ne pas mélanger les assets entre versions sans intention.

## Rôles fréquents

`role-web-designer`, `role-developer`, `role-designer` (textes `home/public/`).

## Liens

- Home simulé : `home/public/README.md`
- Contrat offline : embed Linux séparé ; Windows via fetch HTTP ou structure locale selon page
