/**
 * Complétion Tab du prompt terminal CapsuleOS (commandes + chemins FS virtuel).
 * API : window.CapsuleTerminalCompletion
 */
(function initCapsuleTerminalCompletion(global) {
    'use strict';

    const DOUBLE_TAB_MS = 450;

    function getActiveCommands() {
        if (typeof global.getTerminalActiveCommands === 'function') {
            return Object.keys(global.getTerminalActiveCommands() || {}).sort();
        }
        return Object.keys(global.CAPSULE_TERMINAL_ACTIVE_COMMANDS || {}).sort();
    }

    function escapeForDisplay(text) {
        return String(text || '')
            .replace(/\\/g, '\\\\')
            .replace(/ /g, '\\ ')
            .replace(/(["'$`!&|;<>*?[\](){}])/g, '\\$1');
    }

    function normalizeEntryName(key) {
        const name = String(key || '');
        return name.startsWith('/') ? name.slice(1) : name;
    }

    function isDirectoryEntry(fs, path) {
        const node = fs[path];
        return node !== undefined && node !== null && typeof node === 'object';
    }

    function listDirectoryEntries(fs, dirPath) {
        const node = fs[dirPath];
        if (!node || typeof node !== 'object') {
            return [];
        }
        const seen = new Set();
        const entries = [];
        Object.keys(node).forEach((key) => {
            const name = normalizeEntryName(key);
            if (!name || seen.has(name)) {
                return;
            }
            seen.add(name);
            const childPath = dirPath === '/'
                ? `/${name}`
                : `${dirPath}/${name}`;
            const isDir = isDirectoryEntry(fs, childPath)
                || (Object.prototype.hasOwnProperty.call(node, key)
                    && typeof node[key] === 'object'
                    && node[key] !== null);
            entries.push({ name, isDir });
        });
        return entries.sort((a, b) => a.name.localeCompare(b.name));
    }

    function commonPrefix(strings) {
        if (!strings.length) {
            return '';
        }
        let prefix = strings[0];
        for (let i = 1; i < strings.length; i += 1) {
            const value = strings[i];
            let j = 0;
            while (j < prefix.length && j < value.length && prefix[j] === value[j]) {
                j += 1;
            }
            prefix = prefix.slice(0, j);
            if (!prefix) {
                break;
            }
        }
        return prefix;
    }

    function parseInputLine(line) {
        const raw = String(line || '');
        const leading = raw.length - raw.trimStart().length;
        const trimmed = raw.trimStart();
        const firstSpace = trimmed.search(/\s/);
        if (firstSpace === -1) {
            return {
                phase: 'command',
                commandPrefix: trimmed,
                replaceStart: leading,
                replaceEnd: raw.length
            };
        }
        const command = trimmed.slice(0, firstSpace);
        const afterCommand = trimmed.slice(firstSpace + 1);
        const lastTokenMatch = afterCommand.match(/(?:^|\s)([^\s]*)$/);
        const pathPrefix = lastTokenMatch ? lastTokenMatch[1] : '';
        const pathStartInTrimmed = trimmed.length - pathPrefix.length;
        return {
            phase: 'path',
            command,
            pathPrefix,
            replaceStart: leading + pathStartInTrimmed,
            replaceEnd: raw.length
        };
    }

    function resolvePathBase(session, pathPrefix) {
        const state = session.state;
        const resolvePath = global.CapsuleTerminal && global.CapsuleTerminal.resolvePath
            ? (cwd, target) => global.CapsuleTerminal.resolvePath(cwd, target, state.home)
            : (cwd, target) => target;
        const { cwd, fs, home } = state;
        const slashIndex = pathPrefix.lastIndexOf('/');
        if (slashIndex === -1) {
            return { baseDir: cwd, namePrefix: pathPrefix, dirPrefix: '' };
        }
        const dirPart = pathPrefix.slice(0, slashIndex);
        const namePrefix = pathPrefix.slice(slashIndex + 1);
        const dirTarget = dirPart || '.';
        const baseDir = resolvePath(cwd, dirTarget, home);
        if (!isDirectoryEntry(fs, baseDir)) {
            return null;
        }
        const dirPrefix = dirPart ? `${dirPart}/` : '';
        return { baseDir, namePrefix, dirPrefix };
    }

    function completionSuffix(entry, isDir) {
        return isDir ? `${entry.name}/` : entry.name;
    }

    function matchCommandCompletions(prefix) {
        const needle = String(prefix || '').toLowerCase();
        return getActiveCommands().filter((name) => name.startsWith(needle));
    }

    function matchPathCompletions(session, pathPrefix) {
        const resolved = resolvePathBase(session, pathPrefix);
        if (!resolved) {
            return { matches: [], dirPrefix: '', namePrefix: pathPrefix };
        }
        const { baseDir, namePrefix, dirPrefix } = resolved;
        const { fs } = session.state;
        const needle = namePrefix.toLowerCase();
        const matches = listDirectoryEntries(fs, baseDir)
            .filter((entry) => entry.name.toLowerCase().startsWith(needle))
            .map((entry) => ({
                value: `${dirPrefix}${completionSuffix(entry, entry.isDir)}`,
                display: `${dirPrefix}${completionSuffix(entry, entry.isDir)}`
            }));
        return { matches, dirPrefix, namePrefix };
    }

    function applyCompletion(input, replaceStart, replaceEnd, completed) {
        const raw = String(input.value || '');
        const next = `${raw.slice(0, replaceStart)}${completed}${raw.slice(replaceEnd)}`;
        input.value = next;
        const cursor = replaceStart + completed.length;
        input.setSelectionRange(cursor, cursor);
    }

    function renderMatchListing(output, lines) {
        if (!output || !lines.length) {
            return;
        }
        const row = document.createElement('div');
        row.className = 'capsule-terminal__line capsule-terminal__line--completion';
        const code = document.createElement('code');
        code.textContent = lines.join('  ');
        row.appendChild(code);
        output.appendChild(row);
    }

    function createTabState() {
        return {
            lastAt: 0,
            lastKey: '',
            listedKey: ''
        };
    }

    function handleTabCompletion(input, session, output, tabState) {
        if (!input || input.disabled || document.activeElement !== input) {
            return false;
        }
        const host = input.closest('[data-terminal-app]');
        if (host && host.querySelector('.capsule-terminal-editor')) {
            return false;
        }

        const parsed = parseInputLine(input.value);
        let matches = [];
        let replaceValue = '';
        let listKey = '';

        if (parsed.phase === 'command') {
            const names = matchCommandCompletions(parsed.commandPrefix);
            matches = names.map((name) => ({ value: name, display: name }));
            listKey = `cmd:${parsed.commandPrefix}`;
            if (names.length === 1) {
                replaceValue = names[0];
            } else if (names.length > 1) {
                const shared = commonPrefix(names);
                if (shared.length > parsed.commandPrefix.length) {
                    replaceValue = shared;
                }
            }
        } else {
            const { matches: pathMatches, namePrefix } = matchPathCompletions(session, parsed.pathPrefix);
            matches = pathMatches;
            listKey = `path:${parsed.pathPrefix}`;
            if (pathMatches.length === 1) {
                replaceValue = pathMatches[0].value;
            } else if (pathMatches.length > 1) {
                const values = pathMatches.map((m) => m.value);
                const shared = commonPrefix(values);
                if (shared.length > parsed.pathPrefix.length) {
                    replaceValue = shared;
                }
            }
            if (!pathMatches.length && namePrefix && parsed.pathPrefix.endsWith('/')) {
                return false;
            }
        }

        const now = Date.now();
        const isDoubleTab = tabState.lastKey === listKey
            && (now - tabState.lastAt) <= DOUBLE_TAB_MS
            && matches.length > 1;

        tabState.lastAt = now;
        tabState.lastKey = listKey;

        if (isDoubleTab && tabState.listedKey !== listKey) {
            tabState.listedKey = listKey;
            const displayLine = matches.map((m) => escapeForDisplay(m.display)).join('  ');
            renderMatchListing(output, [displayLine]);
            if (typeof output.scrollTop === 'number') {
                output.scrollTop = output.scrollHeight;
            }
            return true;
        }

        tabState.listedKey = '';

        if (replaceValue && replaceValue !== (parsed.phase === 'command' ? parsed.commandPrefix : parsed.pathPrefix)) {
            applyCompletion(input, parsed.replaceStart, parsed.replaceEnd, replaceValue);
            return true;
        }

        if (matches.length > 1) {
            return true;
        }

        return matches.length > 0;
    }

    function bindTabCompletion(commandInput, session, output) {
        const tabState = createTabState();
        commandInput.addEventListener('keydown', (event) => {
            if (event.key !== 'Tab' || event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
                return;
            }
            const handled = handleTabCompletion(commandInput, session, output, tabState);
            if (handled) {
                event.preventDefault();
            }
        });
        commandInput.addEventListener('input', () => {
            tabState.lastKey = '';
            tabState.listedKey = '';
        });
    }

    global.CapsuleTerminalCompletion = {
        bindTabCompletion,
        handleTabCompletion,
        parseInputLine,
        escapeForDisplay,
        getActiveCommands,
        matchCommandCompletions,
        matchPathCompletions
    };
})(typeof window !== 'undefined' ? window : globalThis);
