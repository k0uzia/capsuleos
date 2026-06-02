/**
 * Éditeurs terminal partagés (nano / vim MVP) — CapsuleOS.
 * Importable par linux, macOS, BSD, Android, UNIX (shells …/terminal).
 *
 * API : window.CapsuleTerminalEditors
 *   prepareCommand(state, cmd, args, helpers) → résultat executeCommand (+ openEditor)
 *   openNano(path, options) / openVim(path, options)
 *   mountInTerminal(host, session, spec, callbacks)
 */
(function initCapsuleTerminalEditors(global) {
    'use strict';

    function normalizePath(path) {
        const normalized = String(path || '/').replace(/\/+/g, '/');
        return normalized.length > 1 ? normalized.replace(/\/+$/, '') : '/';
    }

    function basename(path) {
        return String(path || '').split('/').filter(Boolean).pop() || '';
    }

    function dirname(path) {
        const normalized = normalizePath(path);
        if (normalized === '/') {
            return '/';
        }
        const parts = normalized.split('/').filter(Boolean);
        parts.pop();
        return parts.length ? normalizePath(`/${parts.join('/')}`) : '/';
    }

    function ensureFileContents(state) {
        if (!state.fileContents || typeof state.fileContents !== 'object') {
            state.fileContents = {};
        }
        return state.fileContents;
    }

    function fsIsDir(fs, path) {
        const node = fs[path];
        return Boolean(node && typeof node === 'object');
    }

    function isTextFileName(name) {
        if (global.CapsuleVirtualShell && typeof global.CapsuleVirtualShell.isTextFileName === 'function') {
            return global.CapsuleVirtualShell.isTextFileName(name);
        }
        const dot = String(name || '').lastIndexOf('.');
        if (dot <= 0) {
            return true;
        }
        return ['txt', 'md', 'log', 'sh', 'json', 'csv', 'xml', 'html', 'css', 'js'].includes(String(name).slice(dot + 1).toLowerCase());
    }

    function entryPath(cwd, target, resolvePath) {
        return resolvePath(cwd, target || '');
    }

    function loadFileForEditor(state, fs, cwd, target, resolvePath, cmd) {
        if (!target) {
            if (cmd === 'vim') {
                return { error: 'fichier requis (ex. vim notes.txt)' };
            }
            const untitled = 'untitled.txt';
            return {
                isNew: true,
                resolved: entryPath(cwd, untitled, resolvePath),
                content: '',
                displayName: untitled
            };
        }
        const resolved = entryPath(cwd, target, resolvePath);
        if (fsIsDir(fs, resolved)) {
            return { error: `${target}: Is a directory` };
        }
        const name = basename(resolved) || target;
        if (!isTextFileName(name)) {
            return { error: `${target}: Binary file` };
        }
        const parentDir = fs[cwd] || {};
        const inCwd = Object.prototype.hasOwnProperty.call(parentDir, target)
            || Object.prototype.hasOwnProperty.call(parentDir, `/${target}`);
        const fileContents = ensureFileContents(state);
        const hasContent = fileContents[resolved] != null;
        const hasHref = Boolean((state.fileHrefs || {})[resolved]);
        if (!inCwd && !hasContent && !hasHref) {
            return {
                isNew: true,
                resolved,
                content: '',
                displayName: name
            };
        }
        const content = hasContent
            ? String(fileContents[resolved])
            : `Fichier simulé: ${name}\nCapsuleOS Terminal`;
        return { resolved, content, displayName: name, isNew: false };
    }

    function saveFileFromEditor(state, fs, resolved, content) {
        const fileContents = ensureFileContents(state);
        fileContents[resolved] = content;
        const parent = dirname(resolved);
        const name = basename(resolved);
        if (!fs[parent]) {
            fs[parent] = {};
        }
        if (!Object.prototype.hasOwnProperty.call(fs[parent], name)) {
            fs[parent][name] = {};
        }
        return { saved: true, resolved };
    }

    function resolveEditorCssHref() {
        if (typeof document === 'undefined') {
            return 'usr/share/capsuleos/themes/linux/terminal-editors.css';
        }
        const path = document.location.pathname || '';
        const segments = path.split('/').filter(Boolean);
        if (segments.length && /\.[a-z0-9]+$/i.test(segments[segments.length - 1])) {
            segments.pop();
        }
        const prefix = segments.length > 0 ? `${'../'.repeat(segments.length)}` : '';
        return `${prefix}usr/share/capsuleos/themes/linux/terminal-editors.css`;
    }

    function ensureEditorStylesheetFixed() {
        if (typeof document === 'undefined') {
            return;
        }
        const id = 'capsule-terminal-editors-css';
        if (document.getElementById(id)) {
            return;
        }
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = resolveEditorCssHref();
        document.head.appendChild(link);
    }

    function prepareCommand(state, cmd, args, helpers) {
        const fs = state.fs || {};
        const resolvePath = helpers.resolvePath || ((cwd, target) => target);
        const rawCommand = helpers.rawCommand || `${cmd} ${args.join(' ')}`.trim();
        const format = helpers.formatCommandResult || ((s, c, lines, opts) => ({
            command: c,
            lines,
            error: Boolean(opts && opts.error),
            cwd: s.cwd
        }));

        const fileArg = args[0];
        const loaded = loadFileForEditor(state, fs, state.cwd, fileArg, resolvePath, cmd);
        if (loaded.error) {
            return format(state, rawCommand, [`${cmd}: ${loaded.error}`], { error: true });
        }

        return format(state, rawCommand, [`Ouverture de ${loaded.displayName} dans ${cmd}…`], {
            openEditor: {
                mode: cmd,
                resolved: loaded.resolved,
                displayName: loaded.displayName,
                content: loaded.content,
                isNew: Boolean(loaded.isNew),
                rawCommand
            }
        });
    }

    function createOverlay(mode, spec) {
        const root = document.createElement('div');
        root.className = `capsule-terminal-editor capsule-terminal-editor--${mode}`;
        root.setAttribute('role', 'dialog');
        root.setAttribute('aria-label', mode === 'vim' ? 'Vim' : 'GNU nano');

        const header = document.createElement('div');
        header.className = 'capsule-terminal-editor__header';
        header.textContent = mode === 'vim'
            ? `Vim — ${spec.displayName}`
            : `GNU nano — ${spec.displayName}`;

        const buffer = document.createElement('textarea');
        buffer.className = 'capsule-terminal-editor__buffer';
        buffer.value = spec.content || '';
        buffer.setAttribute('spellcheck', 'false');
        buffer.setAttribute('autocomplete', 'off');

        const status = document.createElement('div');
        status.className = 'capsule-terminal-editor__status';

        const cmdline = document.createElement('div');
        cmdline.className = 'capsule-terminal-editor__cmdline';

        root.appendChild(header);
        root.appendChild(buffer);
        root.appendChild(status);
        root.appendChild(cmdline);

        return { root, header, buffer, status, cmdline };
    }

    function mountInTerminal(host, session, spec, callbacks) {
        if (!host || !session) {
            return null;
        }
        ensureEditorStylesheetFixed();
        host.dataset.terminalEditorActive = 'true';

        const mode = spec.mode === 'vim' ? 'vim' : 'nano';
        const ui = createOverlay(mode, spec);
        host.style.position = host.style.position || 'relative';
        host.appendChild(ui.root);

        let dirty = false;
        let closed = false;
        const initial = ui.buffer.value;

        const fs = session.state.fs || {};
        const resolvePath = (cwd, target) => (
            global.CapsuleTerminal
                ? global.CapsuleTerminal.resolvePath(cwd, target, session.state.home)
                : target
        );

        function finish(lines, options) {
            if (closed) {
                return;
            }
            closed = true;
            ui.root.remove();
            delete host.dataset.terminalEditorActive;
            if (typeof callbacks.onClose === 'function') {
                callbacks.onClose({ lines: lines || [], error: Boolean(options && options.error) });
            }
        }

        function doSave() {
            saveFileFromEditor(session.state, fs, spec.resolved, ui.buffer.value);
            dirty = false;
            ui.status.textContent = `Écrit ${spec.displayName}`;
            ui.status.classList.remove('capsule-terminal-editor__status--error');
            return true;
        }

        ui.buffer.addEventListener('input', () => {
            dirty = ui.buffer.value !== initial;
        });

        if (mode === 'nano') {
            ui.status.textContent = '^G Aide  ^O Écrire  ^X Quitter';
            ui.buffer.addEventListener('keydown', (event) => {
                if (event.ctrlKey && (event.key === 'x' || event.key === 'X')) {
                    event.preventDefault();
                    if (dirty) {
                        const ok = global.confirm(`Enregistrer ${spec.displayName} avant de quitter ?`);
                        if (ok) {
                            doSave();
                        }
                    }
                    finish([`Fichier ${spec.displayName} fermé.`]);
                    return;
                }
                if (event.ctrlKey && (event.key === 'o' || event.key === 'O')) {
                    event.preventDefault();
                    doSave();
                    return;
                }
            });
        } else {
            let vimMode = 'normal';
            let cmdBuffer = '';

            function setVimStatus(text, isError) {
                ui.status.textContent = text;
                ui.status.classList.toggle('capsule-terminal-editor__status--error', Boolean(isError));
            }

            function updateVimChrome() {
                ui.root.classList.toggle('capsule-terminal-editor--vim-normal', vimMode === 'normal');
                ui.root.classList.toggle('capsule-terminal-editor--vim-command', vimMode === 'command');
                if (vimMode === 'insert') {
                    setVimStatus('-- INSERT --');
                    ui.buffer.readOnly = false;
                    ui.buffer.focus();
                } else if (vimMode === 'normal') {
                    setVimStatus('NORMAL');
                    ui.buffer.readOnly = true;
                } else {
                    ui.cmdline.textContent = `:${cmdBuffer}`;
                    setVimStatus('');
                }
            }

            updateVimChrome();

            function runVimCommand(line) {
                const trimmed = String(line || '').replace(/^:/, '').trim();
                if (trimmed === 'w' || trimmed === 'write') {
                    doSave();
                    setVimStatus(`"${spec.displayName}" écrit`);
                    vimMode = 'normal';
                    updateVimChrome();
                    return;
                }
                if (trimmed === 'q' || trimmed === 'quit') {
                    if (dirty) {
                        setVimStatus('Modifications non enregistrées (:wq ou :w)', true);
                        vimMode = 'normal';
                        updateVimChrome();
                        return;
                    }
                    finish([`Vim : ${spec.displayName} fermé.`]);
                    return;
                }
                if (trimmed === 'wq' || trimmed === 'x') {
                    doSave();
                    finish([`Vim : "${spec.displayName}" écrit et fermé.`]);
                    return;
                }
                if (trimmed === 'q!') {
                    finish(['Vim : modifications abandonnées.']);
                    return;
                }
                setVimStatus(`Commande inconnue : ${trimmed}`, true);
                vimMode = 'normal';
                updateVimChrome();
            }

            ui.buffer.addEventListener('keydown', (event) => {
                if (vimMode === 'insert') {
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        vimMode = 'normal';
                        updateVimChrome();
                    }
                    return;
                }
                if (vimMode === 'command') {
                    event.preventDefault();
                    if (event.key === 'Escape') {
                        cmdBuffer = '';
                        vimMode = 'normal';
                        updateVimChrome();
                        return;
                    }
                    if (event.key === 'Enter') {
                        runVimCommand(cmdBuffer);
                        cmdBuffer = '';
                        return;
                    }
                    if (event.key === 'Backspace') {
                        cmdBuffer = cmdBuffer.slice(0, -1);
                        ui.cmdline.textContent = `:${cmdBuffer}`;
                        return;
                    }
                    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
                        cmdBuffer += event.key;
                        ui.cmdline.textContent = `:${cmdBuffer}`;
                    }
                    return;
                }

                event.preventDefault();
                if (event.key === 'i' || event.key === 'a') {
                    vimMode = 'insert';
                    if (event.key === 'a') {
                        const end = ui.buffer.value.length;
                        ui.buffer.setSelectionRange(end, end);
                    }
                    updateVimChrome();
                    return;
                }
                if (event.key === ':') {
                    vimMode = 'command';
                    cmdBuffer = '';
                    updateVimChrome();
                }
            });
        }

        ui.buffer.focus();
        return { close: finish, save: doSave };
    }

    function openNano(path, options) {
        const session = options && options.session;
        if (!session) {
            return null;
        }
        const helpers = {
            resolvePath: (cwd, target) => global.CapsuleTerminal.resolvePath(cwd, target, session.state.home),
            rawCommand: `nano ${path || ''}`.trim(),
            formatCommandResult: (state, cmd, lines, opts) => ({
                command: cmd,
                lines,
                error: Boolean(opts && opts.error),
                openEditor: opts && opts.openEditor
            })
        };
        const result = prepareCommand(session.state, 'nano', path ? [path] : [], helpers);
        if (!result.openEditor) {
            return result;
        }
        return mountInTerminal(options.host, session, result.openEditor, options.callbacks || {});
    }

    function openVim(path, options) {
        const session = options && options.session;
        if (!session) {
            return null;
        }
        const helpers = {
            resolvePath: (cwd, target) => global.CapsuleTerminal.resolvePath(cwd, target, session.state.home),
            rawCommand: `vim ${path || ''}`.trim(),
            formatCommandResult: (state, cmd, lines, opts) => ({
                command: cmd,
                lines,
                error: Boolean(opts && opts.error),
                openEditor: opts && opts.openEditor
            })
        };
        const result = prepareCommand(session.state, 'vim', path ? [path] : [], helpers);
        if (!result.openEditor) {
            return result;
        }
        return mountInTerminal(options.host, session, result.openEditor, options.callbacks || {});
    }

    global.CapsuleTerminalEditors = {
        loadFileForEditor,
        saveFileFromEditor,
        prepareCommand,
        mountInTerminal,
        openNano,
        openVim,
        ensureEditorStylesheet: ensureEditorStylesheetFixed
    };
})(typeof window !== 'undefined' ? window : globalThis);
