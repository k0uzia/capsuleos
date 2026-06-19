/**
 * Profil statique dev : grades, persistance locale, formulaires interactifs.
 */
(function () {
    'use strict';

    var GRADE_KEY = 'capsule_portal_dev_grade';
    var store = window.CapsulePortalDevStore;
    if (!store) {
        return;
    }

    var GRADE_LABELS = {
        utilisateur: 'Utilisateur gratuit',
        abonne: 'Abonné Abonné',
        professeur: 'Professeur',
        createur: 'Créateur',
        eleve: 'Élève (classe active)',
    };

    var TICKET_TYPES = [
        { id: 'support', label: 'Support' },
        { id: 'demande_createur', label: 'Demande du rôle Créateur', defaultSubject: 'Demande du rôle Créateur' },
        { id: 'demande_module', label: 'Demande d\'ajout de module', defaultSubject: 'Demande d\'ajout de module' },
    ];

    function getGrade() {
        var g = sessionStorage.getItem(GRADE_KEY);
        if (g === 'eleve_sticky') {
            g = 'utilisateur';
            sessionStorage.setItem(GRADE_KEY, g);
        }
        if (!g || !GRADE_LABELS[g]) {
            return 'utilisateur';
        }
        return g;
    }

    function setGrade(grade) {
        sessionStorage.setItem(GRADE_KEY, grade);
        applyGrade(grade);
        renderAll();
    }

    function sectionsForGrade(grade) {
        var base = ['subscription'];
        if (grade === 'utilisateur') {
            return ['usage'].concat(base);
        }
        if (grade === 'abonne') {
            return ['subscription', 'gamification', 'progress', 'skins', 'purchases'];
        }
        if (grade === 'professeur') {
            return ['subscription', 'gamification', 'progress', 'skins', 'purchases', 'teacher'];
        }
        if (grade === 'createur') {
            return ['subscription', 'gamification', 'progress', 'skins', 'purchases', 'creator'];
        }
        if (grade === 'eleve') {
            return ['usage', 'subscription', 'gamification', 'progress', 'student'];
        }
        return ['usage'].concat(base);
    }

    function badgeForGrade(grade) {
        if (grade === 'abonne' || grade === 'professeur' || grade === 'createur') {
            return { className: 'portal-account-badge--plus', label: 'Abonné' };
        }
        return { className: 'portal-account-badge--free', label: 'Gratuit' };
    }

    function extraBadges(grade) {
        var out = [];
        if (grade === 'professeur') {
            out.push({ className: 'portal-account-badge--professeur', label: 'Professeur' });
        }
        if (grade === 'createur') {
            out.push({ className: 'portal-account-badge--createur', label: 'Créateur' });
        }
        if (grade === 'eleve') {
            out.push({ className: 'portal-account-badge--student', label: 'Élève' });
        }
        return out;
    }

    function accountBadgesForGrade(grade) {
        return [badgeForGrade(grade)].concat(extraBadges(grade));
    }

    function navAccessForGrade(grade) {
        return {
            progress: grade !== 'utilisateur',
            purchases: grade === 'abonne' || grade === 'professeur' || grade === 'createur',
            classes: grade === 'professeur',
            modules: grade === 'createur',
        };
    }

    function applyGrade(grade) {
        var sections = sectionsForGrade(grade);
        document.querySelectorAll('[data-dev-section]').forEach(function (el) {
            var id = el.getAttribute('data-dev-section') || '';
            el.hidden = sections.indexOf(id) === -1;
        });

        var planBadge = badgeForGrade(grade);
        document.querySelectorAll('[data-portal-title-plan-badge]').forEach(function (el) {
            el.textContent = planBadge.label;
            el.className = 'portal-account-badge portal-account-badge--title ' + planBadge.className;
        });

        var gradeBadgesEl = document.querySelector('[data-portal-grade-badges]');
        if (gradeBadgesEl) {
            gradeBadgesEl.innerHTML = '';
            extraBadges(grade).forEach(function (b) {
                var span = document.createElement('span');
                span.className = 'portal-account-badge portal-account-badge--title ' + b.className;
                span.textContent = b.label;
                gradeBadgesEl.appendChild(span);
            });
        }

        var isPlus = grade === 'abonne' || grade === 'professeur' || grade === 'createur';
        document.querySelectorAll('[data-dev-sub-overview-free]').forEach(function (el) {
            el.hidden = isPlus;
        });
        document.querySelectorAll('[data-dev-sub-overview-plus]').forEach(function (el) {
            el.hidden = !isPlus;
        });
        document.querySelectorAll('[data-dev-sub-settings-free]').forEach(function (el) {
            el.hidden = isPlus;
        });
        document.querySelectorAll('[data-dev-sub-settings-plus]').forEach(function (el) {
            el.hidden = !isPlus;
        });
        var sectionTitle = document.querySelector('[data-dev-sub-section-title]');
        if (sectionTitle) {
            sectionTitle.textContent = isPlus ? 'Votre Forfait' : 'Abonnement';
        }
        var manageLink = document.querySelector('[data-dev-sub-manage-link]');
        if (manageLink) {
            manageLink.hidden = !isPlus;
        }
        var select = document.getElementById('portal-dev-grade-select');
        if (select) {
            select.value = grade;
        }

        var navAccess = navAccessForGrade(grade);
        Object.keys(navAccess).forEach(function (key) {
            document.querySelectorAll('[data-account-nav-item="' + key + '"]').forEach(function (el) {
                el.hidden = !navAccess[key];
            });
        });
        if (window.CapsulePortalAccountNav) {
            window.CapsulePortalAccountNav.refresh();
        }
    }

    function syncHeader(state) {
        document.querySelectorAll('[data-portal-account-name]').forEach(function (el) {
            el.textContent = state.displayName || state.email;
        });
        document.querySelectorAll('[data-portal-account-email]').forEach(function (el) {
            el.textContent = state.email;
        });
        document.querySelectorAll('[data-portal-auth-username], .header-user-menu-name').forEach(function (el) {
            el.textContent = state.displayName || state.email;
        });
    }

    function renderGamification(state) {
        var xp = state.gamification.xp || 0;
        var level = Math.max(1, Math.floor(xp / 100) + 1);
        var inLevel = xp % 100;
        var percent = inLevel;
        var levelEl = document.querySelector('[data-dev-xp-level]');
        var metaEl = document.querySelector('[data-dev-xp-meta]');
        var hexProgress = document.querySelector('[data-dev-xp-hex-progress]');
        var hexWrap = document.querySelector('[data-dev-xp-progress]');
        if (levelEl) {
            levelEl.textContent = String(level);
        }
        if (metaEl) {
            metaEl.textContent = inLevel + ' / 100 XP pour le niveau suivant';
        }
        if (hexProgress) {
            hexProgress.setAttribute('stroke-dashoffset', String(100 - percent));
        }
        if (hexWrap) {
            hexWrap.setAttribute('aria-valuenow', String(percent));
            hexWrap.setAttribute('aria-label', 'Progression vers le niveau ' + String(level + 1));
        }
        var badgeCount = document.querySelector('[data-dev-badge-count]');
        if (badgeCount) {
            var earned = (state.gamification.badges || []).length;
            badgeCount.textContent = earned + '/30';
        }
        renderBadges(state);
    }

    var DEV_BADGE_CATALOG = [
        { id: 'first-login', label: 'Première connexion', description: 'Vous avez créé votre compte CapsuleOS.' },
        { id: 'first-os', label: 'Premier bureau', description: 'Vous avez exploré un système simulé.' },
        { id: 'linux-bases-start', label: 'Début Linux', description: 'Première quête du parcours Linux bases.' },
        { id: 'class-join', label: 'En classe', description: 'Vous avez rejoint une classe.' },
        { id: 'level-5', label: 'Niveau 5', description: 'Atteindre le niveau 5 de compte.' },
        { id: 'capsule-plus', label: 'Abonné', description: 'Abonnement Abonné actif.' },
    ];

    function renderBadges(state) {
        var root = document.querySelector('[data-dev-badges-root]');
        if (!root) {
            return;
        }
        var earnedIds = state.gamification.badges || [];
        var html = '<ul class="portal-account-badge-grid">';
        DEV_BADGE_CATALOG.forEach(function (badge) {
            var earned = earnedIds.indexOf(badge.id) !== -1;
            html += '<li class="portal-account-badge-item' + (earned ? ' portal-account-badge-item--earned' : ' portal-account-badge-item--locked') + '">'
                + '<span class="portal-account-badge-icon" aria-hidden="true">' + (earned ? '★' : '○') + '</span>'
                + '<span class="portal-account-badge-label">' + escapeHtml(badge.label) + '</span>'
                + '<span class="portal-account-badge-desc">' + escapeHtml(badge.description) + '</span></li>';
        });
        html += '</ul>';
        root.innerHTML = html;
    }

    function renderStudent(state, grade) {
        var root = document.querySelector('[data-dev-student-root]');
        if (!root) {
            return;
        }
        if (grade !== 'eleve') {
            root.innerHTML = '';
            return;
        }
        var name = state.studentClass ? state.studentClass.name : 'Classe démo (simulation dev)';
        root.innerHTML = '<p class="portal-account-student-status"><span class="portal-account-badge portal-account-badge--student">Élève</span> Classe : <strong>'
            + escapeHtml(name) + '</strong></p>'
            + '<p class="portal-account-panel-lead">Classe active : utilisation OS illimitée et progression débloquée.</p>'
            + '<button type="button" class="portal-account-btn portal-account-btn--ghost portal-account-btn--compact" data-dev-leave-class">Quitter la classe (simulation)</button>';
        var btn = root.querySelector('[data-dev-leave-class]');
        if (btn) {
            btn.addEventListener('click', function () {
                store.leaveStudentClass();
                setGrade('utilisateur');
            });
        }
    }

    function renderProgress() {
        var root = document.querySelector('[data-dev-progress-root]');
        if (!root) {
            return;
        }
        var items = store.allProgress();
        if (items.length === 0) {
            root.innerHTML = '<p class="portal-account-empty">Aucune progression enregistrée. Lancez un parcours avec <code>?mnt=</code> ou ajoutez un exemple.</p>'
                + '<button type="button" class="portal-account-btn portal-account-btn--ghost portal-account-btn--compact" data-dev-add-progress">Ajouter un exemple</button>';
        } else {
            var html = '<ul class="portal-account-progress-list">';
            items.forEach(function (item) {
                var pct = item.totalCount > 0 ? Math.round((item.doneCount / item.totalCount) * 100) : 0;
                html += '<li class="portal-account-progress-item"><div class="portal-account-progress-main">'
                    + '<p class="portal-account-progress-name">' + escapeHtml(item.title) + '</p>'
                    + '<p class="portal-account-progress-meta">' + item.doneCount + ' / ' + item.totalCount + ' missions · Màj. '
                    + store.formatDateFr(item.updatedAt) + '</p>'
                    + '<div class="portal-account-progress-bar" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100">'
                    + '<span class="portal-account-progress-bar-fill" style="width:' + pct + '%"></span></div></div>'
                    + '<button type="button" class="portal-account-btn portal-account-btn--ghost portal-account-btn--compact" data-dev-del-progress="'
                    + escapeHtml(item.id) + '">Supprimer</button></li>';
            });
            html += '</ul><button type="button" class="portal-account-btn portal-account-btn--ghost portal-account-btn--compact" data-dev-add-progress">Ajouter un exemple</button>';
            root.innerHTML = html;
        }
        root.querySelectorAll('[data-dev-del-progress]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                store.deleteProgress(btn.getAttribute('data-dev-del-progress'));
                renderProgress();
            });
        });
        var addBtn = root.querySelector('[data-dev-add-progress]');
        if (addBtn) {
            addBtn.addEventListener('click', function () {
                store.addSampleProgress();
                renderProgress();
            });
        }
    }

    function renderSkins(state) {
        var root = document.querySelector('[data-dev-skins-root]');
        if (!root) {
            return;
        }
        if (!state.skins.length) {
            root.innerHTML = '<p class="portal-account-empty">Aucune sauvegarde de skin.</p>'
                + '<button type="button" class="portal-account-btn portal-account-btn--ghost portal-account-btn--compact" data-dev-add-skin">Ajouter un exemple</button>';
        } else {
            var html = '<ul class="portal-account-skin-list">';
            state.skins.forEach(function (sk) {
                html += '<li class="portal-account-skin-item"><div><p class="portal-account-skin-name">'
                    + escapeHtml(sk.label) + '</p><p class="portal-account-skin-meta">Màj. '
                    + store.formatDateFr(sk.updatedAt) + '</p></div>'
                    + '<button type="button" class="portal-account-btn portal-account-btn--ghost portal-account-btn--compact" data-dev-del-skin="'
                    + escapeHtml(sk.id) + '">Supprimer</button></li>';
            });
            html += '</ul>';
            root.innerHTML = html;
            root.querySelectorAll('[data-dev-del-skin]').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    store.deleteSkin(btn.getAttribute('data-dev-del-skin'));
                    renderSkins(store.load());
                });
            });
            return;
        }
        var addSkin = root.querySelector('[data-dev-add-skin]');
        if (addSkin) {
            addSkin.addEventListener('click', function () {
                store.addSampleSkin();
                renderSkins(store.load());
            });
        }
    }

    function renderTickets(state) {
        var list = document.querySelector('[data-dev-tickets-list]');
        if (!list) {
            return;
        }
        var ticketsApi = window.CapsulePortalTickets;
        var closedTickets = (state.tickets || []).filter(function (t) {
            if (ticketsApi) {
                return ticketsApi.isClosed(t.status);
            }
            var status = String(t.status || '').toLowerCase();
            return status === 'clos' || status === 'fermé' || status === 'ferme' || status === 'closed';
        });
        if (!closedTickets.length) {
            list.innerHTML = '<p class="portal-account-empty">Aucun ticket fermé pour le moment.</p>';
            return;
        }
        var html = '<ul class="portal-account-ticket-list">';
        closedTickets.forEach(function (t) {
            html += '<li class="portal-account-ticket-item"><p class="portal-account-ticket-subject">'
                + escapeHtml(t.subject) + '</p><p class="portal-account-ticket-meta"><span>'
                + escapeHtml(t.type) + '</span> · <span>' + escapeHtml(t.status)
                + '</span> · <span>' + store.formatDateFr(t.createdAt) + '</span></p></li>';
        });
        html += '</ul>';
        list.innerHTML = html;
    }

    function syncTicketTabs(state) {
        if (!window.CapsulePortalTickets) {
            return;
        }
        window.CapsulePortalTickets.syncOpenTicketTabs(state, {
            displayName: state.displayName,
            formatDateFr: store.formatDateFr,
            authorBadges: accountBadgesForGrade(getGrade()),
        });
    }

    function bindNumericInputs(root) {
        var scope = root || document;
        scope.querySelectorAll('[data-numeric-input]').forEach(function (input) {
            if (input.getAttribute('data-numeric-bound') === '1') {
                return;
            }
            input.setAttribute('data-numeric-bound', '1');
            input.addEventListener('keydown', function (event) {
                if (['e', 'E', '+', '-', '.', ',', ' '].indexOf(event.key) !== -1) {
                    event.preventDefault();
                }
            });
            input.addEventListener('input', function () {
                var cleaned = input.value.replace(/\D/g, '');
                if (cleaned !== input.value) {
                    input.value = cleaned;
                }
                var max = Number(input.getAttribute('data-numeric-max') || 999);
                if (cleaned !== '' && Number(cleaned) > max) {
                    input.value = String(max);
                }
            });
            input.addEventListener('blur', function () {
                var min = Number(input.getAttribute('data-numeric-min') || 0);
                var max = Number(input.getAttribute('data-numeric-max') || 999);
                var n = parseInt(input.value, 10);
                if (isNaN(n)) {
                    input.value = '';
                    return;
                }
                if (n < min) {
                    input.value = String(min);
                }
                if (n > max) {
                    input.value = String(max);
                }
            });
        });
    }

    function updateClassNavSlots(state) {
        var el = document.querySelector('[data-portal-nav-class-slots]');
        if (!el) {
            return;
        }
        var used = state.classroom ? 1 : 0;
        el.textContent = used + '/1';
    }

    var INVITE_REGEN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">'
        + '<path d="M1 4v6h6" stroke-linecap="round" stroke-linejoin="round"/>'
        + '<path d="M23 20v-6h-6" stroke-linecap="round" stroke-linejoin="round"/>'
        + '<path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4-4.64 4.36A9 9 0 0 1 3.51 15" stroke-linecap="round" stroke-linejoin="round"/></svg>';

    var DEV_CLASSROOM_OS = [
        { id: 'linux-mint', displayName: 'Linux Mint' },
        { id: 'linux-rocky-gnome', displayName: 'Rocky Linux (GNOME)' },
    ];

    var DEV_CLASSROOM_MODULES = [
        { mountId: 'debutant/linux-bases', title: 'Les bases Linux', access: 'subscriber', accessLabel: 'Abonné' },
        { mountId: 'debutant/decouverte', title: 'Découverte du terminal', access: 'free', accessLabel: 'Gratuit' },
    ];

    function isPaidDevModule(mod) {
        return mod.access === 'subscriber' || mod.access === 'class';
    }

    function classroomAccessFieldsetsHtml(allowedOs, allowedModules, mode) {
        var isEdit = mode === 'edit';
        var osLegendSuffix = isEdit ? '' : ' (vide = tous)';
        var html = '<fieldset class="portal-account-fieldset"><legend class="portal-label">OS autorisés' + osLegendSuffix + '</legend>'
            + '<p class="portal-account-fieldset-hint">Les élèves pourront lancer uniquement les systèmes cochés.</p>'
            + '<div class="portal-account-check-grid">';
        DEV_CLASSROOM_OS.forEach(function (os) {
            var checked = isEdit && ((allowedOs.length && allowedOs.indexOf(os.id) !== -1) || !allowedOs.length);
            html += '<label class="portal-account-check"><input type="checkbox" name="allowedOs" value="' + escapeHtml(os.id) + '"'
                + (checked ? ' checked' : '') + '> ' + escapeHtml(os.displayName) + '</label>';
        });
        html += '</div></fieldset>';

        function moduleChecks(modules, legend, hint) {
            if (!modules.length) {
                return '';
            }
            var out = '<fieldset class="portal-account-fieldset"><legend class="portal-label">' + legend + osLegendSuffix + '</legend>'
                + '<p class="portal-account-fieldset-hint">' + hint + '</p><div class="portal-account-check-grid">';
            modules.forEach(function (mod) {
                var checked = isEdit && ((allowedModules.length && allowedModules.indexOf(mod.mountId) !== -1) || !allowedModules.length);
                out += '<label class="portal-account-check portal-account-check--module"><input type="checkbox" name="allowedModules" value="'
                    + escapeHtml(mod.mountId) + '"' + (checked ? ' checked' : '') + '>'
                    + '<span class="portal-account-check-label">' + escapeHtml(mod.title) + '</span>'
                    + '<span class="portal-account-module-access portal-account-module-access--' + escapeHtml(mod.access) + '">'
                    + escapeHtml(mod.accessLabel) + '</span></label>';
            });
            return out + '</div></fieldset>';
        }

        var freeModules = DEV_CLASSROOM_MODULES.filter(function (mod) { return !isPaidDevModule(mod); });
        var paidModules = DEV_CLASSROOM_MODULES.filter(function (mod) { return isPaidDevModule(mod); });
        html += moduleChecks(freeModules, 'Modules gratuits', 'Parcours accessibles sans achat individuel.');
        html += moduleChecks(paidModules, 'Modules payants', 'Parcours réservés aux abonnés, débloqués pour la classe via cette sélection.');
        return html;
    }

    function collectClassroomAccess(form) {
        var allowedOs = [];
        var allowedModules = [];
        form.querySelectorAll('[name="allowedOs"]:checked').forEach(function (el) {
            allowedOs.push(el.value);
        });
        form.querySelectorAll('[name="allowedModules"]:checked').forEach(function (el) {
            allowedModules.push(el.value);
        });
        return { allowedOs: allowedOs, allowedModules: allowedModules };
    }

    function renderDevClassroomCreateAccess() {
        var host = document.querySelector('[data-dev-classroom-access-fieldsets]');
        if (!host) {
            return;
        }
        host.innerHTML = classroomAccessFieldsetsHtml([], [], 'create');
    }

    function copyInviteUrlDev(linkEl, event) {
        if (window.CapsulePortalClassroomLive && window.CapsulePortalClassroomLive.copyInviteFromLink) {
            window.CapsulePortalClassroomLive.copyInviteFromLink(linkEl, event);
        }
    }

    function bindClassroomDetailEvents(detailRoot, state) {
        if (!detailRoot || !state.classroom) {
            return;
        }
        var copyBtn = detailRoot.querySelector('[data-dev-invite-copy]');
        if (copyBtn) {
            copyBtn.addEventListener('click', function () {
                copyInviteUrlDev(detailRoot.querySelector('[data-dev-invite-url]'));
            });
        }
        var regenBtn = detailRoot.querySelector('[data-dev-invite-regen]');
        if (regenBtn) {
            regenBtn.addEventListener('click', function () {
                if (window.CapsulePortalClassroomLive) {
                    window.CapsulePortalClassroomLive.spinIcon(regenBtn);
                }
                store.regenerateInvite();
                var classroom = store.load().classroom;
                if (!classroom) {
                    return;
                }
                var inviteUrl = window.location.origin + window.location.pathname.replace(/account\.html.*/, 'account.html') + '?join=' + classroom.inviteToken;
                if (window.location.protocol === 'file:') {
                    inviteUrl = './account.html?join=' + classroom.inviteToken;
                }
                var inviteCopyTitle = 'Cliquer pour copier : ' + inviteUrl;
                var link = detailRoot.querySelector('[data-dev-invite-copy-link]');
                if (link) {
                    link.setAttribute('data-dev-invite-url', inviteUrl);
                    link.textContent = inviteUrl;
                    link.title = inviteCopyTitle;
                }
                var expires = detailRoot.querySelector('[data-dev-invite-expires]');
                if (expires) {
                    expires.textContent = 'Expire le ' + store.formatDateFr(classroom.inviteExpiresAt);
                }
            });
        }
        var delBtn = detailRoot.querySelector('[data-dev-del-class]');
        if (delBtn) {
            delBtn.addEventListener('click', function () {
                if (window.confirm('Supprimer la classe ?')) {
                    if (window.CapsulePortalAccountModals) {
                        window.CapsulePortalAccountModals.close('classroom-detail');
                    }
                    store.deleteClassroom();
                    renderTeacher(store.load());
                }
            });
        }
        var updateForm = detailRoot.querySelector('[data-dev-classroom-update]');
        if (updateForm) {
            bindNumericInputs(updateForm);
            updateForm.addEventListener('submit', function (event) {
                event.preventDefault();
                var fd = new FormData(updateForm);
                var access = collectClassroomAccess(updateForm);
                var slots = parseInt(String(fd.get('maxSlots') || ''), 10);
                if (!slots || slots < 2 || slots > 32) {
                    window.alert('Nombre de places : entre 2 et 32.');
                    return;
                }
                store.updateClassroom({
                    name: String(fd.get('name') || '').trim(),
                    maxSlots: slots,
                    allowedOs: access.allowedOs,
                    allowedModules: access.allowedModules,
                });
                renderTeacher(store.load());
                window.alert('Classe mise à jour.');
            });
        }
    }

    function renderClassroomDetail(state) {
        var detailRoot = document.querySelector('[data-dev-classroom-detail-root]');
        var modalTitle = document.querySelector('[data-dev-classroom-modal-title]');
        if (!detailRoot) {
            return;
        }
        if (!state.classroom) {
            detailRoot.innerHTML = '';
            if (modalTitle) {
                modalTitle.textContent = 'Classe';
            }
            return;
        }
        var classroom = state.classroom;
        if (modalTitle) {
            modalTitle.textContent = classroom.name;
        }
        var inviteUrl = window.location.origin + window.location.pathname.replace(/account\.html.*/, 'account.html') + '?join=' + classroom.inviteToken;
        if (window.location.protocol === 'file:') {
            inviteUrl = './account.html?join=' + classroom.inviteToken;
        }
        var inviteCopyTitle = 'Cliquer pour copier : ' + inviteUrl;
        var detailHtml = '<div class="portal-account-class-detail">'
            + '<div class="portal-account-invite"><label class="portal-label">Lien d\'invitation</label>'
            + '<div class="portal-account-invite-row"><button type="button" class="portal-account-invite-link" data-dev-invite-url="'
            + escapeHtml(inviteUrl) + '" data-dev-invite-copy-link title="' + escapeHtml(inviteCopyTitle) + '">'
            + escapeHtml(inviteUrl) + '</button>'
            + '<button type="button" class="portal-account-btn portal-account-btn--ghost portal-account-btn--compact" data-dev-invite-copy>Copier</button></div>'
            + '<div class="portal-account-invite-expiry"><span class="portal-account-invite-expiry-date" data-dev-invite-expires>Expire le '
            + store.formatDateFr(classroom.inviteExpiresAt) + '</span>'
            + '<button type="button" class="portal-account-invite-regen" data-dev-invite-regen title="Régénérer le lien" aria-label="Régénérer le lien">'
            + INVITE_REGEN_ICON + '</button></div></div>'
            + '<div class="portal-account-members-section"><div class="portal-account-members-head">'
            + '<h3 class="portal-account-subtitle">Élèves inscrits</h3>'
            + '<button type="button" class="portal-account-members-refresh" data-classroom-members-refresh title="Actualiser la liste" aria-label="Actualiser la liste">'
            + INVITE_REGEN_ICON + '</button></div><div data-classroom-members-root></div></div>';
        var allowedOs = Array.isArray(classroom.allowedOs) ? classroom.allowedOs : [];
        var allowedModules = Array.isArray(classroom.allowedModules) ? classroom.allowedModules : [];
        detailHtml += '<details class="portal-account-details"><summary>Configurer la classe</summary>'
            + '<form class="portal-form portal-account-teacher-form" data-dev-classroom-update>'
            + '<label class="portal-field"><span class="portal-label">Nom</span>'
            + '<input class="portal-input" type="text" name="name" required value="' + escapeHtml(classroom.name) + '"></label>'
            + '<label class="portal-field"><span class="portal-label">Places</span>'
            + '<input class="portal-input" type="text" name="maxSlots" inputmode="numeric" pattern="[0-9]*" data-numeric-input data-numeric-min="2" data-numeric-max="32" required value="'
            + escapeHtml(String(classroom.maxSlots)) + '"></label>'
            + classroomAccessFieldsetsHtml(allowedOs, allowedModules, 'edit')
            + '<button type="submit" class="portal-submit">Enregistrer</button></form></details>';
        detailHtml += '<div class="portal-account-class-detail-danger"><button type="button" class="portal-account-btn portal-account-btn--ghost portal-account-btn--danger" data-dev-del-class">Supprimer la classe</button></div></div>';
        detailRoot.innerHTML = detailHtml;
        bindClassroomDetailEvents(detailRoot, state);
        if (window.CapsulePortalClassroomLive) {
            window.CapsulePortalClassroomLive.syncMembers();
        }
    }

    function renderTeacher(state) {
        var root = document.querySelector('[data-dev-teacher-root]');
        if (!root) {
            return;
        }

        updateClassNavSlots(state);

        var gridHtml = '<div class="portal-account-class-grid">';
        if (!state.classroom) {
            gridHtml += '<button type="button" class="portal-account-class-card portal-account-class-card--add" data-portal-account-modal-open="classroom-create" aria-label="Créer une classe">'
                + '<span class="portal-account-class-card-plus" aria-hidden="true">'
                + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14" stroke-linecap="round"/></svg>'
                + '</span><span class="portal-account-class-card-add-label">Nouvelle classe</span></button>';
        } else {
            var c = state.classroom;
            gridHtml += '<button type="button" class="portal-account-class-card portal-account-class-card--active" data-portal-account-modal-open="classroom-detail" aria-label="Ouvrir '
                + escapeHtml(c.name) + '">'
                + '<h3 class="portal-account-class-card-title">' + escapeHtml(c.name) + '</h3>'
                + '<p class="portal-account-class-card-seats"><span class="portal-account-class-card-seats-count" data-classroom-seats-count>'
                + c.members.length + '/' + c.maxSlots + '</span> places</p></button>';
        }
        gridHtml += '</div>';

        root.innerHTML = gridHtml;
        renderClassroomDetail(state);
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function subscriptionCycleProgress(periodEndIso) {
        if (!periodEndIso) {
            return 0;
        }
        var end = new Date(periodEndIso).getTime();
        if (isNaN(end)) {
            return 0;
        }
        var startDate = new Date(end);
        startDate.setMonth(startDate.getMonth() - 1);
        var start = startDate.getTime();
        var span = Math.max(1, end - start);
        var elapsed = Math.min(span, Math.max(0, Date.now() - start));
        return Math.round((elapsed / span) * 100);
    }

    var INVOICE_PREVIEW_LIMIT = 2;
    var INVOICE_FULL_COUNT = 12;

    function renderInvoiceListHtml(invoices) {
        var html = '';
        invoices.forEach(function (invoice) {
            html += '<li class="portal-account-invoice-item">'
                + '<span class="portal-account-invoice-date">' + escapeHtml(invoice.date) + '</span>'
                + '<span class="portal-account-invoice-amount">' + escapeHtml(invoice.amount) + '</span>'
                + '</li>';
        });
        return html;
    }

    function billingHistory(periodEndIso, amount, count) {
        if (!periodEndIso) {
            return [];
        }
        var end = new Date(periodEndIso);
        if (isNaN(end.getTime())) {
            return [];
        }
        var out = [];
        var i;
        var anchor;
        for (i = 0; i < (count || 3); i += 1) {
            anchor = new Date(end.getTime());
            if (i > 0) {
                anchor.setMonth(anchor.getMonth() - i);
            }
            out.push({
                date: store.formatDateFr(anchor.toISOString()),
                amount: amount || '15 €',
            });
        }
        return out;
    }

    function setSubscriptionCancelMessage(el, subject, periodEndIso) {
        if (!el) {
            return;
        }
        if (periodEndIso) {
            el.innerHTML = escapeHtml(subject) + ' se terminera le <span class="portal-account-sub-date">'
                + escapeHtml(store.formatDateFr(periodEndIso)) + '</span>.';
            return;
        }
        el.textContent = subject + ' se terminera à la fin de la période en cours.';
    }

    function formatSubscriptionPeriodDisplay(periodEndIso, cancelled) {
        if (!periodEndIso) {
            return '-';
        }
        var formatted = store.formatDateFr(periodEndIso);
        return cancelled ? 'fin le ' + formatted : formatted;
    }

    function showSubscriptionManageView(view) {
        document.querySelectorAll('[data-subscription-manage-view]').forEach(function (el) {
            el.hidden = el.getAttribute('data-subscription-manage-view') !== view;
        });
    }

    function renderSubscription(state) {
        var sub = store.subscriptionInfo();
        var billing = state.billing || {};
        var statusEl = document.querySelector('[data-dev-sub-renewal-status]');
        var modalPeriod = document.querySelector('[data-subscription-manage-period]');
        var modalStatus = document.querySelector('[data-subscription-manage-status]');
        var modalLead = document.querySelector('[data-subscription-manage-lead]');
        var cancelPeriod = document.querySelector('[data-subscription-cancel-period]');
        var showCancelBtn = document.querySelector('[data-subscription-show-cancel-confirm]');
        var reactivateBtn = document.querySelector('[data-subscription-reactivate]');
        var periodEl = document.querySelector('[data-dev-sub-period-end]');
        var nextBillingEl = document.querySelector('[data-dev-sub-next-billing]');
        var ringEl = document.querySelector('[data-dev-sub-renewal-ring]');
        var ringProgress = document.querySelector('[data-dev-sub-renewal-progress]');
        var invoicesRoot = document.querySelector('[data-dev-sub-invoices]');
        var billingName = document.querySelector('[data-dev-sub-billing-name]');
        var billingEmail = document.querySelector('[data-dev-sub-billing-email]');
        var billingPayment = document.querySelector('[data-dev-sub-billing-payment]');
        var billingAddress = document.querySelector('[data-dev-sub-billing-address]');
        var cancelled = !!sub.cancelAtPeriodEnd;
        var periodLabel = sub.currentPeriodEnd ? store.formatDateFr(sub.currentPeriodEnd) : '-';
        var periodDisplay = formatSubscriptionPeriodDisplay(sub.currentPeriodEnd, cancelled);
        var cyclePercent = subscriptionCycleProgress(sub.currentPeriodEnd);
        if (periodEl) {
            periodEl.textContent = periodDisplay;
        }
        if (nextBillingEl) {
            nextBillingEl.textContent = periodDisplay;
        }
        if (ringProgress) {
            ringProgress.setAttribute('stroke-dashoffset', String(100 - cyclePercent));
        }
        if (ringEl) {
            ringEl.setAttribute('aria-valuenow', String(cyclePercent));
        }
        if (statusEl) {
            statusEl.textContent = cancelled ? 'Annulé' : 'Actif';
            statusEl.className = 'portal-account-sub-renewal-status '
                + (cancelled ? 'portal-account-sub-renewal-status--cancelled' : 'portal-account-sub-renewal-status--active');
        }
        var overviewRenewalDate = document.querySelector('[data-dev-overview-renewal-date]');
        var overviewRenewalStatus = document.querySelector('[data-dev-overview-renewal-status]');
        if (overviewRenewalDate) {
            overviewRenewalDate.textContent = periodDisplay;
        }
        if (overviewRenewalStatus) {
            overviewRenewalStatus.textContent = cancelled ? 'Annulé' : 'Actif';
            overviewRenewalStatus.className = 'portal-account-sub-renewal-status '
                + (cancelled ? 'portal-account-sub-renewal-status--cancelled' : 'portal-account-sub-renewal-status--active');
        }
        if (invoicesRoot) {
            var allInvoices = billingHistory(sub.currentPeriodEnd, '15 €', INVOICE_FULL_COUNT);
            var previewInvoices = allInvoices.slice(0, INVOICE_PREVIEW_LIMIT);
            var hasMoreInvoices = allInvoices.length > INVOICE_PREVIEW_LIMIT;
            invoicesRoot.innerHTML = renderInvoiceListHtml(previewInvoices);
            var historyOpenBtn = document.querySelector('[data-dev-invoice-history-open]');
            if (historyOpenBtn) {
                historyOpenBtn.hidden = !hasMoreInvoices;
                historyOpenBtn.textContent = 'Voir tout l\'historique (' + allInvoices.length + ')';
            }
            var modalList = document.querySelector('[data-dev-invoice-modal-list]');
            if (modalList) {
                modalList.innerHTML = renderInvoiceListHtml(allInvoices);
            }
            var invoiceModal = document.getElementById('portal-account-invoice-history-modal');
            if (invoiceModal) {
                invoiceModal.hidden = !hasMoreInvoices;
            }
        }
        if (billingName) {
            billingName.textContent = state.displayName || state.email || '-';
        }
        if (billingEmail) {
            billingEmail.textContent = state.email || '-';
        }
        if (billingPayment) {
            billingPayment.textContent = billing.paymentMethod || '-';
        }
        if (billingAddress) {
            billingAddress.textContent = (billing.postalCode || '') + ' ' + (billing.city || '')
                + ' · ' + (billing.addressLine || '');
        }
        if (modalPeriod) {
            modalPeriod.textContent = periodDisplay;
        }
        if (modalStatus) {
            modalStatus.textContent = cancelled ? 'Annulé' : 'Actif';
            modalStatus.className = 'portal-account-sub-renewal-status '
                + (cancelled ? 'portal-account-sub-renewal-status--cancelled' : 'portal-account-sub-renewal-status--active');
        }
        if (modalLead) {
            if (cancelled) {
                setSubscriptionCancelMessage(modalLead, 'Votre abonnement Abonné', sub.currentPeriodEnd);
            } else {
                modalLead.textContent = 'Votre abonnement Abonné se renouvelle automatiquement chaque mois.';
            }
        }
        if (cancelPeriod) {
            cancelPeriod.textContent = periodLabel;
        }
        if (showCancelBtn) {
            showCancelBtn.hidden = cancelled;
        }
        if (reactivateBtn) {
            reactivateBtn.hidden = !cancelled;
        }
        document.querySelectorAll('[data-subscription-show-cancel-confirm]').forEach(function (btn) {
            btn.hidden = cancelled;
        });
        document.querySelectorAll('[data-subscription-reactivate]').forEach(function (btn) {
            btn.hidden = !cancelled;
        });
    }

    function renderAll() {
        var state = store.load();
        syncHeader(state);
        renderGamification(state);
        renderSubscription(state);
        renderStudent(state, getGrade());
        renderProgress();
        renderSkins(state);
        syncTicketTabs(state);
        renderTickets(state);
        renderTeacher(state);

        if (window.CapsulePortalAccountNav) {
            window.CapsulePortalAccountNav.refresh();
        }

        var accountRoot = document.querySelector('[data-portal-account-dev]');
        if (accountRoot) {
            accountRoot.setAttribute('data-portal-display-name', state.displayName || '');
            accountRoot.setAttribute(
                'data-portal-author-badges',
                JSON.stringify(accountBadgesForGrade(getGrade())),
            );
        }

        var nameInput = document.querySelector('[data-dev-settings-name]');
        var emailInput = document.querySelector('[data-dev-settings-email]');
        if (nameInput) {
            nameInput.value = state.displayName;
        }
        if (emailInput) {
            emailInput.value = state.email;
        }
    }

    function handleJoinFromUrl() {
        var params = new URLSearchParams(window.location.search);
        var token = params.get('join');
        if (!token) {
            return;
        }
        var result = store.joinClassByToken(token);
        if (result.ok) {
            setGrade('eleve');
            window.alert('Vous avez rejoint la classe « ' + result.className + ' ».');
            window.history.replaceState({}, '', './account.html');
        } else {
            window.alert(result.error || 'Impossible de rejoindre la classe.');
        }
    }

    function bindForms() {
        var classCreateForm = document.querySelector('[data-dev-class-create]');
        if (classCreateForm) {
            bindNumericInputs(classCreateForm);
            classCreateForm.addEventListener('submit', function (event) {
                event.preventDefault();
                var fd = new FormData(classCreateForm);
                var name = String(fd.get('name') || '').trim();
                var slots = parseInt(String(fd.get('maxSlots') || ''), 10);
                if (!name || slots < 2 || slots > 32) {
                    window.alert('Nom requis et places entre 2 et 32.');
                    return;
                }
                var access = collectClassroomAccess(classCreateForm);
                if (!store.createClassroom(name, slots, access.allowedOs, access.allowedModules)) {
                    window.alert('Une classe existe déjà.');
                    return;
                }
                if (window.CapsulePortalAccountModals) {
                    window.CapsulePortalAccountModals.close('classroom-create');
                }
                classCreateForm.reset();
                renderTeacher(store.load());
            });
        }

        var ticketForm = document.querySelector('[data-dev-ticket-form]');
        if (ticketForm) {
            ticketForm.addEventListener('submit', function (event) {
                event.preventDefault();
                if (!ticketForm.checkValidity()) {
                    ticketForm.reportValidity();
                    return;
                }
                var fd = new FormData(ticketForm);
                var ticket = store.addTicket(String(fd.get('type')), String(fd.get('subject')), String(fd.get('body')));
                ticketForm.reset();
                var state = store.load();
                syncTicketTabs(state);
                renderTickets(state);
                if (window.CapsulePortalAccountNav && window.CapsulePortalTickets) {
                    window.CapsulePortalAccountNav.activate('settings', { sub: window.CapsulePortalTickets.subId(ticket) });
                }
            });
        }

        document.querySelectorAll('[data-dev-ticket-prefill]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var form = document.querySelector('[data-dev-ticket-form]');
                if (!form) {
                    return;
                }
                if (window.CapsulePortalAccountNav) {
                    window.CapsulePortalAccountNav.activate('settings', { sub: 'support' });
                }
                form.querySelector('[name="type"]').value = btn.getAttribute('data-dev-ticket-prefill') || 'support';
                form.querySelector('[name="subject"]').value = btn.getAttribute('data-dev-ticket-subject') || '';
                if (window.CapsulePortalTickets) {
                    window.CapsulePortalTickets.syncTicketTypeSubject(form);
                }
            });
        });

        var nameForm = document.querySelector('[data-dev-settings-name-form]');
        if (nameForm) {
            nameForm.addEventListener('submit', function (event) {
                event.preventDefault();
                var fd = new FormData(nameForm);
                store.updateProfile({ displayName: fd.get('name') });
                renderAll();
                window.alert('Nom enregistré (local).');
            });
        }

        var emailForm = document.querySelector('[data-dev-settings-email-form]');
        if (emailForm) {
            emailForm.addEventListener('submit', function (event) {
                event.preventDefault();
                var fd = new FormData(emailForm);
                store.updateProfile({ email: fd.get('email') });
                renderAll();
                window.alert('E-mail enregistré (local).');
            });
        }

        var pwdForm = document.querySelector('[data-dev-settings-password-form]');
        if (pwdForm) {
            pwdForm.addEventListener('submit', function (event) {
                event.preventDefault();
                var fd = new FormData(pwdForm);
                var pwd = String(fd.get('password') || '');
                if (pwd.length < 12) {
                    window.alert('Mot de passe : minimum 12 caractères.');
                    return;
                }
                store.updateProfile({ password: pwd });
                pwdForm.reset();
                window.alert('Mot de passe mis à jour (local).');
            });
        }

        var resetBtn = document.querySelector('[data-dev-reset-store]');
        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                if (window.confirm('Réinitialiser toutes les données dev locales ?')) {
                    store.resetAll();
                    sessionStorage.removeItem(GRADE_KEY);
                    setGrade('utilisateur');
                    renderAll();
                }
            });
        }

        var showCancelConfirm = document.querySelector('[data-subscription-show-cancel-confirm]');
        if (showCancelConfirm) {
            showCancelConfirm.addEventListener('click', function () {
                showSubscriptionManageView('confirm-cancel');
            });
        }

        var manageBack = document.querySelector('[data-subscription-manage-back]');
        if (manageBack) {
            manageBack.addEventListener('click', function () {
                showSubscriptionManageView('overview');
            });
        }

        var cancelConfirm = document.querySelector('[data-subscription-cancel-confirm]');
        if (cancelConfirm) {
            cancelConfirm.addEventListener('click', function () {
                store.setCancelRenewal(true);
                showSubscriptionManageView('overview');
                renderSubscription(store.load());
            });
        }

        var reactivateBtn = document.querySelector('[data-subscription-reactivate]');
        if (reactivateBtn) {
            reactivateBtn.addEventListener('click', function () {
                store.setCancelRenewal(false);
                showSubscriptionManageView('overview');
                renderSubscription(store.load());
            });
        }
    }

    function init() {
        if (!document.querySelector('[data-portal-account-dev]')) {
            return;
        }

        var select = document.getElementById('portal-dev-grade-select');
        if (select) {
            Object.keys(GRADE_LABELS).forEach(function (key) {
                var opt = document.createElement('option');
                opt.value = key;
                opt.textContent = GRADE_LABELS[key];
                select.appendChild(opt);
            });
            select.addEventListener('change', function () {
                setGrade(select.value);
            });
        }

        var ticketType = document.querySelector('[data-dev-ticket-type]');
        if (ticketType) {
            TICKET_TYPES.forEach(function (t) {
                var opt = document.createElement('option');
                opt.value = t.id;
                opt.textContent = t.label;
                if (t.defaultSubject) {
                    opt.setAttribute('data-default-subject', t.defaultSubject);
                }
                ticketType.appendChild(opt);
            });
        }

        var ticketForm = document.querySelector('[data-dev-ticket-form]');
        if (ticketForm && window.CapsulePortalTickets) {
            window.CapsulePortalTickets.bindTicketTypeSubject(ticketForm);
        }

        handleJoinFromUrl();
        applyGrade(getGrade());
        bindForms();
        renderDevClassroomCreateAccess();
        renderAll();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
}());
