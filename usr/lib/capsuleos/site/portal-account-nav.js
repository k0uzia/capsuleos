/**
 * Navigation par catégories — page compte (PHP et dev statique).
 */
(function (global) {
    'use strict';

    var HASH_MAP = {
        compte: 'overview',
        overview: 'overview',
        progression: 'progress',
        progress: 'progress',
        achats: 'purchases',
        purchases: 'purchases',
        classes: 'classes',
        modules: 'modules',
        parametres: 'settings',
        settings: 'settings',
    };

    var SUB_HASH_MAP = {
        abonnement: 'subscription',
        subscription: 'subscription',
        compte: 'account',
        account: 'account',
        support: 'support',
    };

    var REVERSE_HASH = {
        overview: 'compte',
        progress: 'progression',
        purchases: 'achats',
        classes: 'classes',
        modules: 'modules',
        settings: 'parametres',
    };

    var REVERSE_SUB_HASH = {
        subscription: 'abonnement',
        account: 'compte',
        support: 'support',
    };

    function visibleNavIds() {
        var ids = ['overview', 'settings'];
        document.querySelectorAll('[data-account-nav-item]:not([hidden])').forEach(function (el) {
            var id = el.getAttribute('data-account-nav-item');
            if (id && ids.indexOf(id) === -1) {
                ids.push(id);
            }
        });
        document.querySelectorAll('[data-account-nav]').forEach(function (btn) {
            var id = btn.getAttribute('data-account-nav');
            if (id && id !== 'overview' && id !== 'settings' && ids.indexOf(id) === -1) {
                var item = btn.closest('[data-account-nav-item]');
                if (!item || !item.hidden) {
                    ids.push(id);
                }
            }
        });
        return ids;
    }

    function isTicketSubId(subId) {
        return /^ticket-\d+$/.test(subId || '');
    }

    function parseHash() {
        var raw = window.location.hash.replace(/^#/, '').toLowerCase();
        if (!raw) {
            return { view: 'overview', sub: 'subscription' };
        }
        var parts = raw.split('/');
        var mainKey = parts[0];
        var view = HASH_MAP[mainKey] || HASH_MAP[raw] || 'overview';
        var sub = 'subscription';
        if (view === 'settings' && parts[1]) {
            if (isTicketSubId(parts[1])) {
                sub = parts[1];
            } else {
                sub = SUB_HASH_MAP[parts[1]] || 'subscription';
            }
        }
        return { view: view, sub: sub };
    }

    function buildHash(viewId, subId) {
        if (viewId === 'settings') {
            if (isTicketSubId(subId || '')) {
                return 'parametres/' + subId;
            }
            var subPart = REVERSE_SUB_HASH[subId || 'subscription'] || 'abonnement';
            return 'parametres/' + subPart;
        }
        return REVERSE_HASH[viewId] || 'compte';
    }

    function activateSubView(subId, options) {
        var opts = options || {};
        var allowed = ['subscription', 'account', 'support'];
        if (allowed.indexOf(subId) === -1 && !isTicketSubId(subId)) {
            subId = 'subscription';
        }

        document.querySelectorAll('[data-account-sub-view]').forEach(function (panel) {
            var id = panel.getAttribute('data-account-sub-view');
            panel.hidden = id !== subId;
        });

        document.querySelectorAll('[data-account-sub-nav]').forEach(function (btn) {
            var id = btn.getAttribute('data-account-sub-nav');
            var active = id === subId;
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
            btn.tabIndex = active ? 0 : -1;
            btn.classList.toggle('portal-account-subnav-link--active', active);
        });

        if (opts.updateHash !== false) {
            var nextHash = buildHash('settings', subId);
            if (window.location.hash.replace(/^#/, '') !== nextHash) {
                history.replaceState(null, '', '#' + nextHash);
            }
        }
    }

    function activateView(viewId, options) {
        var opts = options || {};
        var allowed = visibleNavIds();
        if (allowed.indexOf(viewId) === -1) {
            viewId = 'overview';
        }

        document.querySelectorAll('[data-account-view]').forEach(function (panel) {
            var id = panel.getAttribute('data-account-view');
            panel.hidden = id !== viewId;
        });

        document.querySelectorAll('[data-account-nav]').forEach(function (btn) {
            var id = btn.getAttribute('data-account-nav');
            var active = id === viewId;
            btn.setAttribute('aria-selected', active ? 'true' : 'false');
            btn.tabIndex = active ? 0 : -1;
            btn.classList.toggle('portal-account-nav-link--active', active);
        });

        if (viewId === 'settings') {
            activateSubView(opts.sub || parseHash().sub, { updateHash: false });
        }

        if (opts.updateHash !== false) {
            var nextHash = buildHash(viewId, opts.sub);
            if (window.location.hash.replace(/^#/, '') !== nextHash) {
                history.replaceState(null, '', '#' + nextHash);
            }
        }
    }

    function bindNav() {
        var root = document.querySelector('[data-portal-account], [data-portal-account-dev]');
        if (!root || !root.querySelector('[data-account-nav]')) {
            return;
        }

        root.querySelectorAll('[data-account-nav]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var view = btn.getAttribute('data-account-nav') || 'overview';
                var sub = btn.getAttribute('data-account-sub-nav') || null;
                activateView(view, { sub: sub });
            });
        });

        var subnavList = root.querySelector('.portal-account-subnav-list');
        if (subnavList) {
            subnavList.addEventListener('click', function (event) {
                var btn = event.target.closest('[data-account-sub-nav]');
                if (!btn || !subnavList.contains(btn)) {
                    return;
                }
                activateView('settings', { sub: btn.getAttribute('data-account-sub-nav') || 'subscription' });
            });
        }

        window.addEventListener('hashchange', function () {
            var parsed = parseHash();
            activateView(parsed.view, { sub: parsed.sub, updateHash: false });
        });

        var parsed = parseHash();
        activateView(parsed.view, { sub: parsed.sub, updateHash: false });
    }

    global.CapsulePortalAccountNav = {
        activate: function (viewId, options) {
            activateView(viewId, options || {});
        },
        activateSub: activateSubView,
        visibleIds: visibleNavIds,
        refresh: function () {
            var parsed = parseHash();
            activateView(parsed.view, { sub: parsed.sub, updateHash: false });
        },
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindNav);
    } else {
        bindNav();
    }
}(typeof window !== 'undefined' ? window : globalThis));
