function terminalQuery(root, selector, fallbackSelector) {
    if (root.matches && root.matches(selector)) {
        return root;
    }
    const nested = root.querySelector(selector);
    if (nested) {
        return nested;
    }
    return fallbackSelector ? root.querySelector(fallbackSelector) : null;
}

function createTerminalElement(tag, className, dataName) {
    const element = document.createElement(tag);
    if (className) {
        element.className = className;
    }
    if (dataName) {
        element.setAttribute(dataName, '');
    }
    return element;
}

function ensureTerminalShell(container) {
    let app = terminalQuery(container, '[data-terminal-app]', '#terminalContainer');
    if (!app) {
        app = createTerminalElement('section', 'capsule-terminal', 'data-terminal-app');
        container.appendChild(app);
    }

    let output = terminalQuery(app, '[data-terminal-output]', '#output');
    if (!output) {
        output = createTerminalElement('div', 'capsule-terminal__output', 'data-terminal-output');
        output.id = 'output';
        app.appendChild(output);
    }

    let form = terminalQuery(app, '[data-terminal-form]', '#input');
    if (!form) {
        form = createTerminalElement('form', 'capsule-terminal__input', 'data-terminal-form');
        form.id = 'input';
        app.appendChild(form);
    }

    let prompt = terminalQuery(form, '[data-terminal-prompt]', '#prompt');
    if (!prompt) {
        prompt = createTerminalElement('span', 'capsule-terminal__prompt', 'data-terminal-prompt');
        prompt.id = 'prompt';
        form.appendChild(prompt);
    }

    let commandInput = terminalQuery(form, '[data-terminal-command]', '#command');
    if (!commandInput) {
        commandInput = createTerminalElement('input', 'capsule-terminal__command', 'data-terminal-command');
        commandInput.id = 'command';
        commandInput.type = 'text';
        commandInput.autocomplete = 'off';
        commandInput.spellcheck = false;
        form.appendChild(commandInput);
    }

    return { app, output, form, prompt, commandInput };
}

function renderTerminalLine(output, text, className) {
    const row = document.createElement('div');
    row.className = className || 'capsule-terminal__line';

    const code = document.createElement('code');
    code.textContent = text;
    row.appendChild(code);
    output.appendChild(row);
}

const PTYXIS_TERMINAL_BODY_IDS = new Set(['rocky', 'fedora', 'alma', 'ubuntu', 'anduinos']);

function usesPtyxisTerminalChrome() {
    return Boolean(document.body && PTYXIS_TERMINAL_BODY_IDS.has(document.body.id));
}

function hostHasColoredTerminalChrome(node) {
    const host = node && node.closest ? node.closest('[data-link="terminal"], #terminal') : null;
    return Boolean(
        host && (
            host.classList.contains('terminal-window--gnome')
            || host.classList.contains('terminal-window--cosmic')
            || host.classList.contains('terminal-window--fedora')
            || (document.body && document.body.id === 'ubuntu')
        )
    );
}

function appendPromptSegments(parent, text) {
    const trimmed = String(text || '').replace(/\s+$/, '');
    const match = trimmed.match(/^(.+@[^:]+)(:)([^$]+)(\$\s*)$/);
    if (!match) {
        parent.appendChild(document.createTextNode(trimmed));
        return;
    }
    const userHost = document.createElement('span');
    userHost.className = 'capsule-terminal__prompt-user';
    userHost.textContent = match[1];
    const colon = document.createElement('span');
    colon.className = 'capsule-terminal__prompt-colon';
    colon.textContent = match[2];
    const pathSeg = document.createElement('span');
    pathSeg.className = 'capsule-terminal__prompt-path-seg';
    pathSeg.textContent = match[3];
    const dollar = document.createElement('span');
    dollar.className = 'capsule-terminal__prompt-dollar';
    dollar.textContent = match[4];
    parent.append(userHost, colon, pathSeg, dollar);
}

function renderExecutedCommand(output, promptText, command) {
    const row = document.createElement('div');
    row.className = 'capsule-terminal__line capsule-terminal__line--command';

    const lineCode = document.createElement('code');
    lineCode.className = 'capsule-terminal__command-line';
    const prompt = String(promptText || '').replace(/\s+$/, '');
    const cmd = String(command || '').trim();
    if (hostHasColoredTerminalChrome(output)) {
        appendPromptSegments(lineCode, prompt);
        if (cmd) {
            lineCode.appendChild(document.createTextNode(` ${cmd}`));
        }
    } else {
        lineCode.textContent = cmd ? `${prompt} ${cmd}` : prompt;
    }
    row.appendChild(lineCode);

    output.appendChild(row);
}

function scrollTerminalToBottom(elements) {
    if (!elements || !elements.output) {
        return;
    }
    const targets = [elements.output, elements.app, elements.app.parentElement].filter(Boolean);
    targets.forEach((target) => {
        target.scrollTop = target.scrollHeight;
    });
}

function updateTerminalPrompt(elements, session) {
    const promptText = session.getPrompt();
    paintTerminalPrompt(elements.prompt, promptText);
    const windowElement = elements.app.closest('.windowElement');
    syncGnomeTerminalTitle(windowElement, promptText);
}

function createFedoraTerminalButton(className, label, text) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.setAttribute('aria-label', label);
    if (text) {
        button.textContent = text;
    }
    return button;
}

function resolveFedoraTerminalPrompt() {
    const profile = typeof window.CAPSULE_TERMINAL_PROFILE === 'string'
        ? window.CAPSULE_TERMINAL_PROFILE
        : '';
    if ((document.body && document.body.id === 'rocky') || profile === 'rocky') {
        return 'capsule@rocky:~';
    }
    return 'fed@fedora:~';
}

function ensureFedoraTerminalTabsSlot(header) {
    let tabsSlot = header.querySelector('.fedora-terminal-header__tabs');
    if (!tabsSlot) {
        tabsSlot = document.createElement('div');
        tabsSlot.className = 'fedora-terminal-header__tabs';
        tabsSlot.setAttribute('data-window-drag-region', '');
        const title = header.querySelector('#windowTitle');
        const navs = header.querySelectorAll('nav');
        const right = navs[1] || null;
        if (right) {
            header.insertBefore(tabsSlot, right);
        } else if (title) {
            header.insertBefore(tabsSlot, title);
        } else {
            header.appendChild(tabsSlot);
        }
    }
    return tabsSlot;
}

function ensureFedoraTerminalTabsChrome(windowElement, header) {
    ensureFedoraTerminalTabsSlot(header);
    const legacyTabs = windowElement.querySelector(':scope > .fedora-terminal-tabs');
    if (legacyTabs) {
        legacyTabs.remove();
    }
}

let fedoraTerminalOpenMenu = null;
let fedoraTerminalOpenMenuAnchor = null;

function closeFedoraTerminalMenu() {
    if (fedoraTerminalOpenMenu) {
        fedoraTerminalOpenMenu.hidden = true;
    }
    if (fedoraTerminalOpenMenuAnchor) {
        fedoraTerminalOpenMenuAnchor.setAttribute('aria-expanded', 'false');
    }
    fedoraTerminalOpenMenu = null;
    fedoraTerminalOpenMenuAnchor = null;
}

function resolveTerminalAboutLabel() {
    if (usesPtyxisTerminalChrome()) {
        return 'À propos de Ptyxis';
    }
    return 'À propos du terminal';
}

function createFedoraTerminalMenu(windowElement) {
    let menu = windowElement.querySelector('#fedora-terminal-main-menu');
    if (menu) {
        return menu;
    }

    menu = document.createElement('div');
    menu.id = 'fedora-terminal-main-menu';
    menu.className = 'fedora-terminal-popover';
    menu.hidden = true;
    menu.setAttribute('role', 'menu');
    menu.setAttribute('aria-label', 'Menu du terminal');

    const entries = [
        { action: 'new-tab', label: 'Nouvel onglet' },
        { action: 'new-window', label: 'Nouvelle fenêtre' },
        { type: 'separator' },
        { action: 'preferences', label: 'Préférences…' },
        { action: 'shortcuts', label: 'Raccourcis clavier…' },
        { type: 'separator' },
        { action: 'about', label: resolveTerminalAboutLabel() },
    ];

    entries.forEach((entry) => {
        if (entry.type === 'separator') {
            const sep = document.createElement('div');
            sep.className = 'fedora-terminal-popover__separator';
            sep.setAttribute('role', 'separator');
            menu.appendChild(sep);
            return;
        }
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'fedora-terminal-popover__item';
        item.setAttribute('role', 'menuitem');
        item.dataset.terminalMenuAction = entry.action;
        item.textContent = entry.label;
        menu.appendChild(item);
    });

    windowElement.appendChild(menu);
    return menu;
}

function openFedoraTerminalMenu(menu, anchor) {
    if (!menu || !anchor) {
        return;
    }
    closeFedoraTerminalMenu();
    menu.hidden = false;
    const anchorRect = anchor.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const left = Math.max(8, Math.min(anchorRect.right - menuRect.width, window.innerWidth - menuRect.width - 8));
    const top = Math.min(anchorRect.bottom + 4, window.innerHeight - menuRect.height - 8);
    menu.style.left = `${left}px`;
    menu.style.top = `${top}px`;
    anchor.setAttribute('aria-expanded', 'true');
    fedoraTerminalOpenMenu = menu;
    fedoraTerminalOpenMenuAnchor = anchor;
}

function runFedoraTerminalMenuAction(action, windowElement, header) {
    if (action === 'new-tab') {
        if (typeof window.openTerminalTab === 'function') {
            window.openTerminalTab();
        }
        return;
    }
    if (action === 'new-window') {
        if (typeof window.openWindowByDataLink === 'function') {
            window.openWindowByDataLink('terminal');
        }
        return;
    }
    if (action === 'preferences') {
        if (typeof window.openWindowByDataLink === 'function') {
            window.openWindowByDataLink('themes');
        }
        return;
    }
    if (action === 'shortcuts') {
        const shortcuts = [
            'Ctrl+Shift+T — Nouvel onglet',
            'Ctrl+Shift+W — Fermer l’onglet',
            'Ctrl+Shift+N — Nouvelle fenêtre',
            'Ctrl+Shift+F — Rechercher',
        ].join('\n');
        window.alert(shortcuts);
        return;
    }
    if (action === 'about') {
        window.alert(`${resolveTerminalAboutLabel()}\nTerminal simulé CapsuleOS (profil ${document.body?.id || 'linux'}).`);
    }
}

function bindFedoraTerminalMenu(windowElement, header, menuButton) {
    if (!windowElement || !header || !menuButton || menuButton.dataset.terminalMenuBound === 'true') {
        return;
    }
    menuButton.dataset.terminalMenuBound = 'true';
    const menu = createFedoraTerminalMenu(windowElement);

    menuButton.addEventListener('click', (event) => {
        event.stopPropagation();
        if (!menu.hidden && fedoraTerminalOpenMenu === menu) {
            closeFedoraTerminalMenu();
            return;
        }
        openFedoraTerminalMenu(menu, menuButton);
    });

    menu.addEventListener('click', (event) => {
        const item = event.target.closest('[data-terminal-menu-action]');
        if (!item) {
            return;
        }
        event.stopPropagation();
        runFedoraTerminalMenuAction(item.dataset.terminalMenuAction, windowElement, header);
        closeFedoraTerminalMenu();
    });

    if (document.documentElement.dataset.terminalMenuOutsideClose !== 'true') {
        document.documentElement.dataset.terminalMenuOutsideClose = 'true';
        document.addEventListener('click', () => closeFedoraTerminalMenu());
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                closeFedoraTerminalMenu();
            }
        });
    }
}

function bindGnomeTerminalChromeInteractions(windowElement) {
    const header = windowElement.querySelector('#windowHeader');
    if (!header || header.dataset.gnomeTerminalInteractions === 'true') {
        return;
    }
    header.dataset.gnomeTerminalInteractions = 'true';

    const newTabBtn = header.querySelector('.gnome-terminal-header__button--new-tab');
    if (newTabBtn) {
        newTabBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            if (typeof window.openWindowByDataLink === 'function') {
                window.openWindowByDataLink('terminal');
            }
        });
    }

    const searchBtn = header.querySelector('.gnome-terminal-header__button--search');
    if (searchBtn) {
        searchBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            const command = windowElement.querySelector('#command, [data-terminal-command]');
            if (command) {
                command.focus();
                if (typeof command.select === 'function') {
                    command.select();
                }
            }
        });
    }

    let menuBtn = header.querySelector('.gnome-terminal-header__button--menu');
    if (!menuBtn) {
        menuBtn = createFedoraTerminalButton(
            'gnome-terminal-header__button gnome-terminal-header__button--menu',
            'Menu'
        );
        const right = header.querySelectorAll('nav')[1];
        const minimize = right && right.querySelector('#minimizeBtn');
        if (right) {
            if (minimize) {
                right.insertBefore(menuBtn, minimize);
            } else {
                right.appendChild(menuBtn);
            }
        }
    }
    bindFedoraTerminalMenu(windowElement, header, menuBtn);
}

function isGnomeTerminalChrome() {
    return Boolean(document.body && (document.body.id === 'ubuntu' || document.body.id === 'popos' || document.body.id === 'mint'));
}

function isCosmicTerminalChrome() {
    return Boolean(document.body && document.body.id === 'popos');
}

function paintTerminalPrompt(promptEl, text) {
    if (!promptEl) {
        return;
    }
    const colored = hostHasColoredTerminalChrome(promptEl);
    const isActivePrompt = Boolean(promptEl.closest('[data-terminal-form], #input'));
    if (colored && isActivePrompt && text.match(/^(.+@[^:]+)(:)([^$]+)(\$\s*)$/)) {
        promptEl.textContent = '';
        appendPromptSegments(promptEl, text);
        return;
    }
    promptEl.textContent = text;
}

function paintGnomeTerminalTitle(titleEl, promptText) {
    if (!titleEl) {
        return;
    }
    const text = String(promptText || '').replace(/\$\s*$/, '');
    const match = text.match(/^(.+@[^:]+)(:.*)$/);
    if (!match) {
        titleEl.textContent = text;
        return;
    }
    titleEl.textContent = '';
    const userHost = document.createElement('span');
    userHost.className = 'capsule-terminal__title-user';
    userHost.textContent = match[1];
    const rest = document.createElement('span');
    rest.className = 'capsule-terminal__title-rest';
    rest.textContent = match[2];
    titleEl.append(userHost, rest);
}

function syncGnomeTerminalTitle(windowElement, promptText) {
    if (!windowElement || !isGnomeTerminalChrome()) {
        return;
    }
    const title = windowElement.querySelector('#windowTitle');
    paintGnomeTerminalTitle(title, promptText);
}

function isListingDirectory(session, name) {
    if (!window.CapsuleTerminal || !session || !session.state) {
        return false;
    }
    const { fs, cwd, home } = session.state;
    const resolved = window.CapsuleTerminal.resolvePath(cwd, name, home);
    if (fs[resolved] && typeof fs[resolved] === 'object') {
        return true;
    }
    const parent = fs[cwd];
    if (parent && typeof parent === 'object') {
        if (Object.prototype.hasOwnProperty.call(parent, name)) {
            return typeof parent[name] === 'object';
        }
        const slashName = `/${name}`;
        if (Object.prototype.hasOwnProperty.call(parent, slashName)) {
            return typeof parent[slashName] === 'object';
        }
    }
    return false;
}

function getListingColumnWidth(lines) {
    const names = lines.flatMap((line) => (
        String(line || '').trim().split(/\s+/).filter(Boolean)
    )).map((name) => (name.startsWith('/') ? name.slice(1) : name));
    if (!names.length) {
        return 10;
    }
    const longest = Math.max(...names.map((name) => name.length));
    return longest + 3;
}

function renderListingLine(output, line, session, columnWidthCh) {
    const row = document.createElement('div');
    row.className = 'capsule-terminal__line capsule-terminal__line--listing';

    const code = document.createElement('code');
    if (columnWidthCh) {
        const lsVar = document.body && document.body.id === 'popos'
            ? '--popos-terminal-ls-col-width'
            : '--ubuntu-terminal-ls-col-width';
        code.style.setProperty(lsVar, `${columnWidthCh}ch`);
    }
    const names = String(line || '').trim().split(/\s+/).filter(Boolean);
    const gnomeListing = isGnomeTerminalChrome();
    names.forEach((name, index) => {
        const cleanName = name.startsWith('/') ? name.slice(1) : name;
        const span = document.createElement('span');
        span.textContent = cleanName;
        if (gnomeListing || isListingDirectory(session, cleanName)) {
            span.className = 'capsule-terminal__dir';
        }
        code.appendChild(span);
        if (index < names.length - 1) {
            code.appendChild(document.createTextNode('  '));
        }
    });
    row.appendChild(code);
    output.appendChild(row);
}

function decorateCosmicTerminalWindow(container) {
    if (!isCosmicTerminalChrome()) {
        return;
    }

    const windowElement = container.closest('.windowElement');
    if (!windowElement || windowElement.dataset.link !== 'terminal') {
        return;
    }

    windowElement.classList.add('terminal-window--cosmic');

    const applyChrome = () => {
        const header = windowElement.querySelector('#windowHeader');
        if (!header) {
            return false;
        }
        if (header.dataset.cosmicTerminalChrome === 'true') {
            return true;
        }

        header.dataset.cosmicTerminalChrome = 'true';
        const navs = header.querySelectorAll('nav');
        const left = navs[0];
        const right = navs[1];

        if (left) {
            left.innerHTML = '';
            ['Fichier', 'Modifier', 'Affichage'].forEach((label) => {
                const item = document.createElement('button');
                item.type = 'button';
                item.className = 'cosmic-terminal-header__menu';
                item.textContent = label;
                item.tabIndex = -1;
                left.appendChild(item);
            });
        }

        if (right) {
            right.querySelectorAll('.gnome-terminal-header__button').forEach((node) => node.remove());
            const addTab = createFedoraTerminalButton(
                'cosmic-terminal-header__button cosmic-terminal-header__button--new-tab',
                'Nouvel onglet',
                ''
            );
            const minimize = right.querySelector('#minimizeBtn');
            if (minimize) {
                right.insertBefore(addTab, minimize);
            } else {
                right.appendChild(addTab);
            }
        }

        return true;
    };

    const refreshCosmicTerminalPromptChrome = () => {
        const app = windowElement.querySelector('[data-terminal-app]');
        if (!app || !app.__capsuleTerminalSession) {
            return;
        }
        const promptText = app.__capsuleTerminalSession.getPrompt();
        const promptEl = windowElement.querySelector('[data-terminal-prompt], #prompt');
        if (promptEl) {
            paintTerminalPrompt(promptEl, promptText);
        }
        syncGnomeTerminalTitle(windowElement, promptText);
    };

    if (applyChrome()) {
        refreshCosmicTerminalPromptChrome();
    } else if (windowElement.dataset.cosmicTerminalObserver !== 'true') {
        windowElement.dataset.cosmicTerminalObserver = 'true';
        const observer = new MutationObserver(() => {
            if (applyChrome()) {
                observer.disconnect();
                refreshCosmicTerminalPromptChrome();
            }
        });
        observer.observe(windowElement, { childList: true });
    }
}

function decorateGnomeTerminalWindow(container) {
    if (!isGnomeTerminalChrome()) {
        return;
    }

    const windowElement = container.closest('.windowElement');
    if (!windowElement || windowElement.dataset.link !== 'terminal') {
        return;
    }

    if (isCosmicTerminalChrome()) {
        decorateCosmicTerminalWindow(container);
        return;
    }

    if (usesPtyxisTerminalChrome()) {
        return;
    }

    windowElement.classList.add('terminal-window--gnome');

    const applyChrome = () => {
        const header = windowElement.querySelector('#windowHeader');
        if (!header) {
            return false;
        }
        if (header.dataset.gnomeTerminalChrome === 'true') {
            return true;
        }

        header.dataset.gnomeTerminalChrome = 'true';
        const navs = header.querySelectorAll('nav');
        const left = navs[0];
        const right = navs[1];

        if (left) {
            left.innerHTML = '';
            const addTab = createFedoraTerminalButton(
                'gnome-terminal-header__button gnome-terminal-header__button--new-tab',
                'Nouvel onglet',
                ''
            );
            left.appendChild(addTab);
        }

        if (right) {
            const existingChrome = right.querySelectorAll('.gnome-terminal-header__button');
            existingChrome.forEach((node) => node.remove());

            const search = createFedoraTerminalButton(
                'gnome-terminal-header__button gnome-terminal-header__button--search',
                'Rechercher'
            );
            const menu = createFedoraTerminalButton(
                'gnome-terminal-header__button gnome-terminal-header__button--menu',
                'Menu'
            );
            const minimize = right.querySelector('#minimizeBtn');
            if (minimize) {
                right.insertBefore(search, minimize);
                right.insertBefore(menu, minimize);
            } else {
                right.appendChild(search);
                right.appendChild(menu);
            }
        }

        return true;
    };

    const refreshGnomeTerminalPromptChrome = () => {
        const app = windowElement.querySelector('[data-terminal-app]');
        if (!app || !app.__capsuleTerminalSession) {
            return;
        }
        const promptText = app.__capsuleTerminalSession.getPrompt();
        const promptEl = windowElement.querySelector('[data-terminal-prompt], #prompt');
        if (promptEl) {
            paintTerminalPrompt(promptEl, promptText);
        }
        syncGnomeTerminalTitle(windowElement, promptText);
    };

    if (applyChrome()) {
        refreshGnomeTerminalPromptChrome();
        bindGnomeTerminalChromeInteractions(windowElement);
    } else if (windowElement.dataset.gnomeTerminalObserver !== 'true') {
        windowElement.dataset.gnomeTerminalObserver = 'true';
        const observer = new MutationObserver(() => {
            if (applyChrome()) {
                observer.disconnect();
                refreshGnomeTerminalPromptChrome();
                bindGnomeTerminalChromeInteractions(windowElement);
            }
        });
        observer.observe(windowElement, { childList: true });
    }
}

function decorateFedoraTerminalWindow(container) {
    if (!usesPtyxisTerminalChrome()) {
        return;
    }

    const windowElement = container.closest('.windowElement');
    if (!windowElement || windowElement.dataset.link !== 'terminal') {
        return;
    }

    windowElement.classList.remove('terminal-window--gnome');
    windowElement.classList.add('terminal-window--fedora', 'terminal-window--csd');

    const applyChrome = () => {
        const header = windowElement.querySelector('#windowHeader');
        if (!header) {
            return false;
        }
        if (header.dataset.fedoraTerminalChrome === 'true') {
            return true;
        }

        header.dataset.fedoraTerminalChrome = 'true';
        header.classList.add('fedora-terminal-header');
        const navs = header.querySelectorAll('nav');
        const left = navs[0];
        const right = navs[1];
        const title = header.querySelector('#windowTitle');
        if (title) {
            title.hidden = true;
            title.setAttribute('aria-hidden', 'true');
        }

        if (left) {
            left.innerHTML = '';
            const addTab = createFedoraTerminalButton(
                'fedora-terminal-header__button fedora-terminal-header__button--add',
                'Nouvel onglet',
                '+'
            );
            addTab.setAttribute('aria-pressed', 'false');
            left.appendChild(addTab);
            addTab.addEventListener('click', (event) => {
                event.stopPropagation();
                if (typeof window.openTerminalTab === 'function') {
                    window.openTerminalTab();
                }
            });
        }

        if (right && !right.querySelector('.fedora-terminal-header__button--grid')) {
            const grid = createFedoraTerminalButton(
                'fedora-terminal-header__button fedora-terminal-header__button--grid',
                'Vue en grille'
            );
            right.insertBefore(grid, right.firstChild);
        }

        if (right && !right.querySelector('.fedora-terminal-header__button--menu')) {
            const menu = createFedoraTerminalButton(
                'fedora-terminal-header__button fedora-terminal-header__button--menu',
                'Menu'
            );
            const minimize = right.querySelector('#minimizeBtn');
            if (minimize) {
                right.insertBefore(menu, minimize);
            } else {
                right.appendChild(menu);
            }
            bindFedoraTerminalMenu(windowElement, header, menu);
        }

        ensureFedoraTerminalTabsChrome(windowElement, header);
        if (typeof window.scheduleTerminalTabsBind === 'function') {
            window.scheduleTerminalTabsBind(windowElement);
        }
        return true;
    };

    if (!applyChrome() && windowElement.dataset.fedoraTerminalObserver !== 'true') {
        windowElement.dataset.fedoraTerminalObserver = 'true';
        const observer = new MutationObserver(() => {
            if (applyChrome()) {
                observer.disconnect();
                if (typeof window.scheduleTerminalTabsBind === 'function') {
                    window.scheduleTerminalTabsBind(windowElement);
                }
            }
        });
        observer.observe(windowElement, { childList: true });
    } else if (typeof window.scheduleTerminalTabsBind === 'function') {
        window.scheduleTerminalTabsBind(windowElement);
    }
}

function initTerminal() {
    initTerminalWhenReady();
}

function bindTerminalCommandHistory(commandInput, session) {
    let historyIndex = -1;
    let draftLine = '';

    commandInput.addEventListener('keydown', (event) => {
        const entries = session.state.history || [];
        if (event.key === 'ArrowUp') {
            if (!entries.length) {
                return;
            }
            event.preventDefault();
            if (historyIndex === -1) {
                draftLine = commandInput.value;
            }
            if (historyIndex < entries.length - 1) {
                historyIndex += 1;
                commandInput.value = entries[entries.length - 1 - historyIndex];
            }
        } else if (event.key === 'ArrowDown') {
            if (historyIndex === -1) {
                return;
            }
            event.preventDefault();
            if (historyIndex > 0) {
                historyIndex -= 1;
                commandInput.value = entries[entries.length - 1 - historyIndex];
            } else {
                historyIndex = -1;
                commandInput.value = draftLine;
            }
        }
    });

    commandInput.addEventListener('input', () => {
        historyIndex = -1;
        draftLine = '';
    });
}

function resetTerminalHistoryCursor(commandInput) {
    commandInput.dispatchEvent(new Event('input'));
}

function initTerminalWhenReady() {
    const host = document.querySelector('[data-link="terminal"]') || document;
    const container = document.getElementById('terminalContainer') || host.querySelector('[data-terminal-app]');

    if (!container || !window.CapsuleTerminal || typeof window.executeTerminalCommand !== 'function') {
        setTimeout(initTerminalWhenReady, 100);
        return;
    }

    const elements = ensureTerminalShell(container);
    decorateGnomeTerminalWindow(container);
    decorateFedoraTerminalWindow(container);
    if (elements.app.dataset.terminalReady === 'true') {
        const windowElement = host.closest('.windowElement') || host;
        const session = elements.app.__capsuleTerminalSession;
        if (typeof window.scheduleTerminalTabsBind === 'function' && session) {
            window.scheduleTerminalTabsBind(windowElement);
        }
        elements.commandInput.focus();
        return;
    }

    if (elements.app.dataset.terminalBooting === 'true') {
        return;
    }
    elements.app.dataset.terminalBooting = 'true';

    const activeProfile = typeof window.getTerminalActiveProfile === 'function'
        ? window.getTerminalActiveProfile()
        : (window.CAPSULE_TERMINAL_ACTIVE_PROFILE || {});
    const kernelName = activeProfile.osFamily === 'linux'
        ? `CapsuleOS Linux (${activeProfile.distro || 'generic'})`
        : `CapsuleOS ${activeProfile.osFamily || 'OS'}`;

    const bootTerminal = async () => {
        const baseFs = typeof fileSystem !== 'undefined' ? fileSystem : {};
        let fileContents = (typeof window !== 'undefined' && window.CAPSULE_TERMINAL_FILE_CONTENTS) || {};
        let fileHrefs = {};

        if (window.CapsuleVirtualShell && typeof window.CapsuleVirtualShell.prepareTerminalFilesystem === 'function') {
            const hydration = await window.CapsuleVirtualShell.prepareTerminalFilesystem(baseFs);
            fileContents = hydration.fileContents || fileContents;
            fileHrefs = hydration.fileHrefs || fileHrefs;
        }

        const session = window.CapsuleTerminal.createSession({
            cwd: window.CAPSULE_TERMINAL_HOME || '/',
            home: window.CAPSULE_TERMINAL_HOME || '/',
            user: window.CAPSULE_TERMINAL_USER || 'user',
            host: window.CAPSULE_TERMINAL_HOST || 'host',
            fs: baseFs,
            fileContents,
            fileHrefs,
            kernelName
        });

        elements.app.dataset.terminalReady = 'true';
        delete elements.app.dataset.terminalBooting;
        elements.app.__capsuleTerminalSession = session;
        updateTerminalPrompt(elements, session);
        scrollTerminalToBottom(elements);

        elements.app.addEventListener('click', () => {
            elements.commandInput.focus();
        });

        bindTerminalCommandHistory(elements.commandInput, session);

        if (window.CapsuleTerminalCompletion
            && typeof window.CapsuleTerminalCompletion.bindTabCompletion === 'function') {
            window.CapsuleTerminalCompletion.bindTabCompletion(
                elements.commandInput,
                session,
                elements.output
            );
        }

        elements.form.addEventListener('submit', (event) => {
            event.preventDefault();
            const command = elements.commandInput.value;
            const promptBeforeExecute = session.getPrompt();
            const result = session.execute(command);

            const renderResultLines = (lines, isError) => {
                (lines || []).forEach((line) => {
                    renderTerminalLine(
                        elements.output,
                        line,
                        isError ? 'capsule-terminal__line capsule-terminal__line--error' : 'capsule-terminal__line'
                    );
                });
            };

            if (result && result.clear) {
                elements.output.innerHTML = '';
            } else {
                renderExecutedCommand(elements.output, promptBeforeExecute, command);
                if (result && result.openEditor && window.CapsuleTerminalEditors
                    && typeof window.CapsuleTerminalEditors.mountInTerminal === 'function') {
                    renderResultLines(result.lines, result.error);
                    elements.commandInput.disabled = true;
                    window.CapsuleTerminalEditors.mountInTerminal(elements.app, session, result.openEditor, {
                        onClose(closed) {
                            elements.commandInput.disabled = false;
                            renderResultLines(closed.lines, closed.error);
                            updateTerminalPrompt(elements, session);
                            scrollTerminalToBottom(elements);
                            if (typeof window.syncTerminalTabs === 'function') {
                                window.syncTerminalTabs();
                            }
                            elements.commandInput.focus();
                        }
                    });
                    elements.commandInput.value = '';
                    resetTerminalHistoryCursor(elements.commandInput);
                    return;
                }
                const listingColWidth = result.listing
                    ? getListingColumnWidth(result.lines || [])
                    : 0;
                (result.lines || []).forEach((line) => {
                    if (result.listing) {
                        renderListingLine(elements.output, line, session, listingColWidth);
                        return;
                    }
                    renderTerminalLine(
                        elements.output,
                        line,
                        result.error ? 'capsule-terminal__line capsule-terminal__line--error' : 'capsule-terminal__line'
                    );
                });
            }

            elements.commandInput.value = '';
            resetTerminalHistoryCursor(elements.commandInput);
            updateTerminalPrompt(elements, session);
            scrollTerminalToBottom(elements);
            requestAnimationFrame(() => scrollTerminalToBottom(elements));
            if (typeof window.syncTerminalTabs === 'function') {
                window.syncTerminalTabs();
            }
            elements.commandInput.focus();
        });

        const windowElement = host.closest('.windowElement') || host;
        if (typeof window.scheduleTerminalTabsBind === 'function') {
            window.scheduleTerminalTabsBind(windowElement);
        }

        elements.commandInput.focus();
    };

    bootTerminal().catch((error) => {
        console.error('CapsuleOS: échec initialisation terminal', error);
        delete elements.app.dataset.terminalBooting;
        setTimeout(initTerminalWhenReady, 200);
    });
}

if (typeof window !== 'undefined') {
    window.updateTerminalPrompt = updateTerminalPrompt;
    window.scrollTerminalToBottom = scrollTerminalToBottom;
    window.resolveFedoraTerminalPrompt = resolveFedoraTerminalPrompt;
}
