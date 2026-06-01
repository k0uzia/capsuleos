/**
 * Résolution des chemins ./media/ et ./assets/ pour les skins dérivées.
 * CAPSULE_MEDIA_BASE : bureau local (explorateur, barre, index.html).
 * CAPSULE_MENU_MEDIA_BASE : menu Mint partagé uniquement (HTML injecté + mainMenu-data).
 */
const getCapsuleMediaBase = () => {
    if (typeof window !== 'undefined' && window.CAPSULE_MEDIA_BASE) {
        return String(window.CAPSULE_MEDIA_BASE).replace(/\/+$/, '');
    }
    return './media';
};

const getCapsuleMenuMediaBase = () => {
    if (typeof window !== 'undefined' && window.CAPSULE_MENU_MEDIA_BASE) {
        return String(window.CAPSULE_MENU_MEDIA_BASE).replace(/\/+$/, '');
    }
    return getCapsuleMediaBase();
};

const getCapsuleAssetsBase = () => {
    if (typeof window !== 'undefined' && window.CAPSULE_ASSETS_BASE) {
        return String(window.CAPSULE_ASSETS_BASE).replace(/\/+$/, '');
    }
    return './assets';
};

const resolveCapsuleResourceUrlWithBases = (url, mediaBase, assetsBase) => {
    if (!url || typeof url !== 'string') {
        return url;
    }
    if (url.startsWith('./media/')) {
        return `${mediaBase}/${url.slice('./media/'.length)}`;
    }
    if (url.startsWith('./assets/')) {
        return `${assetsBase}/${url.slice('./assets/'.length)}`;
    }
    return url;
};

const rewriteCapsuleResourceUrlsInTextWithBases = (text, mediaBase, assetsBase) => {
    if (!text || typeof text !== 'string') {
        return text;
    }
    if (mediaBase === './media' && assetsBase === './assets') {
        return text;
    }
    return text
        .split('./media/')
        .join(`${mediaBase}/`)
        .split('./assets/')
        .join(`${assetsBase}/`);
};

const resolveCapsuleResourceUrl = (url) => resolveCapsuleResourceUrlWithBases(
    url,
    getCapsuleMediaBase(),
    getCapsuleAssetsBase()
);

const resolveCapsuleMenuResourceUrl = (url) => resolveCapsuleResourceUrlWithBases(
    url,
    getCapsuleMenuMediaBase(),
    getCapsuleAssetsBase()
);

const rewriteCapsuleResourceUrlsInText = (text) => rewriteCapsuleResourceUrlsInTextWithBases(
    text,
    getCapsuleMediaBase(),
    getCapsuleAssetsBase()
);

const rewriteCapsuleMenuResourceUrlsInText = (text) => rewriteCapsuleResourceUrlsInTextWithBases(
    text,
    getCapsuleMenuMediaBase(),
    getCapsuleAssetsBase()
);

if (typeof window !== 'undefined') {
    window.getCapsuleMediaBase = getCapsuleMediaBase;
    window.getCapsuleMenuMediaBase = getCapsuleMenuMediaBase;
    window.getCapsuleAssetsBase = getCapsuleAssetsBase;
    window.resolveCapsuleResourceUrl = resolveCapsuleResourceUrl;
    window.resolveCapsuleMenuResourceUrl = resolveCapsuleMenuResourceUrl;
    window.rewriteCapsuleResourceUrlsInText = rewriteCapsuleResourceUrlsInText;
    window.rewriteCapsuleMenuResourceUrlsInText = rewriteCapsuleMenuResourceUrlsInText;
}
