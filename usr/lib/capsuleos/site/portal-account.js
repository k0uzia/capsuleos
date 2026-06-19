/**
 * Compte portail : tickets, classe, paramètres, skins, abonnement.
 */
(function () {
    'use strict';

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

    bindNumericInputs();

    var csrfEl = document.querySelector('[data-csrf]');
    var CSRF = csrfEl ? csrfEl.getAttribute('data-csrf') : '';
    if (!CSRF) {
        var meta = document.querySelector('meta[name="csrf-token"]');
        CSRF = meta ? meta.content : '';
    }

    function apiPost(url, body) {
        var payload = {};
        var key;
        for (key in body) {
            if (Object.prototype.hasOwnProperty.call(body, key)) {
                payload[key] = body[key];
            }
        }
        payload._csrf = CSRF;
        return fetch(url, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': CSRF },
            body: JSON.stringify(payload),
        }).then(function (res) {
            return res.json().catch(function () { return {}; }).then(function (data) {
                if (!res.ok) {
                    throw new Error(data.error || 'Erreur serveur');
                }
                return data;
            });
        });
    }

    var ticketForm = document.querySelector('[data-ticket-form]');
    if (ticketForm) {
        if (window.CapsulePortalTickets) {
            window.CapsulePortalTickets.bindTicketTypeSubject(ticketForm);
        }
        ticketForm.addEventListener('submit', function (event) {
            event.preventDefault();
            if (!ticketForm.checkValidity()) {
                ticketForm.reportValidity();
                return;
            }
            var fd = new FormData(ticketForm);
            apiPost('/portal/api/tickets.php', {
                type: fd.get('type'),
                subject: fd.get('subject'),
                body: fd.get('body'),
            }).then(function (data) {
                ticketForm.reset();
                var ticketsApi = window.CapsulePortalTickets;
                var accountRoot = document.querySelector('[data-portal-account]');
                var displayName = accountRoot
                    ? (accountRoot.getAttribute('data-portal-display-name') || 'Utilisateur')
                    : 'Utilisateur';
                if (ticketsApi && data.ticket) {
                    ticketsApi.mountTicketTab(
                        data.ticket,
                        displayName,
                        null,
                        ticketsApi.readAuthorBadges(),
                    );
                    if (window.CapsulePortalAccountNav) {
                        window.CapsulePortalAccountNav.activate('settings', { sub: ticketsApi.subId(data.ticket) });
                    }
                    return;
                }
                window.location.reload();
            }).catch(function (err) {
                alert(err.message);
            });
        });
    }

    document.querySelectorAll('[data-ticket-prefill]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var form = document.querySelector('[data-ticket-form]');
            if (!form) {
                return;
            }
            if (window.CapsulePortalAccountNav) {
                window.CapsulePortalAccountNav.activate('settings', { sub: 'support' });
            } else if (window.CapsulePortalAccountModals) {
                window.CapsulePortalAccountModals.open('tickets');
            }
            form.querySelector('[name="type"]').value = btn.getAttribute('data-ticket-prefill') || 'support';
            form.querySelector('[name="subject"]').value = btn.getAttribute('data-ticket-subject') || '';
            if (window.CapsulePortalTickets) {
                window.CapsulePortalTickets.syncTicketTypeSubject(form);
            }
            var bodyField = form.querySelector('[name="body"]');
            if (bodyField) {
                bodyField.focus();
            }
        });
    });

    var nameForm = document.querySelector('[data-settings-name]');
    if (nameForm) {
        nameForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var fd = new FormData(nameForm);
            apiPost('/portal/api/account.php', { action: 'update_profile', displayName: fd.get('displayName') })
                .then(function () { alert('Nom enregistré.'); })
                .catch(function (err) { alert(err.message); });
        });
    }

    var emailForm = document.querySelector('[data-settings-email]');
    if (emailForm) {
        emailForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var fd = new FormData(emailForm);
            apiPost('/portal/api/account.php', { action: 'update_email', email: fd.get('email') })
                .then(function () {
                    alert('E-mail mis à jour.');
                    window.location.reload();
                })
                .catch(function (err) { alert(err.message); });
        });
    }

    var passwordForm = document.querySelector('[data-settings-password]');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var fd = new FormData(passwordForm);
            apiPost('/portal/api/account.php', { action: 'update_password', password: fd.get('password') })
                .then(function () {
                    alert('Mot de passe mis à jour.');
                    passwordForm.reset();
                })
                .catch(function (err) { alert(err.message); });
        });
    }

    var deleteBtn = document.querySelector('[data-account-delete]');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function () {
            if (!window.confirm('Supprimer définitivement votre compte et toutes vos données ?')) {
                return;
            }
            apiPost('/portal/api/account.php', { action: 'delete_account' })
                .then(function () { window.location.href = '/portal/index.php'; })
                .catch(function (err) { alert(err.message); });
        });
    }

    function showSubscriptionManageView(view) {
        document.querySelectorAll('[data-subscription-manage-view]').forEach(function (el) {
            el.hidden = el.getAttribute('data-subscription-manage-view') !== view;
        });
    }

    function syncRenewalActionButtons() {
        var statusEl = document.querySelector('[data-subscription-manage-status]');
        if (!statusEl) {
            return;
        }
        var cancelled = (statusEl.textContent || '').trim() === 'Annulé';
        document.querySelectorAll('[data-subscription-show-cancel-confirm]').forEach(function (btn) {
            btn.hidden = cancelled;
        });
        document.querySelectorAll('[data-subscription-reactivate]').forEach(function (btn) {
            btn.hidden = !cancelled;
        });
    }

    syncRenewalActionButtons();

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
            apiPost('/portal/api/account.php', {
                action: 'cancel_renewal',
                cancel: true,
            }).then(function () {
                showSubscriptionManageView('overview');
                window.location.reload();
            }).catch(function (err) {
                alert(err.message);
            });
        });
    }

    var reactivateBtn = document.querySelector('[data-subscription-reactivate]');
    if (reactivateBtn) {
        reactivateBtn.addEventListener('click', function () {
            apiPost('/portal/api/account.php', {
                action: 'cancel_renewal',
                cancel: false,
            }).then(function () {
                showSubscriptionManageView('overview');
                window.location.reload();
            }).catch(function (err) {
                alert(err.message);
            });
        });
    }

    document.querySelectorAll('[data-skin-delete]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var registryId = btn.getAttribute('data-skin-delete') || '';
            var label = btn.getAttribute('data-skin-label') || 'ce skin';
            if (!registryId || !window.confirm('Supprimer la sauvegarde « ' + label + ' » ?')) {
                return;
            }
            apiPost('/portal/api/skins.php', { action: 'delete', registryId: registryId })
                .then(function () {
                    var row = btn.closest('[data-skin-row]');
                    if (row) {
                        row.remove();
                    }
                })
                .catch(function (err) { alert(err.message); });
        });
    });

    var createForm = document.querySelector('[data-classroom-create]');
    if (createForm) {
        createForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var fd = new FormData(createForm);
            var allowedOs = [];
            var allowedModules = [];
            var maxSlots = parseInt(String(fd.get('maxSlots') || ''), 10);
            createForm.querySelectorAll('[name="allowedOs"]:checked').forEach(function (el) {
                allowedOs.push(el.value);
            });
            createForm.querySelectorAll('[name="allowedModules"]:checked').forEach(function (el) {
                allowedModules.push(el.value);
            });
            if (!maxSlots || maxSlots < 2 || maxSlots > 32) {
                alert('Nombre de places : entre 2 et 32.');
                return;
            }
            apiPost('/portal/api/classroom.php', {
                action: 'create',
                name: fd.get('name'),
                maxSlots: maxSlots,
                allowedOs: allowedOs,
                allowedModules: allowedModules,
            }).then(function () {
                if (window.CapsulePortalAccountModals) {
                    window.CapsulePortalAccountModals.close('classroom-create');
                }
                window.location.reload();
            }).catch(function (err) { alert(err.message); });
        });
    }

    var updateForm = document.querySelector('[data-classroom-update]');
    if (updateForm) {
        updateForm.addEventListener('submit', function (event) {
            event.preventDefault();
            var fd = new FormData(updateForm);
            var allowedOs = [];
            var allowedModules = [];
            updateForm.querySelectorAll('[name="allowedOs"]:checked').forEach(function (el) {
                allowedOs.push(el.value);
            });
            updateForm.querySelectorAll('[name="allowedModules"]:checked').forEach(function (el) {
                allowedModules.push(el.value);
            });
            apiPost('/portal/api/classroom.php', {
                action: 'update',
                name: fd.get('name'),
                maxSlots: Number(fd.get('maxSlots')),
                allowedOs: allowedOs,
                allowedModules: allowedModules,
            }).then(function () { alert('Classe mise à jour.'); })
                .catch(function (err) { alert(err.message); });
        });
    }

    function copyInviteUrl(linkEl, event) {
        if (window.CapsulePortalClassroomLive && window.CapsulePortalClassroomLive.copyInviteFromLink) {
            window.CapsulePortalClassroomLive.copyInviteFromLink(linkEl, event);
            return;
        }
        if (!linkEl) {
            return;
        }
        var url = linkEl.getAttribute('data-invite-url') || linkEl.textContent.trim();
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url);
        }
    }

    function formatInviteExpiryFr(date) {
        return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function updateInviteExpiryLabel() {
        var expiresEl = document.querySelector('[data-invite-expires]');
        if (!expiresEl) {
            return;
        }
        var d = new Date();
        d.setDate(d.getDate() + 7);
        expiresEl.textContent = 'Expire le ' + formatInviteExpiryFr(d);
    }

    var copyBtn = document.querySelector('[data-invite-copy]');
    if (copyBtn) {
        copyBtn.addEventListener('click', function () {
            copyInviteUrl(document.querySelector('[data-invite-url]'));
        });
    }

    var regenBtn = document.querySelector('[data-invite-regenerate]');
    if (regenBtn) {
        regenBtn.addEventListener('click', function () {
            if (window.CapsulePortalClassroomLive) {
                window.CapsulePortalClassroomLive.spinIcon(regenBtn);
            }
            apiPost('/portal/api/classroom.php', { action: 'regenerate_invite' })
                .then(function (data) {
                    var link = document.querySelector('[data-invite-url]');
                    if (link && data.inviteToken) {
                        var base = (link.getAttribute('data-invite-url') || '').split('?')[0];
                        var newUrl = base + '?token=' + encodeURIComponent(data.inviteToken);
                        link.setAttribute('data-invite-url', newUrl);
                        link.textContent = newUrl;
                        link.title = 'Cliquer pour copier : ' + newUrl;
                    }
                    updateInviteExpiryLabel();
                    alert('Lien régénéré (valide 7 jours).');
                })
                .catch(function (err) { alert(err.message); });
        });
    }

    var deleteClassBtn = document.querySelector('[data-classroom-delete]');
    if (deleteClassBtn) {
        deleteClassBtn.addEventListener('click', function () {
            if (!window.confirm('Supprimer la classe ? Les élèves conservent leur progression.')) {
                return;
            }
            apiPost('/portal/api/classroom.php', { action: 'delete' })
                .then(function () {
                    if (window.CapsulePortalAccountModals) {
                        window.CapsulePortalAccountModals.close('classroom-detail');
                    }
                    window.location.reload();
                })
                .catch(function (err) { alert(err.message); });
        });
    }
}());
