# Convention — contexte fenêtres (référence macOS Sonoma)

Objectif : **même cycle de vie** que macOS Sonoma (ouverture → chrome → drag → resize → activation) sur **tous les vendors** CapsuleOS (Linux, Windows, macOS, Android), avec un habillage visuel par toolkit.

## Référence fonctionnelle

macOS Sonoma : à chaque ouverture de `.windowElement`, le shell clone le chrome, appelle `makeDraggable` + `makeResizable`, active la fenêtre. C’est le comportement cible, factorisé dans le noyau commun.

## Modules communs (`usr/lib/capsuleos/shells/common/`)

| Script | Rôle |
|--------|------|
| `capsule-window-context.js` | `CAPSULE_WINDOW_CONTEXT` + défauts par famille (`linux`, `macos`, `windows`, `android`) |
| `capsule-window-shell.js` | `CapsuleWindowShell` — ouverture/fermeture, liens `target="windowElement"` |
| `capsule-desktop-shell.js` | Garde-fou chargement + `boot()` |
| `capsule-window-header-buttons.js` | Fermer / réduire / maximiser (`.windowElement`, `.win-window`) |

Noyau : `common/capsule-window.js`, `resizeWindow.js`, `window-drag.js`.

## Ordre de chargement (toutes familles)

1. `capsule-window.js` → `resizeWindow.js` → `window-drag.js`
2. Scripts **common** ci-dessus (dans l’ordre du tableau)
3. Shell vendor :
   - Linux : `shells/linux/windowContainer.js`
   - macOS : `OS/macos/…/js/windowContainer.js`
   - Windows : `kernel/js/windowManager.js` (après `win-window-drag.js`)
   - Android : `OS/android/js/windowContainer.js`

Optionnel : `window.CAPSULE_WINDOW_FAMILY = 'linux'|'macos'|'windows'|'android'` ou profil `skin.profile.json` → `capsuleGlobals.CAPSULE_WINDOW_CONTEXT`.

## Contexte déclaratif

```js
window.CAPSULE_WINDOW_CONTEXT = {
  draggable: true,
  resizable: true,
  forceOnOpen: true,
  skipSlots: ['mainMenu'],
  bounds: {
    mainSelector: 'object#desktop, #desktop',
    desktopSelector: 'object#desktop, #desktop',
    footerSelector: 'footer, #tableau',
    subtractFooter: false, // #desktop CSS exclut déjà le panel Mint
  },
};
```

Source canonique : `etc/capsuleos/profiles/linux-mint.json` → `node usr/lib/capsuleos/tools/build-skin-profiles.mjs` (obligatoire après modification du contexte).

API globale : `CapsuleWindowContext` (alias `CapsuleLinuxWindowContext`).

## Cycle de vie

1. Clic lien → `CapsuleWindowShell.handleOpen`
2. Affichage + `beforeOpen` (tailles CSS Linux, icônes KDE, iframe Finder macOS, …)
3. `CapsuleWindowContext.ensureWindowChrome` + `applyWindowInteraction({ force: true })`
4. Injection app → `capsule:slot-injected` → re-bind
5. Boutons header → `capsule-window-header-buttons.js`

## Gate

```bash
node usr/lib/capsuleos/tools/validate-desktop-window-boot.mjs
```

(intégré à `validate-capsule.mjs`)

## Skills

- `window-desktop` — diagnostic drag/resize
- `os-linux` / vendors — habillage CSS uniquement ; pas de logique drag dupliquée

## Références

- [usr/lib/capsuleos/common/window/README.md](../../usr/lib/capsuleos/common/window/README.md)
- [contrib.md § Noyau fenêtre](../../contrib.md#12-noyau-fenetre-capsule-windowjs)
