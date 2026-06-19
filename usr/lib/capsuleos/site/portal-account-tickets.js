/**
 * Tickets support : onglets dynamiques et fil de discussion.
 */
(function (global) {
    'use strict';

    function isClosed(status) {
        var s = String(status || '').toLowerCase();
        return s === 'clos' || s === 'ferme' || s === 'fermé' || s === 'closed';
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

    function supportNavItem(ul) {
        var supportBtn = ul.querySelector('[data-account-sub-nav="support"]');
        return supportBtn ? supportBtn.closest('li') : null;
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

    function insertTicketSubnav(ul, ticket) {
        var li = parseListItemHtml(subnavItemHtml(ticket));
        var ticketItems = ul.querySelectorAll('[data-ticket-subnav-item]');
        if (ticketItems.length) {
            ticketItems[ticketItems.length - 1].insertAdjacentElement('afterend', li);
            return li;
        }
        var supportLi = supportNavItem(ul);
        if (supportLi) {
            supportLi.insertAdjacentElement('afterend', li);
        } else {
            ul.appendChild(li);
        }
        return li;
    }

    function insertTicketSubview(container, ticket, displayName, formatDateFr, authorBadges) {
        var panel = parseListItemHtml(threadPanelHtml(ticket, displayName, formatDateFr, authorBadges));
        var subviews = container.querySelectorAll('[data-ticket-subview]');
        if (subviews.length) {
            subviews[subviews.length - 1].insertAdjacentElement('afterend', panel);
            return;
        }
        container.appendChild(panel);
    }

    function subnavItemHtml(ticket) {
        var sid = subId(ticket);
        return '<li class="portal-account-subnav-item" role="presentation" data-ticket-subnav-item>'
            + '<button type="button" class="portal-account-subnav-link portal-account-subnav-link--ticket" role="tab"'
            + ' id="portal-account-subnav-' + sid + '" aria-controls="account-subview-' + sid + '"'
            + ' aria-selected="false" data-account-sub-nav="' + sid + '" tabindex="-1">'
            + escapeHtml(tabLabel(ticket)) + '</button></li>';
    }

    function threadPanelHtml(ticket, displayName, formatDateFr, authorBadges) {
        var sid = subId(ticket);
        var messages = ticketMessages(ticket, displayName);
        var msgsHtml = messages.map(function (msg) {
            return messageHtml(msg, formatDateFr, authorBadges);
        }).join('');
        return '<div class="portal-account-subview" id="account-subview-' + sid + '" data-account-sub-view="' + sid + '"'
            + ' data-ticket-subview hidden role="tabpanel" aria-labelledby="portal-account-subnav-' + sid + '">'
            + '<section class="portal-account-panel portal-account-ticket-thread" aria-labelledby="portal-ticket-title-' + sid + '">'
            + '<h2 class="portal-account-panel-title" id="portal-ticket-title-' + sid + '">'
            + '<span class="portal-account-ticket-subject-label">Sujet :</span> '
            + escapeHtml(ticket.subject || '') + '</h2>'
            + '<div class="portal-account-ticket-messages" role="log" aria-live="polite">' + msgsHtml + '</div>'
            + '<p class="portal-account-ticket-sla">Le support peut prendre entre 24 et 48 h pour répondre.</p>'
            + '</section></div>';
    }

    function subnavList() {
        return document.querySelector('.portal-account-subnav-list');
    }

    function subviewsRoot() {
        return document.querySelector('.portal-account-subviews');
    }

    function clearDynamicTabs() {
        document.querySelectorAll('[data-ticket-subnav-item]').forEach(function (el) {
            el.remove();
        });
        document.querySelectorAll('[data-ticket-subview]').forEach(function (el) {
            el.remove();
        });
    }

    function syncOpenTicketTabs(state, options) {
        var opts = options || {};
        var tickets = (state && state.tickets) || [];
        var displayName = opts.displayName || 'Utilisateur';
        var formatDateFr = opts.formatDateFr;
        var authorBadges = opts.authorBadges || null;
        var ul = subnavList();
        var container = subviewsRoot();
        if (!ul || !container) {
            return;
        }
        clearDynamicTabs();
        openTicketsForNav(tickets).forEach(function (ticket) {
            insertTicketSubnav(ul, ticket);
            insertTicketSubview(container, ticket, displayName, formatDateFr, authorBadges);
        });
    }

    function mountTicketTab(ticket, displayName, formatDateFr, authorBadges) {
        var ul = subnavList();
        var container = subviewsRoot();
        if (!ul || !container || !ticket) {
            return;
        }
        var sid = subId(ticket);
        if (document.querySelector('[data-account-sub-view="' + sid + '"]')) {
            return;
        }
        insertTicketSubnav(ul, ticket);
        insertTicketSubview(container, ticket, displayName, formatDateFr, authorBadges);
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

    global.CapsulePortalTickets = {
        isClosed: isClosed,
        subId: subId,
        tabLabel: tabLabel,
        formatDateTimeFr: formatDateTimeFr,
        readAuthorBadges: readAuthorBadgesFromAccountRoot,
        syncOpenTicketTabs: syncOpenTicketTabs,
        mountTicketTab: mountTicketTab,
        threadPanelHtml: threadPanelHtml,
        bindTicketTypeSubject: bindTicketTypeSubject,
        syncTicketTypeSubject: syncTicketTypeSubject,
    };
}(typeof window !== 'undefined' ? window : globalThis));
