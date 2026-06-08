/**
 * Notes — sticky sur Mint.
 */
(function initStickyAppModule(global) {
    'use strict';

    var WINDOW_TITLE = 'Notes';

    var NOTES = {
        '1': { title: 'Liste de courses', body: 'Lait\nPain\nCafé' },
        '2': { title: 'Idées Mint', body: 'Parité VM CapsuleOS\nSmoke par app' }
    };

    function getWindowEl(root) {
        var el = root;
        while (el) {
            if (el.getAttribute && el.getAttribute('data-link') === 'sticky') {
                return el;
            }
            el = el.parentElement;
        }
        return null;
    }

    function syncWindowTitle(winEl) {
        if (!winEl) {
            return;
        }
        var wmTitle = winEl.querySelector('#windowTitle');
        if (wmTitle) {
            wmTitle.textContent = WINDOW_TITLE;
        }
        winEl.setAttribute('data-title', WINDOW_TITLE);
    }

    function selectNote(root, id) {
        var items = root.querySelectorAll('.stk-app__item');
        var editor = root.querySelector('#stk-editor');
        var ii;
        for (ii = 0; ii < items.length; ii += 1) {
            var active = items[ii].getAttribute('data-stk-id') === id;
            items[ii].classList.toggle('is-active', active);
        }
        if (editor && NOTES[id]) {
            editor.value = NOTES[id].body;
        }
    }

    function initStickyAppOnce() {
        var root = global.document.getElementById('stickyApp');
        if (!root || root.dataset.stickyInit === 'true') {
            return;
        }
        root.dataset.stickyInit = 'true';
        syncWindowTitle(getWindowEl(root));

        var list = root.querySelector('#stk-list');
        if (list) {
            list.addEventListener('click', function onListClick(ev) {
                var item = ev.target;
                while (item && item !== list) {
                    if (item.classList && item.classList.contains('stk-app__item')) {
                        selectNote(root, item.getAttribute('data-stk-id'));
                        return;
                    }
                    item = item.parentElement;
                }
            });
        }

        root.addEventListener('click', function onAction(ev) {
            var btn = ev.target;
            if (!btn || !btn.getAttribute) {
                return;
            }
            if (btn.getAttribute('data-stk-action') === 'new') {
                var nextId = String(Object.keys(NOTES).length + 1);
                NOTES[nextId] = { title: 'Nouvelle note', body: '' };
                var li = global.document.createElement('li');
                li.className = 'stk-app__item';
                li.setAttribute('data-stk-id', nextId);
                li.innerHTML = '<span class="stk-app__item-title">Nouvelle note</span>';
                list.appendChild(li);
                selectNote(root, nextId);
            }
        });
    }

    global.initStickyApp = function initStickyApp() {
        initStickyAppOnce();
    };
}(typeof window !== 'undefined' ? window : globalThis));
