/**
 * xed — Éditeur de texte (org.x.editor) sur Linux Mint Cinnamon.
 */
(function initXedAppModule(global) {
    'use strict';

    function getWindowEl(root) {
        var el = root;
        while (el) {
            if (el.getAttribute && el.getAttribute('data-link') === 'text_editor') {
                return el;
            }
            el = el.parentElement;
        }
        return null;
    }

    function initTextEditorAppOnce() {
        var root = global.document.getElementById('xedApp');
        if (!root || root.dataset.xedInit === 'true') {
            return;
        }
        root.dataset.xedInit = 'true';

        var area = global.document.getElementById('xed-area');
        var fileInput = global.document.getElementById('xed-file-input');
        var statusPos = global.document.getElementById('xed-status-pos');
        var statusChars = global.document.getElementById('xed-status-chars');
        var winEl = getWindowEl(root);
        if (!area || !statusPos || !statusChars) {
            return;
        }

        var fileName = '';
        var dirty = false;
        var savedValue = '';

        function setDirty(next) {
            dirty = next === true;
            refreshTitle();
        }

        function refreshTitle() {
            if (!winEl) {
                return;
            }
            var titleEl = winEl.querySelector('#windowTitle');
            if (!titleEl) {
                return;
            }
            var base = fileName || 'Sans titre';
            titleEl.textContent = dirty ? '*' + base : base;
        }

        function updateStatus() {
            var text = area.value || '';
            var len = text.length;
            var start = area.selectionStart;
            if (typeof start !== 'number') {
                start = len;
            }
            var before = text.slice(0, start);
            var lines = before.split('\n');
            var line = lines.length;
            var col = lines[lines.length - 1].length + 1;
            statusPos.textContent = 'Ligne ' + line + ', Col ' + col;
            statusChars.textContent = len + (len > 1 ? ' caractères' : ' caractère');
        }

        function confirmDiscard() {
            if (!dirty) {
                return true;
            }
            return global.confirm('Les modifications non enregistrées seront perdues. Continuer ?');
        }

        function clearDocument() {
            area.value = '';
            fileName = '';
            savedValue = '';
            setDirty(false);
            updateStatus();
        }

        function runEditCommand(cmd) {
            area.focus();
            try {
                global.document.execCommand(cmd, false, null);
            } catch (err) {
                /* ignore */
            }
            setDirty(area.value !== savedValue);
            updateStatus();
        }

        function saveDocument() {
            var name = fileName || 'document.txt';
            var blob = new Blob([area.value], { type: 'text/plain;charset=utf-8' });
            var url = global.URL.createObjectURL(blob);
            var link = global.document.createElement('a');
            link.download = name;
            link.href = url;
            link.click();
            global.setTimeout(function revokeUrl() {
                global.URL.revokeObjectURL(url);
            }, 500);
            savedValue = area.value;
            setDirty(false);
        }

        area.addEventListener('input', function onInput() {
            setDirty(area.value !== savedValue);
            updateStatus();
        });

        area.addEventListener('click', updateStatus);
        area.addEventListener('keyup', updateStatus);
        area.addEventListener('select', updateStatus);

        if (fileInput) {
            fileInput.addEventListener('change', function onFileChosen() {
                var file = fileInput.files && fileInput.files[0];
                fileInput.value = '';
                if (!file) {
                    return;
                }
                var reader = new FileReader();
                reader.onload = function onLoaded() {
                    area.value = typeof reader.result === 'string' ? reader.result : '';
                    fileName = file.name || 'document.txt';
                    savedValue = area.value;
                    setDirty(false);
                    updateStatus();
                };
                reader.readAsText(file);
            });
        }

        root.querySelectorAll('[data-xed-action]').forEach(function bindAction(btn) {
            btn.addEventListener('click', function onAction() {
                var action = btn.getAttribute('data-xed-action');
                if (action === 'new') {
                    if (!confirmDiscard()) {
                        return;
                    }
                    clearDocument();
                    return;
                }
                if (action === 'open') {
                    if (!confirmDiscard()) {
                        return;
                    }
                    if (fileInput) {
                        fileInput.click();
                    }
                    return;
                }
                if (action === 'save') {
                    saveDocument();
                    return;
                }
                if (action === 'undo') {
                    runEditCommand('undo');
                    return;
                }
                if (action === 'redo') {
                    runEditCommand('redo');
                    return;
                }
                if (action === 'cut') {
                    runEditCommand('cut');
                    return;
                }
                if (action === 'copy') {
                    runEditCommand('copy');
                    return;
                }
                if (action === 'paste') {
                    runEditCommand('paste');
                }
            });
        });

        refreshTitle();
        updateStatus();
    }

    global.initTextEditorApp = initTextEditorAppOnce;
}(typeof window !== 'undefined' ? window : this));
