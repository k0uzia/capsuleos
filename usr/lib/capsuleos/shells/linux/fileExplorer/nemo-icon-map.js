/**
 * Lieux virtuels Nemo uniquement (sidebar + vues Récent / Réseau / …).
 * Dossiers et fichiers : fileExplorerInfo.js (catalogue par nom / extension).
 */
(function initCapsuleNemoIconMap(global) {
    'use strict';

    const NEMO = './assets/icons/cinnamon/nemo';

    global.CAPSULE_NEMO_ICON_MAP = {
        Récent: `${NEMO}/places/folder-recent-symbolic.svg`,
        Corbeille: `${NEMO}/user-trash-symbolic.svg`,
        Réseau: `${NEMO}/network-workgroup-symbolic.svg`,
        'Système de fichiers': `${NEMO}/media-removable-symbolic.svg`
    };
}(typeof window !== 'undefined' ? window : globalThis));
