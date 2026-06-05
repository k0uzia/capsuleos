---
name: capsuleos-os-macos
description: Expert on CapsuleOS simulated macOS—Sonoma facade, Finder, home/MacOS content manifests. Use for Finder windows, macOS styling, or finder-manifest under home/MacOS.
---

# OS macOS (CapsuleOS)

## Arborescence

| Zone | Chemin |
|------|--------|
| Façade | `OS/macos/sonoma/` (pages, js, style) |
| Finder | `OS/macos/sonoma/pages/finder.html`, `usr/lib/capsuleos/shells/macos/finder.js` |
| Contenu skin | `home/MacOS/Sonoma/content/finder-manifest.json` |
| FS partagé | `home/public/` — `.capsule-finder-manifest.json` |

## Manifestes

Régénération globale :

```bash
node usr/lib/capsuleos/tools/generate-public-manifest.mjs
```

## Rôles fréquents

`role-web-designer`, `role-integrator`, `role-graphic-artist`.

## Note

iOS est une famille distincte → `os-ios`.
