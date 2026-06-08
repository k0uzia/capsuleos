const getAppsBase = () => {
    if (typeof window !== 'undefined' && window.CAPSULE_APPS_BASE) {
        return String(window.CAPSULE_APPS_BASE).replace(/\/+$/, '');
    }
    return './apps';
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

/** Kickoff Plasma : le gabarit HTML + skin.css suffisent — mainMenu.base.css (MX/Cinnamon) casse le layout. */
const PLASMA_MAIN_MENU_SKINS = new Set(['opensuse', 'kde-neon', 'mxkde', 'debian-kde']);
const PLASMA_MAIN_MENU_BODY_IDS = new Set(['opensuse', 'kde-neon', 'debian-kde', 'mx-kde']);
/** Mint Cinnamon : menu panneau — layout entièrement dans mainMenu.skin.css (imports statiques). */
const CINNAMON_PANEL_MENU_SKINS = new Set(['mint']);
const CINNAMON_PANEL_MENU_BODY_IDS = new Set(['mint']);

const shouldSkipMainMenuBaseCss = (templateId, htmlHint) => {
    if (templateId !== 'mainMenu') {
        return false;
    }
    if (htmlHint && htmlHint.includes('menu-root--plasma')) {
        return true;
    }
    if (PLASMA_MAIN_MENU_SKINS.has(getEmbedSkinKey())) {
        return true;
    }
    if (CINNAMON_PANEL_MENU_SKINS.has(getEmbedSkinKey())) {
        return true;
    }
    const bodyId = typeof document !== 'undefined' && document.body && document.body.id;
    if (bodyId && PLASMA_MAIN_MENU_BODY_IDS.has(bodyId)) {
        return true;
    }
    return !!(bodyId && CINNAMON_PANEL_MENU_BODY_IDS.has(bodyId));
};

const shouldSkipDynamicSkinCss = (slotId) => {
    const staticSlots = typeof window !== 'undefined' && window.CAPSULE_STATIC_SKIN_SLOTS;
    if (!Array.isArray(staticSlots)) {
        return false;
    }
    return staticSlots.indexOf(slotId) !== -1;
};

const shouldUseAppEmbed = (templateId) => {
    const embed = typeof window !== 'undefined' && window.CAPSULE_APP_EMBED;
    if (!embed || !embed.templates || !embed.templates[templateId]) {
        return false;
    }
    if (typeof window !== 'undefined' && window.CAPSULE_FORCE_APP_EMBED === true) {
        return true;
    }
    if (typeof window !== 'undefined' && window.CapsuleBrowserCapabilities) {
        const caps = window.CapsuleBrowserCapabilities.capabilities;
        if (caps.fileProtocolEmbed && typeof location !== 'undefined' && location.protocol === 'file:') {
            return true;
        }
        if (window.CapsuleEngineAdapter && window.CapsuleEngineAdapter.preferEmbedOnFileProtocol === false) {
            return false;
        }
    }
    if (typeof location !== 'undefined' && location.protocol === 'file:') {
        return true;
    }
    return false;
};

/**
 * Slot logique (data-link) → nom de fichier template sous shared/apps (sans .html).
 */
const resolveTemplateId = (slotId) => {
    if (slotId === 'nemo' && typeof window !== 'undefined' && window.CAPSULE_EXPLORER_TEMPLATE) {
        const t = String(window.CAPSULE_EXPLORER_TEMPLATE).replace(/\/+$/, '');
        return t || 'nemo';
    }
    if (slotId === 'mainMenu' && typeof window !== 'undefined' && window.CAPSULE_MAIN_MENU_TEMPLATE) {
        const t = String(window.CAPSULE_MAIN_MENU_TEMPLATE).replace(/\/+$/, '');
        return t || 'mainMenu';
    }
    return slotId;
};

/** Gabarit HTML dérivé de Nautilus (ex. nemo-gnome) → CSS de base `nemo.base.css`. */
const resolveCssBaseTemplateId = (templateId) => {
    if (templateId === 'nemo-gnome' || templateId === 'nemo-cosmic') {
        return 'nemo';
    }
    if (templateId === 'mainMenu-gnome') {
        return 'mainMenu-gnome';
    }
    return templateId;
};

const normalizeExplorerSkinId = (skinId, templateId) => {
    if (skinId === 'nemo-gnome' || skinId === 'files') {
        return 'nautilus';
    }
    if ((templateId === 'nemo-gnome' || templateId === 'nautilus') && skinId === templateId) {
        return 'nautilus';
    }
    return skinId;
};

const resolveExplorerSkinFallbackId = (templateId) => {
    if (templateId === 'nemo-gnome' || templateId === 'nautilus') {
        return 'nautilus';
    }
    return templateId;
};

const resolveSkinId = (slotId, templateId) => {
    if (slotId === 'nemo' && typeof window !== 'undefined' && window.CAPSULE_EXPLORER_SKIN_KEY) {
        const skin = String(window.CAPSULE_EXPLORER_SKIN_KEY).replace(/\/+$/, '');
        return normalizeExplorerSkinId(skin || templateId, templateId);
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
    if (typeof window !== 'undefined'
        && window.CapsuleClusterRegistry
        && typeof window.CapsuleClusterRegistry.resolveHtmlPath === 'function') {
        const clusterPath = window.CapsuleClusterRegistry.resolveHtmlPath(templateId, appsBase);
        if (clusterPath) {
            return clusterPath;
        }
    }
    if (typeof window !== 'undefined'
        && window.CapsuleExplorerRegistry
        && typeof window.CapsuleExplorerRegistry.isExplorerTemplate === 'function'
        && window.CapsuleExplorerRegistry.isExplorerTemplate(templateId)
        && typeof window.CapsuleExplorerRegistry.resolveShellPathFromAppsBase === 'function') {
        return window.CapsuleExplorerRegistry.resolveShellPathFromAppsBase(appsBase, templateId);
    }
    return `${appsBase}/${templateId}.html`;
};

/** Candidats HTML : skin d’abord (Kickoff Plasma, etc.), puis noyau partagé. */
const resolveTemplateHtmlCandidates = (templateId, appsBase, skinBase) => {
    const candidates = [];
    if (skinBase) {
        candidates.push(`${String(skinBase).replace(/\/+$/, '')}/apps/${templateId}.html`);
    }
    const shared = resolveTemplateHtmlFile(templateId, appsBase);
    if (!candidates.includes(shared)) {
        candidates.push(shared);
    }
    return candidates;
};

const loadSlotAssets = (slotId, templateId, skinId, appsBase, skinBase, cssSkinFile, cssSkinFallbackFile) => {
    const embed = typeof window !== 'undefined' && window.CAPSULE_APP_EMBED;
    if (shouldUseAppEmbed(templateId) && embed && embed.templates && embed.templates[templateId]) {
        const skinKey = getEmbedSkinKey();
        const skinMap = embed.skins && embed.skins[skinKey];
        if (skinMap) {
            const t = embed.templates[templateId];
            const skinOverride = embed.skinTemplates
                && embed.skinTemplates[skinKey]
                && embed.skinTemplates[skinKey][templateId];
            const skipDynamicSkin = shouldSkipDynamicSkinCss(slotId);
            const cssSkin = skipDynamicSkin
                ? ''
                : (skinMap[skinId] != null
                    ? skinMap[skinId]
                    : (skinMap[templateId] != null ? skinMap[templateId] : ''));
            return Promise.resolve({
                html: skinOverride && skinOverride.html ? skinOverride.html : t.html,
                cssBase: shouldSkipMainMenuBaseCss(templateId, skinOverride && skinOverride.html ? skinOverride.html : t.html) ? '' : t.cssBase,
                cssSkin
            });
        }
        console.warn(`CapsuleOS: embed sans skin "${skinKey}" pour ${templateId} — chargement fetch`);
    }

    const htmlCandidates = resolveTemplateHtmlCandidates(templateId, appsBase, skinBase);
    const cssBaseTemplateId = resolveCssBaseTemplateId(templateId);
    const cssBaseFile = `${appsBase}/style/${cssBaseTemplateId}.base.css`;

    const resolveEmbedHtml = () => {
        if (!embed || !embed.templates || !embed.templates[templateId]) {
            return null;
        }
        const skinKey = getEmbedSkinKey();
        const skinOverride = embed.skinTemplates
            && embed.skinTemplates[skinKey]
            && embed.skinTemplates[skinKey][templateId];
        return (skinOverride && skinOverride.html) ? skinOverride.html : embed.templates[templateId].html;
    };

    const fetchHtml = (async () => {
        const skinKey = getEmbedSkinKey();
        const skinOverride = embed && embed.skinTemplates && embed.skinTemplates[skinKey] && embed.skinTemplates[skinKey][templateId];
        if (skinOverride && skinOverride.html) {
            return skinOverride.html;
        }

        let lastError = null;
        for (const url of htmlCandidates) {
            try {
                const response = await fetch(url, { cache: 'no-store' });
                if (response.ok) {
                    return response.text();
                }
                lastError = new Error(`HTTP ${response.status} ${url}`);
            } catch (error) {
                lastError = error;
            }
        }
        const fallbackHtml = resolveEmbedHtml();
        if (fallbackHtml) {
            const reason = lastError && lastError.message ? lastError.message : 'échec fetch';
            console.warn(`CapsuleOS: gabarit ${templateId} via embed (${reason})`);
            return fallbackHtml;
        }
        throw lastError || new Error(`CapsuleOS: gabarit ${templateId} introuvable`);
    })();

    const fetchCssBase = (async () => {
        if (shouldSkipMainMenuBaseCss(templateId)) {
            return '';
        }

        const fetchOneCss = async (url) => {
            const response = await fetch(url, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`HTTP ${response.status} ${url}`);
            }
            return response.text();
        };

        let stackUrls = [];
        if (typeof window !== 'undefined'
            && window.CapsuleExplorerRegistry
            && typeof window.CapsuleExplorerRegistry.resolveCssBasePathsFromAppsBase === 'function') {
            stackUrls = window.CapsuleExplorerRegistry.resolveCssBasePathsFromAppsBase(appsBase, templateId);
        }

        if (stackUrls.length > 1) {
            try {
                const chunks = await Promise.all(stackUrls.map((url) => fetchOneCss(url)));
                return chunks.join('\n');
            } catch (stackError) {
                console.warn(`CapsuleOS: pile CSS explorateur ${templateId} — repli nemo.base`, stackError.message);
            }
        }

        let text = '';
        const response = await fetch(cssBaseFile, { cache: 'no-store' });
        if (!response.ok) {
            if (embed && embed.templates && embed.templates[templateId] && embed.templates[templateId].cssBase) {
                console.warn(`CapsuleOS: CSS base ${templateId} via embed (HTTP ${response.status})`);
                text = embed.templates[templateId].cssBase;
            } else {
                throw new Error(`HTTP ${response.status} ${cssBaseFile}`);
            }
        } else {
            text = await response.text();
        }
        if (templateId === 'dolphin' && text) {
            const nemoFile = `${appsBase}/style/nemo.base.css`;
            const nemoResp = await fetch(nemoFile, { cache: 'no-store' });
            if (nemoResp.ok) {
                text = `${await nemoResp.text()}\n${text}`;
            }
        }
        if (templateId === 'themes' && text) {
            const embedKey = typeof window !== 'undefined' && window.CAPSULE_EMBED_SKIN_KEY
                ? String(window.CAPSULE_EMBED_SKIN_KEY)
                : '';
            if (embedKey === 'mint') {
                const cinnamonFile = `${appsBase}/style/themes_cinnamon.base.css`;
                const cinnamonResp = await fetch(cinnamonFile, { cache: 'no-store' });
                if (cinnamonResp.ok) {
                    text = `${text}\n${await cinnamonResp.text()}`;
                }
            } else {
                const gnomeFile = `${appsBase}/style/themes_gnome.base.css`;
                const gnomeResp = await fetch(gnomeFile, { cache: 'no-store' });
                if (gnomeResp.ok) {
                    text = `${text}\n${await gnomeResp.text()}`;
                }
            }
        }
        if (templateId === 'terminal' && text) {
            const ptyxisFile = `${appsBase}/style/terminal-ptyxis.base.css`;
            const ptyxisResp = await fetch(ptyxisFile, { cache: 'no-store' });
            if (ptyxisResp.ok) {
                text = `${text}\n${await ptyxisResp.text()}`;
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

const SLOT_INIT_HANDLERS = {
    nemo: (container) => {
        if (typeof window.initExplorerWindowInstance === 'function') {
            window.initExplorerWindowInstance(container);
        }
        if (typeof window.resetFileExplorerSlotBindings === 'function') {
            window.resetFileExplorerSlotBindings(container);
        }
        const contentRoot = typeof window !== 'undefined' && window.CAPSULE_CONTENT_ROOT
            ? window.CAPSULE_CONTENT_ROOT
            : (typeof window !== 'undefined' && window.CapsuleUserHome)
                ? window.CapsuleUserHome.resolveRelative()
                : 'home/public';
        runFirstAvailable([
            {
                fn: typeof window.refreshDolphinShellLayout === 'function' ? window.refreshDolphinShellLayout : null,
                args: [container],
            },
        ]);
        runFirstAvailable([
            {
                fn: typeof initFileExplorerContainer === 'function' ? initFileExplorerContainer : null,
                args: [container],
            },
            {
                fn: typeof initNemoContainer === 'function' ? initNemoContainer : null,
                args: [container],
            },
        ], 'initFileExplorerContainer');
        runFirstAvailable([
            {
                fn: typeof navigateToFileExplorerDirectory === 'function' ? navigateToFileExplorerDirectory : null,
                args: [contentRoot, { updateHistory: true, explorerRoot: container }],
            },
            { fn: typeof loadFileExplorerDirectory === 'function' ? loadFileExplorerDirectory : null, args: [contentRoot] },
            { fn: typeof loadDirectory === 'function' ? loadDirectory : null, args: [contentRoot] }
        ]);
        runFirstAvailable([
            { fn: typeof initFileExplorerDnD === 'function' ? initFileExplorerDnD : null }
        ]);
    },
    terminal: (container) => {
        runFirstAvailable([
            {
                fn: typeof initTerminalForContainer === 'function' ? initTerminalForContainer : null,
                args: [container],
            },
            { fn: typeof initTerminalWhenReady === 'function' ? initTerminalWhenReady : null },
        ], 'initTerminalForContainer');
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
        if (typeof initCinnamonSettingsApp === 'function' && document.getElementById('cinnamonSettingsApp')) {
            initCinnamonSettingsApp();
        } else if (typeof initThemesApp === 'function') {
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
    librecalc: () => {
        if (typeof initLibreCalc === 'function') {
            initLibreCalc();
        }
    },
    visionneur_images: () => {
        if (typeof initVisionneurImagesApp === 'function' && document.getElementById('visionneurImages')) {
            initVisionneurImagesApp();
        }
        runFirstAvailable([
            {
                fn: typeof renderFileViewer === 'function' ? renderFileViewer : null,
                args: ['visionneur_images']
            },
            {
                fn: typeof renderMintViewer === 'function' ? renderMintViewer : null,
                args: ['visionneur_images']
            }
        ]);
    },
    visionneur_pdf: () => {
        if (typeof initVisionneurPdfApp === 'function' && document.getElementById('visionneurPdf')) {
            initVisionneurPdfApp();
        }
        runFirstAvailable([
            {
                fn: typeof renderFileViewer === 'function' ? renderFileViewer : null,
                args: ['visionneur_pdf']
            },
            {
                fn: typeof renderMintViewer === 'function' ? renderMintViewer : null,
                args: ['visionneur_pdf']
            }
        ]);
    },
    lecteur_multimedia: () => {
        if (typeof initCelluloidApp === 'function') {
            initCelluloidApp();
        }
        runFirstAvailable([
            { fn: typeof renderFileViewer === 'function' ? renderFileViewer : null, args: ['lecteur_multimedia'] },
            { fn: typeof renderMintViewer === 'function' ? renderMintViewer : null, args: ['lecteur_multimedia'] }
        ]);
    },
    update_manager: () => {
        if (typeof initUpdateManagerApp === 'function') {
            initUpdateManagerApp();
        }
    },
    mintinstall: () => {
        if (typeof initMintInstallApp === 'function') {
            initMintInstallApp();
        }
    },
    system_monitor: () => {
        if (typeof initSystemMonitorApp === 'function') {
            initSystemMonitorApp();
        }
    },
    calculator: () => {
        if (typeof initCalculatorApp === 'function') {
            initCalculatorApp();
        }
    },
    clocks: () => {
        if (typeof initClocksApp === 'function') {
            initClocksApp();
        }
    },
    calendar: () => {
        if (typeof initCalendarApp === 'function') {
            initCalendarApp();
        }
    },
    screenshot: () => {
        if (typeof initScreenshotApp === 'function') {
            initScreenshotApp();
        }
    },
    drawing: () => {
        if (typeof initDrawingApp === 'function') {
            initDrawingApp();
        }
    },
    file_roller: () => {
        if (typeof initFileRollerApp === 'function') {
            initFileRollerApp();
        }
    },
    mintdrivers: () => {
        if (typeof initMintDriversApp === 'function') {
            initMintDriversApp();
        }
    },
    baobab: () => {
        if (typeof initBaobabApp === 'function') {
            initBaobabApp();
        }
    },
    webapp_manager: () => {
        if (typeof initWebappManagerApp === 'function') {
            initWebappManagerApp();
        }
    },
    sticky: () => {
        if (typeof initStickyApp === 'function') {
            initStickyApp();
        }
    },
    warpinator: () => {
        if (typeof initWarpinatorApp === 'function') {
            initWarpinatorApp();
        }
    },
    hypnotix: () => {
        if (typeof initHypnotixApp === 'function') {
            initHypnotixApp();
        }
    },
    transmission: () => {
        if (typeof initTransmissionApp === 'function') {
            initTransmissionApp();
        }
    },
    mintbackup: () => {
        if (typeof initMintbackupApp === 'function') {
            initMintbackupApp();
        }
    },
    bulky: () => {
        if (typeof initBulkyApp === 'function') {
            initBulkyApp();
        }
    },
    timeshift: () => {
        if (typeof initTimeshiftApp === 'function') {
            initTimeshiftApp();
        }
    },
    thunderbird: () => {
        if (typeof initThunderbirdApp === 'function') {
            initThunderbirdApp();
        }
    },
    mintwelcome: () => {
        if (typeof initMintwelcomeApp === 'function') {
            initMintwelcomeApp();
        }
    },
    gucharmap: () => {
        if (typeof initGucharmapApp === 'function') {
            initGucharmapApp();
        }
    },
    simple_scan: () => {
        if (typeof initSimpleScanApp === 'function') {
            initSimpleScanApp();
        }
    },
    thingy: () => {
        if (typeof initThingyApp === 'function') {
            initThingyApp();
        }
    },
    rhythmbox: () => {
        if (typeof initRhythmboxApp === 'function') {
            initRhythmboxApp();
        }
    },
    gnome_disks: () => {
        if (typeof initGnomeDisksApp === 'function') {
            initGnomeDisksApp();
        }
    },
    libreoffice_startcenter: () => {
        if (typeof initLibreofficeStartcenterApp === 'function') {
            initLibreofficeStartcenterApp();
        }
    },
    libreoffice_draw: () => {
        if (typeof initLibreofficeDrawApp === 'function') {
            initLibreofficeDrawApp();
        }
    },
    libreoffice_impress: () => {
        if (typeof initLibreofficeImpressApp === 'function') {
            initLibreofficeImpressApp();
        }
    },
    mintstick: () => {
        if (typeof initMintstickApp === 'function') {
            initMintstickApp();
        }
    },
    mintstick_format: () => {
        if (typeof initMintstickFormatApp === 'function') {
            initMintstickFormatApp();
        }
    },
    font_viewer: () => {
        if (typeof initFontViewerApp === 'function') {
            initFontViewerApp();
        }
    },
    power_stats: () => {
        if (typeof initPowerStatsApp === 'function') {
            initPowerStatsApp();
        }
    },
    mate_color_select: () => {
        if (typeof initMateColorSelectApp === 'function') {
            initMateColorSelectApp();
        }
    },
    text_editor: () => {
        if (typeof initTextEditorApp === 'function') {
            initTextEditorApp();
        }
    }
};

const injectSlot = (motionless, slotId, templateId, html, cssBase, cssSkin) => {
    const rewriteUrls = typeof rewriteCapsuleResourceUrlsInText === 'function'
        ? rewriteCapsuleResourceUrlsInText
        : (text) => text;
    const resolvedHtml = rewriteUrls(html);
    let resolvedCssBase = rewriteUrls(cssBase);
    const resolvedCssSkin = cssSkin ? rewriteUrls(cssSkin) : '';

    if (shouldSkipMainMenuBaseCss(templateId, resolvedHtml)) {
        resolvedCssBase = '';
    }

    const preservedHeader = motionless.querySelector(':scope > #windowHeader');
    const headerClone = preservedHeader ? preservedHeader.cloneNode(true) : null;

    motionless.innerHTML = resolvedHtml;

    if (headerClone) {
        motionless.insertBefore(headerClone, motionless.firstChild);
    }

    if (typeof window.applyCapsuleStrings === 'function' && typeof window !== 'undefined' && window.CAPSULE_STRINGS_MERGED) {
        window.applyCapsuleStrings(motionless, window.CAPSULE_STRINGS_MERGED);
    }

    const style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = resolvedCssBase + (resolvedCssSkin ? `\n${resolvedCssSkin}` : '');
    document.head.appendChild(style);

    const initSlot = SLOT_INIT_HANDLERS[slotId];
    if (typeof initSlot === 'function') {
        initSlot(motionless, slotId, templateId);
    }

    if (typeof window.ensureWindowChromeAfterSlotInject === 'function') {
        window.ensureWindowChromeAfterSlotInject(motionless, slotId);
    }

    if (typeof document !== 'undefined') {
        document.dispatchEvent(new CustomEvent('capsule:slot-injected', {
            detail: { container: motionless, slotId: slotId, templateId: templateId },
        }));
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

            const slotLoads = Array.from(divs).map((div) => {
                const slotId = div.getAttribute('data-link');
                const templateId = resolveTemplateId(slotId);
                const skinId = resolveSkinId(slotId, templateId);
                const appsBase = getAppsBase();
                const skinBase = getSkinBase();
                const skipDynamicSkin = shouldSkipDynamicSkinCss(slotId);
                const cssSkinFile = !skipDynamicSkin && skinBase
                    ? `${skinBase}/style/apps/${skinId}.skin.css`
                    : null;
                const cssSkinFallbackFile = !skipDynamicSkin && skinBase
                    ? `${skinBase}/style/apps/${resolveExplorerSkinFallbackId(templateId)}.skin.css`
                    : null;

                return loadSlotAssets(slotId, templateId, skinId, appsBase, skinBase, cssSkinFile, cssSkinFallbackFile)
                    .then(({ html, cssBase, cssSkin }) => {
                        injectSlot(div, slotId, templateId, html, cssBase, cssSkin);
                    })
                    .catch((error) => {
                        console.error('Erreur lors du chargement des fichiers:', error);
                        div.innerHTML = '<section style="padding:12px;font-family:sans-serif;">Impossible de charger ce module. Vérifiez que les fichiers de l’application sont présents ou régénérez capsule-app-embed.js (voir README).</section>';
                    });
            });

            Promise.all(slotLoads).then(() => {
                if (typeof window.CapsuleLinuxWindowContext !== 'undefined'
                    && typeof window.CapsuleLinuxWindowContext.boot === 'function') {
                    window.CapsuleLinuxWindowContext.boot();
                }
            });
        })
        .catch((err) => {
            console.error('CapsuleOS: échec fusion des chaînes', err);
            divs.forEach((div) => {
                div.innerHTML = '<section style="padding:12px;font-family:sans-serif;">Erreur de chargement des textes.</section>';
            });
        });
};

const reloadCapsuleSlot = (container, slotId) => {
    if (!container || !slotId) {
        return Promise.reject(new Error('reloadCapsuleSlot: container ou slotId manquant'));
    }
    const templateId = resolveTemplateId(slotId);
    const skinId = resolveSkinId(slotId, templateId);
    const appsBase = getAppsBase();
    const skinBase = getSkinBase();
    const skipDynamicSkin = shouldSkipDynamicSkinCss(slotId);
    const cssSkinFile = !skipDynamicSkin && skinBase
        ? `${skinBase}/style/apps/${skinId}.skin.css`
        : null;
    const cssSkinFallbackFile = !skipDynamicSkin && skinBase
        ? `${skinBase}/style/apps/${resolveExplorerSkinFallbackId(templateId)}.skin.css`
        : null;

    return loadSlotAssets(slotId, templateId, skinId, appsBase, skinBase, cssSkinFile, cssSkinFallbackFile)
        .then(({ html, cssBase, cssSkin }) => {
            injectSlot(container, slotId, templateId, html, cssBase, cssSkin);
        });
};

if (typeof window !== 'undefined') {
    window.reloadCapsuleSlot = reloadCapsuleSlot;
}

const bootCapsuleContentLoad = () => {
    if (typeof window !== 'undefined' && window.CAPSULE_SKIN_PROFILE_APPLIED) {
        startCapsuleContentLoad();
        return;
    }
    if (typeof document !== 'undefined') {
        document.addEventListener('capsule-skin-ready', () => {
            startCapsuleContentLoad();
        }, { once: true });
        return;
    }
    startCapsuleContentLoad();
};

if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootCapsuleContentLoad);
} else {
    setTimeout(bootCapsuleContentLoad, 0);
}
