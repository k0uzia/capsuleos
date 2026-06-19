/**
 * Persistance locale profil dev (account.html) — localStorage.
 */
(function (global) {
    'use strict';

    var STORAGE_KEY = 'capsule_portal_dev_account';
    var INVITE_DAYS = 7;

    function defaultState() {
        return {
            displayName: global.CAPSULE_PORTAL_DEV_USER || 'test',
            email: global.CAPSULE_PORTAL_DEV_USER || 'test',
            password: global.CAPSULE_PORTAL_DEV_PASSWORD || 'test123456789',
            tickets: [],
            ticketCounter: 0,
            classroom: null,
            studentClass: null,
            progress: [],
            skins: [],
            purchases: [],
            gamification: { xp: 120, level: 2, badges: ['first-login'] },
            osUsage: {},
            subscription: {
                currentPeriodEnd: null,
                cancelAtPeriodEnd: false,
            },
            billing: {
                paymentMethod: 'Carte Visa ···· 4242',
                addressLine: '12 rue de la Capsule',
                postalCode: '75001',
                city: 'Paris',
            },
        };
    }

    function defaultPeriodEnd() {
        var d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toISOString();
    }

    function ensureSubscription(state) {
        if (!state.subscription || typeof state.subscription !== 'object') {
            state.subscription = {
                currentPeriodEnd: defaultPeriodEnd(),
                cancelAtPeriodEnd: false,
            };
        }
        if (!state.subscription.currentPeriodEnd) {
            state.subscription.currentPeriodEnd = defaultPeriodEnd();
        }
        if (!state.billing || typeof state.billing !== 'object') {
            state.billing = {
                paymentMethod: 'Carte Visa ···· 4242',
                addressLine: '12 rue de la Capsule',
                postalCode: '75001',
                city: 'Paris',
            };
        }
        return state.subscription;
    }

    function load() {
        try {
            var raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) {
                return defaultState();
            }
            var parsed = JSON.parse(raw);
            var base = defaultState();
            var key;
            for (key in base) {
                if (Object.prototype.hasOwnProperty.call(base, key) && parsed[key] === undefined) {
                    parsed[key] = base[key];
                }
            }
            return migrateTickets(parsed);
        } catch (_) {
            return defaultState();
        }
    }

    function save(state) {
        migrateTickets(state);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }

    function uid() {
        return String(Date.now()) + '-' + String(Math.floor(Math.random() * 10000));
    }

    function token() {
        var hex = '';
        for (var i = 0; i < 32; i += 1) {
            hex += Math.floor(Math.random() * 16).toString(16);
        }
        return hex;
    }

    function inviteExpiry() {
        var d = new Date();
        d.setDate(d.getDate() + INVITE_DAYS);
        return d.toISOString();
    }

    function formatDateFr(iso) {
        if (!iso) {
            return '-';
        }
        var d = new Date(iso);
        if (isNaN(d.getTime())) {
            return iso;
        }
        var months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
    }

    function formatDateTimeFr(iso) {
        if (!iso) {
            return '-';
        }
        var d = new Date(iso);
        if (isNaN(d.getTime())) {
            return iso;
        }
        var months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
        var dateLabel = d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
        var hours = String(d.getHours()).padStart(2, '0');
        var minutes = String(d.getMinutes()).padStart(2, '0');
        return dateLabel + ' à ' + hours + ':' + minutes;
    }

    function migrateTickets(state) {
        if (!Array.isArray(state.tickets)) {
            state.tickets = [];
        }
        if (!state.ticketCounter) {
            state.ticketCounter = 0;
        }
        var maxNumber = state.ticketCounter;
        state.tickets.forEach(function (ticket) {
            if (!ticket || typeof ticket !== 'object') {
                return;
            }
            if (!ticket.number) {
                state.ticketCounter += 1;
                ticket.number = state.ticketCounter;
            }
            if (ticket.number > maxNumber) {
                maxNumber = ticket.number;
            }
            if (!Array.isArray(ticket.messages) && ticket.body) {
                ticket.messages = [{
                    authorRole: 'user',
                    authorName: state.displayName || 'Utilisateur',
                    body: ticket.body,
                    createdAt: ticket.createdAt || new Date().toISOString(),
                }];
            }
        });
        if (maxNumber > state.ticketCounter) {
            state.ticketCounter = maxNumber;
        }
        return state;
    }

    function scanChecklistProgress() {
        var found = [];
        var i;
        var key;
        for (i = 0; i < localStorage.length; i += 1) {
            key = localStorage.key(i);
            if (!key) {
                continue;
            }
            if (key.indexOf('checklist') === -1 && key.indexOf('linux-bases') === -1 && key.indexOf('mnt-') === -1) {
                continue;
            }
            try {
                var raw = localStorage.getItem(key);
                var state = raw ? JSON.parse(raw) : null;
                if (!state || typeof state !== 'object') {
                    continue;
                }
                var done = 0;
                var total = 0;
                Object.keys(state).forEach(function (k) {
                    total += 1;
                    if (state[k]) {
                        done += 1;
                    }
                });
                if (total === 0) {
                    continue;
                }
                found.push({
                    id: key,
                    storageKey: key,
                    title: key.replace(/-checklist.*$/, '').replace(/mnt[-:]/, '') || key,
                    doneCount: done,
                    totalCount: total,
                    updatedAt: new Date().toISOString(),
                    source: 'localStorage',
                });
            } catch (_) { /* ignore */ }
        }
        return found;
    }

    var api = {
        load: load,
        save: save,
        formatDateFr: formatDateFr,
        formatDateTimeFr: formatDateTimeFr,
        updateProfile: function (patch) {
            var s = load();
            if (patch.displayName !== undefined) {
                s.displayName = String(patch.displayName).trim();
            }
            if (patch.email !== undefined) {
                s.email = String(patch.email).trim();
            }
            if (patch.password !== undefined) {
                s.password = String(patch.password);
            }
            save(s);
            return s;
        },
        addTicket: function (type, subject, body) {
            var s = load();
            s.ticketCounter = (s.ticketCounter || 0) + 1;
            var now = new Date().toISOString();
            var authorName = s.displayName || 'Utilisateur';
            var ticket = {
                id: uid(),
                number: s.ticketCounter,
                type: type,
                subject: subject,
                body: body,
                status: 'ouvert',
                createdAt: now,
                messages: [{
                    authorRole: 'user',
                    authorName: authorName,
                    body: body,
                    createdAt: now,
                }],
            };
            s.tickets.unshift(ticket);
            save(s);
            return ticket;
        },
        createClassroom: function (name, maxSlots, allowedOs, allowedModules) {
            var s = load();
            if (s.classroom) {
                return null;
            }
            s.classroom = {
                name: name,
                maxSlots: maxSlots,
                allowedOs: Array.isArray(allowedOs) ? allowedOs : [],
                allowedModules: Array.isArray(allowedModules) ? allowedModules : [],
                inviteToken: token(),
                inviteExpiresAt: inviteExpiry(),
                members: [],
            };
            save(s);
            return s.classroom;
        },
        deleteClassroom: function () {
            var s = load();
            s.classroom = null;
            save(s);
        },
        regenerateInvite: function () {
            var s = load();
            if (!s.classroom) {
                return null;
            }
            s.classroom.inviteToken = token();
            s.classroom.inviteExpiresAt = inviteExpiry();
            save(s);
            return s.classroom.inviteToken;
        },
        removeMember: function (memberId) {
            var s = load();
            if (!s.classroom) {
                return;
            }
            s.classroom.members = s.classroom.members.filter(function (m) {
                return m.id !== memberId;
            });
            save(s);
        },
        addMember: function (name, email) {
            var s = load();
            if (!s.classroom) {
                return false;
            }
            if (s.classroom.members.length >= s.classroom.maxSlots) {
                return false;
            }
            s.classroom.members.push({
                id: uid(),
                displayName: name,
                email: email,
                joinedAt: new Date().toISOString(),
            });
            save(s);
            return true;
        },
        joinClassByToken: function (inviteToken) {
            var s = load();
            if (!s.classroom || s.classroom.inviteToken !== inviteToken) {
                return { ok: false, error: 'Invitation invalide' };
            }
            if (new Date(s.classroom.inviteExpiresAt).getTime() < Date.now()) {
                return { ok: false, error: 'Invitation expirée' };
            }
            s.studentClass = { name: s.classroom.name, joinedAt: new Date().toISOString() };
            save(s);
            return { ok: true, className: s.classroom.name };
        },
        leaveStudentClass: function () {
            var s = load();
            s.studentClass = null;
            save(s);
        },
        updateClassroom: function (patch) {
            var s = load();
            if (!s.classroom) {
                return false;
            }
            if (patch.name !== undefined) {
                s.classroom.name = String(patch.name).trim();
            }
            if (patch.maxSlots !== undefined) {
                s.classroom.maxSlots = Number(patch.maxSlots);
            }
            if (patch.allowedOs !== undefined) {
                s.classroom.allowedOs = Array.isArray(patch.allowedOs) ? patch.allowedOs : [];
            }
            if (patch.allowedModules !== undefined) {
                s.classroom.allowedModules = Array.isArray(patch.allowedModules) ? patch.allowedModules : [];
            }
            save(s);
            return true;
        },
        deleteProgress: function (id) {
            var s = load();
            s.progress = s.progress.filter(function (p) { return p.id !== id; });
            var item = scanChecklistProgress().concat(s.progress).find(function (p) { return p.id === id; });
            if (item && item.source === 'localStorage' && item.storageKey) {
                try {
                    localStorage.removeItem(item.storageKey);
                } catch (_) { /* ignore */ }
            }
            save(s);
        },
        addSampleProgress: function () {
            var s = load();
            s.progress.push({
                id: uid(),
                title: 'Les bases Linux (exemple dev)',
                mountId: 'debutant/linux-bases',
                doneCount: 2,
                totalCount: 8,
                updatedAt: new Date().toISOString(),
                source: 'dev',
            });
            save(s);
        },
        addSampleSkin: function () {
            var s = load();
            s.skins.push({
                id: uid(),
                registryId: 'linux-mint',
                label: 'Linux Mint',
                updatedAt: new Date().toISOString(),
            });
            save(s);
        },
        deleteSkin: function (id) {
            var s = load();
            s.skins = s.skins.filter(function (sk) { return sk.id !== id; });
            save(s);
        },
        allProgress: function () {
            var s = load();
            var scanned = scanChecklistProgress();
            var ids = {};
            scanned.forEach(function (p) { ids[p.id] = true; });
            var merged = scanned.slice();
            s.progress.forEach(function (p) {
                if (!ids[p.id]) {
                    merged.push(p);
                }
            });
            return merged;
        },
        resetAll: function () {
            localStorage.removeItem(STORAGE_KEY);
            return defaultState();
        },
        setCancelRenewal: function (cancel) {
            var s = load();
            var sub = ensureSubscription(s);
            sub.cancelAtPeriodEnd = !!cancel;
            save(s);
            return s;
        },
        subscriptionInfo: function () {
            var s = load();
            return ensureSubscription(s);
        },
    };

    global.CapsulePortalDevStore = api;
}(typeof window !== 'undefined' ? window : globalThis));
