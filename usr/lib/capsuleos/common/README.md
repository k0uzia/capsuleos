# `usr/lib/capsuleos/common/`

JavaScript vanilla partagé entre portail, Windows, Linux et macOS.

| Fichier | API | Rôle |
|---------|-----|------|
| `resizeWindow.js` | `class Resizer` | Poignées de redimensionnement (`#desktop` ou `main` comme borne) |
| `window-drag.js` | `makeDraggable(element, options?)` | Déplacement fenêtre ; `options.requireHeader` pour le shell Windows |
| `background.js` | (IIFE) | Animation fond portail (`--bleu` → `--violet`) |
| `user-home.js` | `CapsuleUserHome`, `CAPSULE_USER_HOME` | Home simulé partagé `home/public/` (voir `.cursor/ARCHITECTURE.md` §11) |

<<<<<<< HEAD
=======
### Shell Linux

Charger dans l’ordre (chemins depuis `home/…/index.html`) :

1. `common/resizeWindow.js`
2. `common/window-drag.js`
3. `shells/linux/linux-desktop-shell.js` (garde-fou)
4. `shells/linux/windowContainer.js`
5. `shells/linux/windowHeaderButton.js`

>>>>>>> d83a78d (refactorisation générale)
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
<<<<<<< HEAD
=======

### Home partagé (`home/public/`)

Après ajout de fichiers sous `home/public/`, régénérer les manifestes et l’embed Linux :

```bash
node usr/lib/capsuleos/tools/generate-public-manifest.mjs
node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs
```

Les skins Linux définissent `CAPSULE_CONTENT_ROOT = CapsuleUserHome.fromRepoDepth(3)` ; Windows et les pages iframe utilisent `CapsuleUserHome.resolveRelative()`.

### Explorateurs Linux (Nemo / Dolphin / Nautilus)

Gabarits communs : `usr/share/capsuleos/linux/explorers/`. Scripts noyau :

- `shells/linux/explorers/explorer-registry.js`
- `shells/linux/explorers/commons/explorer-home.js`
- `shells/linux/explorers/explorer-runtime.js`

Charger ces trois scripts après `user-home.js`, avant `contentLoader.js`. Voir `usr/share/capsuleos/linux/explorers/README.md`.
>>>>>>> d83a78d (refactorisation générale)
