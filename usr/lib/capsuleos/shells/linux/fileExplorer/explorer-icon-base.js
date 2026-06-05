/**
 * Base icônes explorateur : Cinnamon/Nemo (Mint) vs Adwaita/Nautilus (GNOME Rocky, Fedora).
 * Fichiers sous icons/gnome/adwaita/ : pull-vm-assets.sh (VM ground truth).
 */
(function initCapsuleExplorerIconBase(global) {
    'use strict';

    const CINNAMON_BASE = './assets/icons/cinnamon/nemo';
    const GNOME_BASE = './assets/icons/gnome/adwaita';

    /** Icônes toolbar connues → sous-dossier symbolic (hors sidebar). */
    const SYMBOLIC_SUBDIR_MAP = {
        'go-previous-symbolic.svg': 'symbolic/actions',
        'go-next-symbolic.svg': 'symbolic/actions',
        'go-up-symbolic.svg': 'symbolic/actions',
        'pan-start-symbolic.svg': 'symbolic/actions',
        'pan-end-symbolic.svg': 'symbolic/actions',
        'view-grid-symbolic.svg': 'symbolic/actions',
        'view-list-symbolic.svg': 'symbolic/actions',
        'view-compact-symbolic.svg': 'symbolic/actions',
        'system-search-symbolic.svg': 'symbolic/actions',
        'find-location-symbolic.svg': 'symbolic/actions',
        'sidebar-show-symbolic.svg': 'symbolic/actions',
        'starred-symbolic.svg': 'symbolic/status',
        'network-workgroup-symbolic.svg': 'symbolic/places',
    };

    /** Noms Mint/Cinnamon → chemin relatif sous icons/gnome/adwaita/ (VM Adwaita). */
    const ADWAITA_LEAF_MAP = {
        'recent.svg': 'places/document-open-recent-symbolic.svg',
        'location-symbolic.svg': 'symbolic/actions/find-location-symbolic.svg',
        'search-symbolic.svg': 'symbolic/actions/system-search-symbolic.svg',
        'view-compact-symbolic.svg': 'symbolic/actions/view-grid-symbolic.svg',
        'view-grid-symbolic.svg': 'symbolic/actions/view-grid-symbolic.svg',
        'view-list-symbolic.svg': 'symbolic/actions/view-list-symbolic.svg',
        'go-previous-symbolic.svg': 'symbolic/actions/go-previous-symbolic.svg',
        'go-next-symbolic.svg': 'symbolic/actions/go-next-symbolic.svg',
        'go-up-symbolic.svg': 'symbolic/actions/go-up-symbolic.svg',
        'sidebar-places-symbolic.svg': 'symbolic/actions/sidebar-show-symbolic.svg',
        'sidebar-tree-symbolic.svg': 'symbolic/actions/sidebar-show-symbolic.svg',
        'sidebar-hide-symbolic.svg': 'symbolic/actions/sidebar-show-symbolic.svg',
        'starred-symbolic.svg': 'symbolic/status/starred-symbolic.svg',
        'folder.svg': 'places/folder.svg',
        'network-workgroup-symbolic.svg': 'symbolic/places/network-workgroup-symbolic.svg',
        'pan-end-symbolic.svg': 'symbolic/actions/go-next-symbolic.svg',
        'open-menu-symbolic.svg': 'symbolic/actions/open-menu-symbolic.svg',
        'view-more-symbolic.svg': 'symbolic/actions/view-more-symbolic.svg',
        'tab-new.svg': 'symbolic/actions/open-menu-symbolic.svg',
        'find-location-symbolic.svg': 'symbolic/actions/find-location-symbolic.svg',
    };

    function usesGnomeAdwaita() {
        const bodyId = global.document && global.document.body ? global.document.body.id : '';
        if (bodyId === 'rocky' || bodyId === 'fedora') {
            return true;
        }
        const packs = global.CAPSULE_SKIN_PROFILE_ICON_PACKS;
        if (Array.isArray(packs) && packs.includes('icons/gnome')) {
            return true;
        }
        return false;
    }

    function explorerPlacesBase() {
        return usesGnomeAdwaita() ? `${GNOME_BASE}/places` : CINNAMON_BASE;
    }

    function remapLeaf(leaf, context) {
        if (ADWAITA_LEAF_MAP[leaf]) {
            return ADWAITA_LEAF_MAP[leaf];
        }
        const folderSymbolic = /^folder-(.+)-symbolic\.svg$/.exec(leaf);
        if (folderSymbolic) {
            if (context === 'sidebar') {
                return `symbolic/places/folder-${folderSymbolic[1]}-symbolic.svg`;
            }
            return `places/folder-${folderSymbolic[1]}.svg`;
        }
        if (leaf === 'user-home-symbolic.svg') {
            return context === 'sidebar'
                ? 'symbolic/places/user-home-symbolic.svg'
                : 'places/user-home.svg';
        }
        if (leaf === 'user-trash-symbolic.svg') {
            return context === 'sidebar'
                ? 'symbolic/places/user-trash-symbolic.svg'
                : 'places/user-trash.svg';
        }
        if (leaf.endsWith('-symbolic.svg')) {
            if (context === 'sidebar') {
                return `symbolic/places/${leaf}`;
            }
            const subdir = SYMBOLIC_SUBDIR_MAP[leaf] || 'symbolic/actions';
            return `${subdir}/${leaf}`;
        }
        if (/^folder-[^/]+\.svg$/.test(leaf) || /^user-(home|trash|desktop)\.svg$/.test(leaf)) {
            return `places/${leaf}`;
        }
        return null;
    }

    function resolveAssetUrl(path) {
        if (global.resolveCapsuleResourceUrl) {
            return global.resolveCapsuleResourceUrl(path);
        }
        if (global.CapsuleResource && typeof global.CapsuleResource.resolve === 'function') {
            return global.CapsuleResource.resolve(path);
        }
        return path;
    }

    function remapPath(path) {
        if (!path || typeof path !== 'string') {
            return path;
        }
        if (!usesGnomeAdwaita()) {
            return resolveAssetUrl(path);
        }
        if (path.indexOf(`${CINNAMON_BASE}/`) === 0) {
            const leaf = path.slice(CINNAMON_BASE.length + 1);
            const mapped = remapLeaf(leaf, 'grid');
            if (!mapped) {
                return resolveAssetUrl(path);
            }
            return resolveAssetUrl(`${GNOME_BASE}/${mapped}`);
        }
        if (path.indexOf(`${GNOME_BASE}/`) === 0) {
            return resolveAssetUrl(path);
        }
        if (path.indexOf('./assets/images/toolkits/gnome/elements/nemo/') === 0) {
            const leaf = path.split('/').pop();
            return resolveAssetUrl(`${GNOME_BASE}/${remapLeaf(leaf)}`);
        }
        return resolveAssetUrl(path);
    }

    function rewriteImagesInRoot(root) {
        if (!root || !usesGnomeAdwaita()) {
            return;
        }
        root.querySelectorAll('img[src]').forEach((img) => {
            const src = img.getAttribute('src');
            if (!src) {
                return;
            }
            const marker = 'cinnamon/nemo/';
            const idx = src.indexOf(marker);
            if (idx < 0) {
                return;
            }
            if (img.closest('.nemo-app__menubar')) {
                return;
            }
            const context = img.closest('.nemo-app__sidebar') ? 'sidebar' : 'toolbar';
            const leaf = src.slice(idx + marker.length);
            const mapped = remapLeaf(leaf, context);
            if (!mapped) {
                return;
            }
            const next = resolveAssetUrl(`${GNOME_BASE}/${mapped}`);
            if (next && next !== src) {
                img.setAttribute('src', next);
            }
        });
    }

    function patchFileExplorerCatalog() {
        if (!global.fileExplorerSystemLink || !global.fileExplorerSystemLink.files) {
            return;
        }
        Object.keys(global.fileExplorerSystemLink.files).forEach((key) => {
            const entry = global.fileExplorerSystemLink.files[key];
            if (entry && entry.image) {
                entry.image = remapPath(entry.image);
            }
        });
    }

    function patchNemoIconMap() {
        if (!global.CAPSULE_NEMO_ICON_MAP) {
            return;
        }
        const base = explorerPlacesBase();
        if (usesGnomeAdwaita()) {
            global.CAPSULE_NEMO_ICON_MAP = {
                Récent: `${base}/document-open-recent-symbolic.svg`,
                Corbeille: `${base}/user-trash-symbolic.svg`,
                Réseau: `${base}/network-server.svg`,
                'Système de fichiers': `${GNOME_BASE}/places/folder.svg`,
            };
        }
    }

    function apply() {
        patchFileExplorerCatalog();
        patchNemoIconMap();
        global.CAPSULE_EXPLORER_ICON_BASE = explorerPlacesBase();
        const slot = global.document && global.document.getElementById('nemo');
        if (slot) {
            rewriteImagesInRoot(slot);
        }
    }

    global.CapsuleExplorerIconBase = {
        usesGnomeAdwaita: usesGnomeAdwaita,
        placesBase: explorerPlacesBase,
        remapPath: remapPath,
        rewriteImagesInRoot: rewriteImagesInRoot,
        apply: apply,
    };

    apply();

    if (global.document) {
        global.document.addEventListener('capsule:slot-injected', (event) => {
            const detail = event.detail || {};
            if (detail.slotId === 'nemo' && detail.container) {
                patchFileExplorerCatalog();
                patchNemoIconMap();
                rewriteImagesInRoot(detail.container);
            }
        });
        if (global.document.readyState === 'loading') {
            global.document.addEventListener('DOMContentLoaded', apply);
        }
    }
}(typeof window !== 'undefined' ? window : globalThis));
