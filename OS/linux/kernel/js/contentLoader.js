const MODULE_TEMPLATE_IDS_FALLBACK = [
    'dolphin', 'librewriter', 'firefox', 'terminal', 'nemo', 'nautilus', 'nautilus-cosmic',
    'update_manager'
];

const FILE_EXPLORER_SLOT_IDS = ['fileExplorer', 'nemo'];

const isFileExplorerSlot = (slotId) => FILE_EXPLORER_SLOT_IDS.includes(slotId);

const getAppsBase = () => {
    if (typeof window !== 'undefined' && window.CAPSULE_APPS_BASE) {
        return String(window.CAPSULE_APPS_BASE).replace(/\/+$/, '');
    }
    return './apps';
};

const getModulesAppBase = () => {
    if (typeof window !== 'undefined' && window.CAPSULE_MODULES_APP_BASE) {
        return String(window.CAPSULE_MODULES_APP_BASE).replace(/\/+$/, '');
    }
    return '../../../../../modules/app';
};

const isModuleTemplate = (templateId) => {
    if (typeof window !== 'undefined' && Array.isArray(window.CAPSULE_MODULE_TEMPLATE_IDS)) {
        return window.CAPSULE_MODULE_TEMPLATE_IDS.includes(templateId);
    }
    return MODULE_TEMPLATE_IDS_FALLBACK.includes(templateId);
};

const getSkinBase = () => {
    if (typeof window !== 'undefined' && window.CAPSULE_SKIN_BASE) {
        return String(window.CAPSULE_SKIN_BASE).replace(/\/+$/, '');
    }
    return '';
};

const getEmbedSkinKey = () => {
    if (typeof window !== 'undefined' && window.CAPSULE_EMBED_SKIN_KEY) {
        return String(window.CAPSULE_EMBED_SKIN_KEY);
    }
    return 'mint';
};

const resolveEmbedSlotAssets = (templateId, skinId) => {
    const embed = typeof window !== 'undefined' && window.CAPSULE_APP_EMBED;
    if (!embed || !embed.templates || !embed.templates[templateId]) {
        return null;
    }
    const skinKey = getEmbedSkinKey();
    const skinMap = (embed.skins && embed.skins[skinKey]) || {};
    const t = embed.templates[templateId];
    const skinOverride = embed.skinTemplates
        && embed.skinTemplates[skinKey]
        && embed.skinTemplates[skinKey][templateId];
    const cssSkin = skinMap[skinId] != null
        ? skinMap[skinId]
        : (skinMap[templateId] != null ? skinMap[templateId] : '');
    const cssBase = skinOverride && skinOverride.cssBase
        ? skinOverride.cssBase
        : t.cssBase;
    return {
        html: skinOverride && skinOverride.html ? skinOverride.html : t.html,
        cssBase,
        cssSkin
    };
};

const getUpdateManagerEmbedSkinKey = () => {
    if (typeof window !== 'undefined' && window.CAPSULE_EMBED_SKIN_KEY) {
        return String(window.CAPSULE_EMBED_SKIN_KEY);
    }
    if (typeof document !== 'undefined' && document.body && document.body.id) {
        return document.body.id === 'mx-kde' ? 'mxkde' : document.body.id;
    }
    return '';
};

/** Variante HTML du gestionnaire de mises à jour (Mint / Discover / Ubuntu Software). */
const resolveUpdateManagerHtmlFile = (modulesBase) => {
    if (typeof window !== 'undefined' && window.CAPSULE_TEMPLATE_OVERRIDES
        && window.CAPSULE_TEMPLATE_OVERRIDES.update_manager) {
        return String(window.CAPSULE_TEMPLATE_OVERRIDES.update_manager);
    }
    const base = modulesBase.replace(/\/+$/, '');
    const skinKey = getUpdateManagerEmbedSkinKey();
    if (skinKey === 'ubuntu') {
        return `${base}/update_manager/update_manager_ubuntu.html`;
    }
    if (skinKey === 'opensuse' || skinKey === 'mxkde' || skinKey === 'debian-kde') {
        return `${base}/update_manager/update_manager_kde.html`;
    }
    return `${base}/update_manager/update_manager.html`;
};

const shouldUseAppEmbed = (templateId) => {
    const embed = typeof window !== 'undefined' && window.CAPSULE_APP_EMBED;
    if (!embed || !embed.templates || !embed.templates[templateId]) {
        return false;
    }
    if (typeof window !== 'undefined' && window.CAPSULE_FORCE_APP_EMBED === true) {
        return true;
    }
    if (typeof location !== 'undefined' && location.protocol === 'file:') {
        return true;
    }
    // Gabarits sous modules/app/ : chemins fetch relatifs à la skin souvent invalides (serveur local).
    if (isModuleTemplate(templateId)) {
        return true;
    }
    return false;
};

/**
 * Slot logique (data-link) → templateId (shared/apps ou modules/app, sans .html).
 */
const resolveTemplateId = (slotId) => {
    if (isFileExplorerSlot(slotId) && typeof window !== 'undefined' && typeof window.getFileManagerTemplate === 'function') {
        return window.getFileManagerTemplate();
    }
    if (slotId === 'mainMenu' && typeof window !== 'undefined' && window.CAPSULE_MAIN_MENU_TEMPLATE) {
        const t = String(window.CAPSULE_MAIN_MENU_TEMPLATE).replace(/\/+$/, '');
        return t || 'mainMenu';
    }
    return slotId;
};

/** Gabarits Nautilus (et alias legacy) → CSS de base `nemo.base.css`. */
const resolveCssBaseTemplateId = (templateId) => {
    if (typeof window !== 'undefined' && typeof window.resolveFileManagerCssBaseTemplateId === 'function') {
        return window.resolveFileManagerCssBaseTemplateId(templateId);
    }
    if (templateId === 'nautilus' || templateId === 'nautilus-cosmic'
        || templateId === 'nemo-gnome' || templateId === 'nemo-cosmic') {
        return 'nemo';
    }
    if (templateId === 'mainMenu-gnome') {
        return 'mainMenu-gnome';
    }
    return templateId;
};

const resolveSkinId = (slotId, templateId) => {
    if (isFileExplorerSlot(slotId) && typeof window !== 'undefined' && typeof window.getFileManagerSkinKey === 'function') {
        const skin = window.getFileManagerSkinKey();
        return skin || templateId;
    }
    if (slotId === 'mainMenu' && typeof window !== 'undefined' && window.CAPSULE_MAIN_MENU_SKIN_KEY) {
        const skin = String(window.CAPSULE_MAIN_MENU_SKIN_KEY).replace(/\/+$/, '');
        return skin || templateId;
    }
    return templateId;
};

const divs = document.querySelectorAll('div[data-link]');

/**
 * @param {string} templateId
 * @param {string} skinId
 * @param {string} appsBase
 * @param {string|null} cssSkinFile
 * @param {string|null} cssSkinFallbackFile
 * @returns {Promise<{ html: string, cssBase: string, cssSkin: string }>}
 */
const resolveTemplateHtmlFile = (templateId, appsBase) => {
    if (typeof window !== 'undefined' && window.CAPSULE_TEMPLATE_OVERRIDES && window.CAPSULE_TEMPLATE_OVERRIDES[templateId]) {
        return String(window.CAPSULE_TEMPLATE_OVERRIDES[templateId]);
    }
    if (isModuleTemplate(templateId)) {
        const modulesBase = getModulesAppBase();
        if (templateId === 'update_manager') {
            return resolveUpdateManagerHtmlFile(modulesBase);
        }
        return `${modulesBase}/${templateId}/${templateId}.html`;
    }
    return `${appsBase}/${templateId}.html`;
};

const resolveTemplateCssBaseFile = (templateId, appsBase) => {
    const cssBaseTemplateId = resolveCssBaseTemplateId(templateId);
    const modulesBase = getModulesAppBase();
    if (isModuleTemplate(cssBaseTemplateId)) {
        return `${modulesBase}/${cssBaseTemplateId}/${cssBaseTemplateId}.base.css`;
    }
    if (isModuleTemplate(templateId)) {
        return `${modulesBase}/${templateId}/${templateId}.base.css`;
    }
    return `${appsBase}/style/${cssBaseTemplateId}.base.css`;
};

const resolveNemoBaseCssUrl = (appsBase) => {
    if (isModuleTemplate('nemo')) {
        return `${getModulesAppBase()}/nemo/nemo.base.css`;
    }
    return `${appsBase}/style/nemo.base.css`;
};

const loadSlotAssets = (templateId, skinId, appsBase, cssSkinFile, cssSkinFallbackFile) => {
    const embed = typeof window !== 'undefined' && window.CAPSULE_APP_EMBED;
    if (shouldUseAppEmbed(templateId)) {
        const fromEmbed = resolveEmbedSlotAssets(templateId, skinId);
        if (fromEmbed) {
            return Promise.resolve(fromEmbed);
        }
        console.warn(`CapsuleOS: embed incomplet pour ${templateId} — repli fetch`);
    }

    const htmlFile = resolveTemplateHtmlFile(templateId, appsBase);
    const cssBaseFile = resolveTemplateCssBaseFile(templateId, appsBase);

    const resolveEmbedHtml = () => {
        const assets = resolveEmbedSlotAssets(templateId, skinId);
        return assets ? assets.html : null;
    };

    const fetchHtml = fetch(htmlFile, { cache: 'no-store' }).then((response) => {
        if (!response.ok) {
            throw new Error(`HTTP ${response.status} ${htmlFile}`);
        }
        return response.text();
    }).catch((error) => {
        const fallbackHtml = resolveEmbedHtml();
        if (fallbackHtml) {
            console.warn(`CapsuleOS: gabarit ${templateId} via embed (${error.message})`);
            return fallbackHtml;
        }
        throw error;
    });

    const fetchCssBase = (async () => {
        let text = '';
        const response = await fetch(cssBaseFile, { cache: 'no-store' });
        if (!response.ok) {
            const embedAssets = resolveEmbedSlotAssets(templateId, skinId);
            if (embedAssets && embedAssets.cssBase) {
                console.warn(`CapsuleOS: CSS base ${templateId} via embed (HTTP ${response.status})`);
                text = embedAssets.cssBase;
            } else {
                throw new Error(`HTTP ${response.status} ${cssBaseFile}`);
            }
        } else {
            text = await response.text();
        }
        if (templateId === 'dolphin' && text && !isModuleTemplate('dolphin')) {
            const nemoFile = resolveNemoBaseCssUrl(appsBase);
            const nemoResp = await fetch(nemoFile, { cache: 'no-store' });
            if (nemoResp.ok) {
                text = `${await nemoResp.text()}\n${text}`;
            }
        }
        return text;
    })();

    const skinCssVersion = typeof window !== 'undefined' && window.CAPSULE_SKIN_CSS_VERSION
        ? String(window.CAPSULE_SKIN_CSS_VERSION)
        : '';
    const withSkinCssBust = (url) => (
        skinCssVersion && url ? `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(skinCssVersion)}` : url
    );

    const fetchCssSkin = cssSkinFile
        ? fetch(withSkinCssBust(cssSkinFile), { cache: 'no-store' }).then((response) => {
            if (response.ok) {
                return response.text();
            }
            const embedAssets = resolveEmbedSlotAssets(templateId, skinId);
            if (embedAssets && embedAssets.cssSkin) {
                console.warn(`CapsuleOS: skin ${skinId} via embed (HTTP ${response.status})`);
                return embedAssets.cssSkin;
            }
            if (cssSkinFallbackFile && cssSkinFallbackFile !== cssSkinFile) {
                return fetch(withSkinCssBust(cssSkinFallbackFile), { cache: 'no-store' }).then((fallbackResponse) => (
                    fallbackResponse.ok ? fallbackResponse.text() : ''
                ));
            }
            return '';
        })
        : Promise.resolve('');

    return Promise.all([fetchHtml, fetchCssBase, fetchCssSkin]).then(([html, cssBase, cssSkin]) => ({
        html,
        cssBase,
        cssSkin
    }));
};

const runFirstAvailable = (candidates, warnLabel) => {
    for (let index = 0; index < candidates.length; index += 1) {
        const candidate = candidates[index];
        if (typeof candidate.fn === 'function') {
            candidate.fn(...(candidate.args || []));
            return true;
        }
    }
    if (warnLabel) {
        console.warn(`CapsuleOS: ${warnLabel} indisponible (ordre des scripts ?)`);
    }
    return false;
};

const initFileExplorerSlot = () => {
        const contentRoot = typeof window !== 'undefined' && window.CAPSULE_CONTENT_ROOT
            ? window.CAPSULE_CONTENT_ROOT
            : './apps/system/Dossier_personnel';
        runFirstAvailable([
            { fn: typeof window.refreshDolphinShellLayout === 'function' ? window.refreshDolphinShellLayout : null }
        ]);
        runFirstAvailable([
            { fn: typeof initFileExplorerContainer === 'function' ? initFileExplorerContainer : null },
            { fn: typeof initNemoContainer === 'function' ? initNemoContainer : null }
        ], 'initFileExplorerContainer');
        runFirstAvailable([
            { fn: typeof loadFileExplorerDirectory === 'function' ? loadFileExplorerDirectory : null, args: [contentRoot] },
            { fn: typeof loadDirectory === 'function' ? loadDirectory : null, args: [contentRoot] }
        ]);
};

const SLOT_INIT_HANDLERS = {
    fileExplorer: initFileExplorerSlot,
    nemo: initFileExplorerSlot,
    terminal: () => {
        runFirstAvailable([
            { fn: typeof initTerminalWhenReady === 'function' ? initTerminalWhenReady : null }
        ], 'initTerminalWhenReady');
    },
    mainMenu: () => {
        if (typeof initMainMenu === 'function') {
            initMainMenu();
        }
    },
    firefox: () => {
        runFirstAvailable([
            { fn: typeof initFirefoxBrowser === 'function' ? initFirefoxBrowser : null },
            { fn: typeof initMintFirefoxBrowser === 'function' ? initMintFirefoxBrowser : null }
        ]);
    },
    themes: () => {
        if (typeof initThemesApp === 'function') {
            initThemesApp();
        }
    },
    profile: () => {
        if (typeof initProfileApp === 'function') {
            initProfileApp();
        }
    },
    checklist: () => {
        if (typeof initChecklistApp === 'function') {
            initChecklistApp();
        }
    },
    librewriter: () => {
        if (typeof initLibreWriter === 'function') {
            initLibreWriter();
        }
    },
    visionneur_images: () => {
        runFirstAvailable([
            { fn: typeof renderFileViewer === 'function' ? renderFileViewer : null, args: ['visionneur_images'] },
            { fn: typeof renderMintViewer === 'function' ? renderMintViewer : null, args: ['visionneur_images'] }
        ]);
    },
    visionneur_pdf: () => {
        runFirstAvailable([
            { fn: typeof renderFileViewer === 'function' ? renderFileViewer : null, args: ['visionneur_pdf'] },
            { fn: typeof renderMintViewer === 'function' ? renderMintViewer : null, args: ['visionneur_pdf'] }
        ]);
    },
    lecteur_multimedia: () => {
        runFirstAvailable([
            { fn: typeof renderFileViewer === 'function' ? renderFileViewer : null, args: ['lecteur_multimedia'] },
            { fn: typeof renderMintViewer === 'function' ? renderMintViewer : null, args: ['lecteur_multimedia'] }
        ]);
    },
    update_manager: () => {
        if (typeof initUpdateManagerApp === 'function') {
            initUpdateManagerApp();
        }
    }
};

const injectSlot = (motionless, slotId, templateId, html, cssBase, cssSkin) => {
    const rewriteUrls = typeof rewriteCapsuleResourceUrlsInText === 'function'
        ? rewriteCapsuleResourceUrlsInText
        : (text) => text;
    const resolvedHtml = rewriteUrls(html);
    const resolvedCssBase = rewriteUrls(cssBase);
    const resolvedCssSkin = cssSkin ? rewriteUrls(cssSkin) : '';

    motionless.innerHTML = resolvedHtml;

    if (typeof window.applyCapsuleStrings === 'function' && typeof window !== 'undefined' && window.CAPSULE_STRINGS_MERGED) {
        window.applyCapsuleStrings(motionless, window.CAPSULE_STRINGS_MERGED);
    }

    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = resolvedCssBase + (resolvedCssSkin ? `\n${resolvedCssSkin}` : '');
    document.head.appendChild(style);

    const initSlot = SLOT_INIT_HANDLERS[slotId];
    if (typeof initSlot === 'function') {
        try {
            initSlot(motionless, slotId, templateId);
        } catch (initError) {
            console.error(`CapsuleOS: init slot "${slotId}"`, initError);
        }
    }
};

const loadMergedStrings = () => {
    if (typeof window.getMergedStrings === 'function') {
        return window.getMergedStrings();
    }
    const defaults = (typeof window !== 'undefined' && window.CAPSULE_STRINGS_DEFAULT) || {};
    return Promise.resolve(defaults);
};

const startCapsuleContentLoad = () => {
    loadMergedStrings()
        .then((merged) => {
            if (typeof window !== 'undefined') {
                window.CAPSULE_STRINGS_MERGED = merged;
                window.CAPSULE_WINDOW_TITLES = typeof window.buildWindowTitles === 'function'
                    ? window.buildWindowTitles(merged)
                    : {};
            }

            divs.forEach((div) => {
                const slotId = div.getAttribute('data-link');
                const templateId = resolveTemplateId(slotId);
                const skinId = resolveSkinId(slotId, templateId);
                const appsBase = getAppsBase();
                const skinBase = getSkinBase();
                const cssSkinFile = skinBase ? `${skinBase}/style/apps/${skinId}.skin.css` : null;
                const cssSkinFallbackFile = skinBase ? `${skinBase}/style/apps/${templateId}.skin.css` : null;

                loadSlotAssets(templateId, skinId, appsBase, cssSkinFile, cssSkinFallbackFile)
                    .then(({ html, cssBase, cssSkin }) => {
                        injectSlot(div, slotId, templateId, html, cssBase, cssSkin);
                    })
                    .catch((error) => {
                        console.error('Erreur lors du chargement des fichiers:', error);
                        div.innerHTML = '<section style="padding:12px;font-family:sans-serif;">Impossible de charger ce module. Vérifiez que les fichiers de l’application sont présents ou régénérez capsule-app-embed.js (voir README).</section>';
                    });
            });
        })
        .catch((err) => {
            console.error('CapsuleOS: échec fusion des chaînes', err);
            divs.forEach((div) => {
                div.innerHTML = '<section style="padding:12px;font-family:sans-serif;">Erreur de chargement des textes.</section>';
            });
        });
};

if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startCapsuleContentLoad);
} else {
    setTimeout(startCapsuleContentLoad, 0);
}
