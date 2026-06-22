/**
 * Tickets support : onglets dynamiques et fil de discussion.
 */
(function (global) {
    'use strict';

    function isClosed(status) {
        var s = String(status || '').toLowerCase();
        return s === 'clos' || s === 'ferme' || s === 'fermé' || s === 'closed';
    }

    function statusLabel(status) {
        var labels = {
            ouvert: 'Ouvert',
            en_cours: 'En cours',
            clos: 'Clos',
            closed: 'Clos',
            ferme: 'Clos',
            fermé: 'Clos',
        };
        var key = String(status || '').toLowerCase();
        return labels[key] || String(status || '');
    }

    var TICKET_TYPE_LABELS = {
        support: 'Support',
        demande_createur: 'Demande du rôle Créateur',
        demande_module: 'Demande d\'ajout de module',
    };

    function ticketTypeLabel(type) {
        return TICKET_TYPE_LABELS[type] || String(type || '');
    }

    function closedTicketsSorted(tickets) {
        return (tickets || []).filter(function (t) {
            return t && isClosed(t.status);
        }).sort(function (a, b) {
            var keyA = Number(ticketKey(a));
            var keyB = Number(ticketKey(b));
            if (keyA !== keyB) {
                return keyB - keyA;
            }
            var dateA = String(a.createdAt || a.created_at || '');
            var dateB = String(b.createdAt || b.created_at || '');
            return dateB.localeCompare(dateA);
        });
    }

    function ticketKey(ticket) {
        return ticket.number != null ? ticket.number : ticket.id;
    }

    function subId(ticket) {
        return 'ticket-' + ticketKey(ticket);
    }

    function tabLabel(ticket) {
        return 'Ticket ' + ticketKey(ticket);
    }

    function escapeHtml(text) {
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function formatDateTimeFr(iso, formatDateFr) {
        if (!iso) {
            return '-';
        }
        var d = new Date(iso);
        if (isNaN(d.getTime())) {
            return String(iso);
        }
        var dateLabel = typeof formatDateFr === 'function'
            ? formatDateFr(iso)
            : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        var hours = String(d.getHours()).padStart(2, '0');
        var minutes = String(d.getMinutes()).padStart(2, '0');
        return dateLabel + ' à ' + hours + ':' + minutes;
    }

    function ticketMessages(ticket, displayName) {
        if (Array.isArray(ticket.messages) && ticket.messages.length) {
            return ticket.messages;
        }
        if (!ticket.body) {
            return [];
        }
        return [{
            authorRole: 'user',
            authorName: displayName || 'Utilisateur',
            body: ticket.body,
            createdAt: ticket.createdAt || ticket.created_at || '',
        }];
    }

    function authorBadgesHtml(badges) {
        if (!badges || !badges.length) {
            return '';
        }
        return '<span class="portal-account-ticket-message-badges">'
            + badges.map(function (badge) {
                var mod = badge.className || badge.class || '';
                return '<span class="portal-account-badge portal-account-badge--title portal-account-badge--message '
                    + escapeHtml(mod) + '">' + escapeHtml(badge.label || '') + '</span>';
            }).join('')
            + '</span>';
    }

    function messageHtml(msg, formatDateFr, authorBadges) {
        var role = msg.authorRole === 'admin' ? 'admin' : 'user';
        var badges = role === 'user' ? (msg.authorBadges || authorBadges) : null;
        return '<article class="portal-account-ticket-message portal-account-ticket-message--' + role + '">'
            + '<header class="portal-account-ticket-message-head">'
            + '<span class="portal-account-ticket-message-author-line">'
            + '<span class="portal-account-ticket-message-author">' + escapeHtml(msg.authorName || '') + '</span>'
            + authorBadgesHtml(badges)
            + '</span>'
            + '<time datetime="' + escapeHtml(msg.createdAt || '') + '">'
            + escapeHtml(formatDateTimeFr(msg.createdAt, formatDateFr)) + '</time>'
            + '</header>'
            + '<p class="portal-account-ticket-message-body">' + escapeHtml(msg.body || '') + '</p>'
            + '</article>';
    }

    function subnavList() {
        var scope = document.querySelector('[data-account-subnav-scope="support"]');
        return scope ? scope.querySelector('[data-account-subnav-list]') : null;
    }

    function subviewsRoot() {
        var scope = document.querySelector('[data-account-subnav-scope="support"]');
        return scope ? scope.querySelector('[data-account-subviews]') : null;
    }

    function parseListItemHtml(html) {
        var template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstElementChild;
    }

    function openTicketsForNav(tickets) {
        return (tickets || []).filter(function (t) {
            return t && !isClosed(t.status);
        }).sort(function (a, b) {
            var keyA = Number(ticketKey(a));
            var keyB = Number(ticketKey(b));
            if (keyA !== keyB) {
                return keyA - keyB;
            }
            var dateA = String(a.createdAt || a.created_at || '');
            var dateB = String(b.createdAt || b.created_at || '');
            return dateA.localeCompare(dateB);
        });
    }

    function subnavItemHtml(ticket) {
        var sid = subId(ticket);
        return '<li class="portal-account-subnav-item" role="presentation" data-ticket-subnav-item>'
            + '<button type="button" class="portal-account-subnav-link portal-account-subnav-link--ticket" role="tab"'
            + ' id="portal-account-subnav-' + sid + '" aria-controls="account-subview-' + sid + '"'
            + ' aria-selected="false" data-account-sub-nav="' + sid + '" tabindex="-1">'
            + escapeHtml(tabLabel(ticket)) + '</button></li>';
    }

    function historiqueSubnavHtml() {
        return '<li class="portal-account-subnav-item" role="presentation" data-ticket-historique-tab>'
            + '<button type="button" class="portal-account-subnav-link portal-account-subnav-link--historique" role="tab"'
            + ' id="portal-account-subnav-historique" aria-controls="account-subview-historique"'
            + ' aria-selected="false" data-account-sub-nav="historique" tabindex="-1">Historique</button></li>';
    }

    function historiqueSubviewHtml() {
        return '<div class="portal-account-subview" id="account-subview-historique" data-account-sub-view="historique"'
            + ' data-ticket-historique-subview hidden role="tabpanel" aria-labelledby="portal-account-subnav-historique">'
            + '<section class="portal-account-panel portal-account-historique-panel" aria-labelledby="portal-ticket-historique-title">'
            + '<h2 class="portal-account-panel-title" id="portal-ticket-historique-title" data-ticket-historique-heading>Historique</h2>'
            + '<p class="portal-account-panel-lead" data-ticket-historique-lead">Tickets clos. Ouvrez un fil pour relire les échanges.</p>'
            + '<div class="portal-account-ticket-history" data-ticket-history-panel>'
            + '<div data-ticket-history-list></div>'
            + '<div data-ticket-history-detail hidden></div>'
            + '</div></section></div>';
    }

    function insertHistoriqueTab() {
        var ul = subnavList();
        var container = subviewsRoot();
        if (!ul || !container || ul.querySelector('[data-ticket-historique-tab]')) {
            return;
        }
        var openItems = ul.querySelectorAll('[data-ticket-subnav-item]');
        var anchor = openItems.length
            ? openItems[openItems.length - 1]
            : null;
        if (!anchor) {
            var supportBtn = ul.querySelector('[data-account-sub-nav="support"]');
            anchor = supportBtn ? supportBtn.closest('li') : null;
        }
        var li = parseListItemHtml(historiqueSubnavHtml());
        if (anchor) {
            anchor.insertAdjacentElement('afterend', li);
        } else {
            ul.appendChild(li);
        }
        if (!container.querySelector('[data-ticket-historique-subview]')) {
            container.appendChild(parseListItemHtml(historiqueSubviewHtml()));
        }
    }

    function insertTicketSubnav(ticket) {
        var ul = subnavList();
        if (!ul) {
            return null;
        }
        var li = parseListItemHtml(subnavItemHtml(ticket));
        var openItems = ul.querySelectorAll('[data-ticket-subnav-item]');
        if (openItems.length) {
            openItems[openItems.length - 1].insertAdjacentElement('afterend', li);
            return li;
        }
        var supportBtn = ul.querySelector('[data-account-sub-nav="support"]');
        if (supportBtn) {
            supportBtn.closest('li').insertAdjacentElement('afterend', li);
        } else {
            ul.appendChild(li);
        }
        return li;
    }

    function threadMessagesHtml(ticket, displayName, formatDateFr, authorBadges) {
        return ticketMessages(ticket, displayName).map(function (msg) {
            return messageHtml(msg, formatDateFr, authorBadges);
        }).join('');
    }

    function threadFooterHtml(ticket, options) {
        var opts = options || {};
        var closed = opts.closed || isClosed(ticket.status);
        if (closed) {
            return '<p class="portal-account-ticket-status portal-account-ticket-status--closed">'
                + '<span class="portal-account-badge portal-account-badge--ticket-closed">'
                + escapeHtml(statusLabel(ticket.status)) + '</span></p>';
        }
        var html = '<p class="portal-account-ticket-sla">Le support peut prendre entre 24 et 48 h pour répondre.</p>';
        if (opts.devCloseTicket) {
            html += '<button type="button" class="portal-account-btn portal-account-btn--ghost portal-account-btn--compact"'
                + ' data-dev-close-ticket="' + escapeHtml(String(ticket.id || '')) + '">'
                + 'Simuler clôture (dev)</button>';
        }
        return html;
    }

    function threadPanelHtml(ticket, displayName, formatDateFr, authorBadges, options) {
        var opts = options || {};
        var sid = subId(ticket);
        var closed = opts.closed || isClosed(ticket.status);
        var msgsHtml = threadMessagesHtml(ticket, displayName, formatDateFr, authorBadges);
        var threadClass = 'portal-account-panel portal-account-ticket-thread'
            + (closed ? ' portal-account-ticket-thread--closed' : '');
        return '<div class="portal-account-subview" id="account-subview-' + sid + '" data-account-sub-view="' + sid + '"'
            + ' data-ticket-subview' + (closed ? ' data-ticket-closed' : '') + ' hidden role="tabpanel"'
            + ' aria-labelledby="portal-account-subnav-' + sid + '">'
            + '<section class="' + threadClass + '" aria-labelledby="portal-ticket-title-' + sid + '">'
            + '<h2 class="portal-account-panel-title" id="portal-ticket-title-' + sid + '">'
            + '<span class="portal-account-ticket-subject-label">Sujet :</span> '
            + escapeHtml(ticket.subject || '') + '</h2>'
            + '<div class="portal-account-ticket-messages" role="log" aria-live="polite">' + msgsHtml + '</div>'
            + threadFooterHtml(ticket, opts)
            + '</section></div>';
    }

    function historyListItemHtml(ticket, formatDateFr) {
        return '<li class="portal-account-ticket-item portal-account-ticket-item--history">'
            + '<div class="portal-account-ticket-item-main">'
            + '<p class="portal-account-ticket-subject">' + escapeHtml(ticket.subject || '') + '</p>'
            + '<p class="portal-account-ticket-meta">'
            + '<span>' + escapeHtml(ticketTypeLabel(ticket.type || '')) + '</span> · '
            + '<span>' + escapeHtml(statusLabel(ticket.status)) + '</span> · '
            + '<span>' + escapeHtml(formatDateTimeFr(ticket.createdAt || ticket.created_at, formatDateFr)) + '</span>'
            + '</p></div>'
            + '<button type="button" class="portal-account-btn portal-account-btn--ghost portal-account-btn--compact"'
            + ' data-ticket-history-open="' + escapeHtml(subId(ticket)) + '">Voir les échanges</button>'
            + '</li>';
    }

    function historyListHtml(closedTickets, formatDateFr) {
        if (!closedTickets.length) {
            return '<p class="portal-account-empty">Aucun ticket fermé pour le moment.</p>';
        }
        var html = '<ul class="portal-account-ticket-list portal-account-ticket-list--history">';
        closedTickets.forEach(function (ticket) {
            html += historyListItemHtml(ticket, formatDateFr);
        });
        return html + '</ul>';
    }

    function historyDetailHtml(ticket, displayName, formatDateFr, authorBadges) {
        var sid = subId(ticket);
        var msgsHtml = threadMessagesHtml(ticket, displayName, formatDateFr, authorBadges);
        return '<div class="portal-account-ticket-history-detail" data-ticket-history-detail data-ticket-history-detail-for="' + sid + '">'
            + '<button type="button" class="portal-account-btn portal-account-btn--ghost portal-account-btn--compact portal-account-ticket-history-back"'
            + ' data-ticket-history-back>'
            + '<i class="fa-solid fa-arrow-left portal-account-ticket-history-back-icon" aria-hidden="true"></i>'
            + 'Retour à la liste</button>'
            + '<section class="portal-account-panel portal-account-ticket-thread portal-account-ticket-thread--closed"'
            + ' aria-labelledby="portal-ticket-history-title-' + sid + '">'
            + '<h3 class="portal-account-subtitle" id="portal-ticket-history-title-' + sid + '">'
            + '<span class="portal-account-ticket-subject-label">Sujet :</span> '
            + escapeHtml(ticket.subject || '') + '</h3>'
            + '<p class="portal-account-ticket-meta portal-account-ticket-meta--history">'
            + '<span>' + escapeHtml(ticketTypeLabel(ticket.type || '')) + '</span> · '
            + '<span>' + escapeHtml(statusLabel(ticket.status)) + '</span> · '
            + '<span>' + escapeHtml(formatDateTimeFr(ticket.createdAt || ticket.created_at, formatDateFr)) + '</span>'
            + '</p>'
            + '<div class="portal-account-ticket-messages" role="log">' + msgsHtml + '</div>'
            + threadFooterHtml(ticket, { closed: true })
            + '</section></div>';
    }

    function historiqueSection(panel) {
        return panel ? panel.closest('.portal-account-historique-panel') : null;
    }

    function hideHistoriqueDetail(panel) {
        if (!panel) {
            return;
        }
        var listRoot = panel.querySelector('[data-ticket-history-list]');
        var detailRoot = panel.querySelector('[data-ticket-history-detail]');
        var section = historiqueSection(panel);
        if (!listRoot || !detailRoot) {
            return;
        }
        listRoot.hidden = false;
        detailRoot.hidden = true;
        detailRoot.innerHTML = '';
        if (section) {
            var heading = section.querySelector('[data-ticket-historique-heading]');
            var lead = section.querySelector('[data-ticket-historique-lead]');
            if (heading) {
                heading.hidden = false;
            }
            if (lead) {
                lead.hidden = false;
            }
        }
    }

    function showHistoriqueDetail(panel, ticket, options) {
        var opts = options || {};
        var listRoot = panel.querySelector('[data-ticket-history-list]');
        var detailRoot = panel.querySelector('[data-ticket-history-detail]');
        var section = historiqueSection(panel);
        if (!listRoot || !detailRoot || !ticket) {
            return;
        }
        detailRoot.innerHTML = historyDetailHtml(
            ticket,
            opts.displayName || 'Utilisateur',
            opts.formatDateFr,
            opts.authorBadges || null,
        );
        listRoot.hidden = true;
        detailRoot.hidden = false;
        if (section) {
            var heading = section.querySelector('[data-ticket-historique-heading]');
            var lead = section.querySelector('[data-ticket-historique-lead]');
            if (heading) {
                heading.hidden = true;
            }
            if (lead) {
                lead.hidden = true;
            }
        }
        var backBtn = detailRoot.querySelector('[data-ticket-history-back]');
        if (backBtn) {
            backBtn.addEventListener('click', function () {
                hideHistoriqueDetail(panel);
            });
        }
        if (global.CapsulePortalAccountNav) {
            global.CapsulePortalAccountNav.activate('support', { sub: 'historique' });
        }
    }

    function findTicketBySubId(tickets, targetSubId) {
        return (tickets || []).find(function (ticket) {
            return ticket && subId(ticket) === targetSubId;
        }) || null;
    }

    function bindTicketHistory(panel, tickets, options) {
        if (!panel) {
            return;
        }
        var opts = options || {};
        hideHistoriqueDetail(panel);
        panel.querySelectorAll('[data-ticket-history-open]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var targetSubId = btn.getAttribute('data-ticket-history-open') || '';
                var ticket = findTicketBySubId(tickets, targetSubId);
                if (!ticket) {
                    return;
                }
                showHistoriqueDetail(panel, ticket, opts);
            });
        });
    }

    function renderTicketHistory(panel, tickets, options) {
        if (!panel) {
            return;
        }
        var opts = options || {};
        var listRoot = panel.querySelector('[data-ticket-history-list]');
        if (!listRoot) {
            return;
        }
        var closedTickets = closedTicketsSorted(tickets);
        listRoot.innerHTML = historyListHtml(closedTickets, opts.formatDateFr);
        bindTicketHistory(panel, tickets, opts);
    }

    function insertTicketSubview(container, ticket, displayName, formatDateFr, authorBadges, options) {
        var panel = parseListItemHtml(threadPanelHtml(ticket, displayName, formatDateFr, authorBadges, options));
        var subviews = container.querySelectorAll('[data-ticket-subview]');
        if (subviews.length) {
            subviews[subviews.length - 1].insertAdjacentElement('afterend', panel);
            return;
        }
        container.appendChild(panel);
    }

    function clearDynamicTabs() {
        document.querySelectorAll('[data-ticket-subnav-item]').forEach(function (el) {
            el.remove();
        });
        document.querySelectorAll('[data-ticket-historique-tab]').forEach(function (el) {
            el.remove();
        });
        document.querySelectorAll('[data-ticket-subview]').forEach(function (el) {
            el.remove();
        });
        document.querySelectorAll('[data-ticket-historique-subview]').forEach(function (el) {
            el.remove();
        });
    }

    function syncTicketTabs(state, options) {
        var opts = options || {};
        var tickets = (state && state.tickets) || state || [];
        if (!Array.isArray(tickets) && state && state.tickets) {
            tickets = state.tickets;
        }
        if (!Array.isArray(tickets)) {
            tickets = [];
        }
        var displayName = opts.displayName || 'Utilisateur';
        var formatDateFr = opts.formatDateFr;
        var authorBadges = opts.authorBadges || null;
        var container = subviewsRoot();
        if (!container) {
            return;
        }
        clearDynamicTabs();
        openTicketsForNav(tickets).forEach(function (ticket) {
            insertTicketSubnav(ticket);
            insertTicketSubview(container, ticket, displayName, formatDateFr, authorBadges, {
                devCloseTicket: !!opts.devCloseTicket,
            });
        });
        insertHistoriqueTab();
        var historyPanel = container.querySelector('[data-ticket-history-panel]');
        if (historyPanel) {
            renderTicketHistory(historyPanel, tickets, opts);
        }
    }

    function syncOpenTicketTabs(state, options) {
        syncTicketTabs(state, options);
    }

    function mountTicketTab(ticket, displayName, formatDateFr, authorBadges, options) {
        var container = subviewsRoot();
        if (!container || !ticket) {
            return;
        }
        var sid = subId(ticket);
        if (document.querySelector('[data-account-sub-view="' + sid + '"]')) {
            return;
        }
        insertTicketSubnav(ticket);
        insertTicketSubview(container, ticket, displayName, formatDateFr, authorBadges, options);
    }

    function readAuthorBadgesFromAccountRoot() {
        var root = document.querySelector('[data-portal-account], [data-portal-account-dev]');
        if (!root) {
            return [];
        }
        try {
            var parsed = JSON.parse(root.getAttribute('data-portal-author-badges') || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
            return [];
        }
    }

    var LOCKED_SUBJECT_TYPES = {
        demande_createur: true,
        demande_module: true,
    };

    function syncTicketTypeSubject(form) {
        if (!form) {
            return;
        }
        var typeSelect = form.querySelector('[name="type"]');
        var subjectField = form.querySelector('[name="subject"]');
        if (!typeSelect || !subjectField) {
            return;
        }
        var typeId = typeSelect.value;
        var opt = typeSelect.options[typeSelect.selectedIndex];
        var preset = opt ? opt.getAttribute('data-default-subject') : null;
        var locked = !!LOCKED_SUBJECT_TYPES[typeId];
        if (preset) {
            subjectField.value = preset;
        }
        subjectField.readOnly = locked;
        subjectField.classList.toggle('portal-input--readonly', locked);
        if (locked) {
            subjectField.setAttribute('aria-readonly', 'true');
        } else {
            subjectField.removeAttribute('aria-readonly');
        }
    }

    function bindTicketTypeSubject(form) {
        if (!form) {
            return;
        }
        var typeSelect = form.querySelector('[name="type"]');
        if (!typeSelect || typeSelect.getAttribute('data-ticket-type-bound') === '1') {
            return;
        }
        typeSelect.setAttribute('data-ticket-type-bound', '1');
        typeSelect.addEventListener('change', function () {
            syncTicketTypeSubject(form);
        });
        syncTicketTypeSubject(form);
    }

    function initTicketHistoryPanels() {
        if (document.querySelector('[data-portal-account-dev]')) {
            return;
        }
        var scope = document.querySelector('[data-account-subnav-scope="support"]');
        if (!scope || scope.getAttribute('data-portal-tickets-synced') === '1') {
            return;
        }
        var raw = scope.getAttribute('data-portal-all-tickets') || '[]';
        var tickets;
        try {
            tickets = JSON.parse(raw);
        } catch (_) {
            tickets = [];
        }
        if (!Array.isArray(tickets)) {
            tickets = [];
        }
        var accountRoot = document.querySelector('[data-portal-account]');
        var displayName = accountRoot
            ? (accountRoot.getAttribute('data-portal-display-name') || 'Utilisateur')
            : 'Utilisateur';
        syncTicketTabs(tickets, {
            displayName: displayName,
            authorBadges: readAuthorBadgesFromAccountRoot(),
        });
        scope.setAttribute('data-portal-tickets-synced', '1');
    }

    global.CapsulePortalTickets = {
        isClosed: isClosed,
        statusLabel: statusLabel,
        closedTicketsSorted: closedTicketsSorted,
        subId: subId,
        tabLabel: tabLabel,
        formatDateTimeFr: formatDateTimeFr,
        readAuthorBadges: readAuthorBadgesFromAccountRoot,
        syncOpenTicketTabs: syncOpenTicketTabs,
        syncTicketTabs: syncTicketTabs,
        mountTicketTab: mountTicketTab,
        threadPanelHtml: threadPanelHtml,
        historyListHtml: historyListHtml,
        renderTicketHistory: renderTicketHistory,
        bindTicketHistory: bindTicketHistory,
        showHistoriqueDetail: showHistoriqueDetail,
        hideHistoriqueDetail: hideHistoriqueDetail,
        bindTicketTypeSubject: bindTicketTypeSubject,
        syncTicketTypeSubject: syncTicketTypeSubject,
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initTicketHistoryPanels);
    } else {
        initTicketHistoryPanels();
    }
}(typeof window !== 'undefined' ? window : globalThis));
