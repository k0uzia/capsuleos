# `usr/lib/capsuleos/common/`

JavaScript vanilla partagé entre portail, Windows, Linux et macOS.

| Fichier | API | Rôle |
|---------|-----|------|
| `resizeWindow.js` | `class Resizer` | Poignées de redimensionnement (`#desktop` ou `main` comme borne) |
| `window-drag.js` | `makeDraggable(element, options?)` | Déplacement fenêtre ; `options.requireHeader` pour le shell Windows |
| `background.js` | (IIFE) | Animation fond portail (`--bleu` → `--violet`) |
| `user-home.js` | `CapsuleUserHome`, `CAPSULE_USER_HOME` | Home simulé partagé `home/public/` (voir `.cursor/ARCHITECTURE.md` §11) |

### Shell Windows

Charger dans l’ordre :

1. `common/window-drag.js`
2. `shells/windows/win-window-drag.js` (fixe `requireHeader: true`)
3. `common/resizeWindow.js`

### Chemins relatifs (exemples)

| Depuis | Vers `common/` |
|--------|----------------|
| `home/Windows/11/index.html` | `../../../usr/lib/capsuleos/common/` |
| `OS/linux/families/debian/mint/index.html` | `../../../../../usr/lib/capsuleos/common/` |
| `OS/macos/sonoma/index.html` | `../../../../usr/lib/capsuleos/common/` |

Phase 6 : charger uniquement `usr/lib/capsuleos/common/` (shims racine et sous `OS/` supprimés).
