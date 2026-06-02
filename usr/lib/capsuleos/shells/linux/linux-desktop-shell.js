/**
 * Garde-fou du chrome fenêtre Linux (drag + resize).
 * Charger après `common/resizeWindow.js` et `common/window-drag.js`, avant `windowContainer.js`.
 */
(function validateLinuxDesktopShell(global) {
    'use strict';

    const missing = [];
    if (typeof global.makeDraggable !== 'function') {
        missing.push('makeDraggable (usr/lib/capsuleos/common/window-drag.js)');
    }
    if (typeof global.Resizer !== 'function') {
        missing.push('Resizer (usr/lib/capsuleos/common/resizeWindow.js)');
    }
    if (missing.length) {
        console.error(
            '[CapsuleOS] linux-desktop-shell: charger dans l’ordre resizeWindow.js → window-drag.js → linux-desktop-shell.js → windowContainer.js. Manquant:',
            missing.join(', ')
        );
    }
}(typeof window !== 'undefined' ? window : globalThis));
