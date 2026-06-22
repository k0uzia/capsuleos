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

    function apiUrl(path) {
        var accountRoot = document.querySelector('[data-portal-account]');
        var base = accountRoot ? (accountRoot.getAttribute('data-portal-api-base') || 'portal/api/') : 'portal/api/';
        if (!base.endsWith('/')) {
            base += '/';
        }
        return '/' + base.replace(/^\/+/, '') + String(path || '').replace(/^\/+/, '');
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
            apiPost(apiUrl('tickets.php'), {
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
                        window.CapsulePortalAccountNav.activate('support', { sub: ticketsApi.subId(data.ticket) });
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
                window.CapsulePortalAccountNav.activate('support', { sub: 'support' });
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

    function closeSettingsField(fieldKey) {
        if (!window.CapsulePortalAccountSettings) {
            return;
        }
        var field = document.querySelector('[data-settings-field="' + fieldKey + '"]');
        if (field) {
            window.CapsulePortalAccountSettings.closeField(field, true);
        }
    }

    function updateSettingsDisplay(selector, value, emptyLabel) {
        document.querySelectorAll(selector).forEach(function (el) {
            el.textContent = value || emptyLabel || '-';
        });
    }

    function syncAccountIdentity(displayName, email) {
        var resolvedEmail = email;
        if (resolvedEmail === null) {
            var emailEl = document.querySelector('[data-portal-account-email]');
            resolvedEmail = emailEl ? (emailEl.textContent || '').trim() : '';
        }
        document.querySelectorAll('[data-portal-account-name], [data-portal-auth-username], .header-user-menu-name').forEach(function (el) {
            el.textContent = displayName || resolvedEmail || 'Utilisateur';
        });
        if (email !== null) {
            document.querySelectorAll('[data-portal-account-email]').forEach(function (el) {
                el.textContent = email || '';
            });
        }
        var accountRoot = document.querySelector('[data-portal-account]');
        if (accountRoot && displayName) {
            accountRoot.setAttribute('data-portal-display-name', displayName);
        }
    }

    function settingsConfirm() {
        return window.CapsulePortalSettingsConfirm || null;
    }

    function settingsError(message) {
        var confirmApi = settingsConfirm();
        if (confirmApi) {
            confirmApi.alertError(message);
            return;
        }
        alert(message);
    }

    var nameForm = document.querySelector('[data-settings-name]');
    if (nameForm) {
        nameForm.addEventListener('submit', function (event) {
            event.preventDefault();
            if (!nameForm.checkValidity()) {
                nameForm.reportValidity();
                return;
            }
            var fd = new FormData(nameForm);
            var displayName = String(fd.get('displayName') || '').trim();
            apiPost(apiUrl('account.php'), { action: 'update_profile', displayName: displayName })
                .then(function () {
                    updateSettingsDisplay('[data-settings-display-name]', displayName, 'Non renseigné');
                    syncAccountIdentity(displayName, null);
                    closeSettingsField('display-name');
                    var confirmApi = settingsConfirm();
                    if (confirmApi) {
                        confirmApi.nameUpdated();
                    } else {
                        alert('Nom enregistré.');
                    }
                })
                .catch(function (err) { settingsError(err.message); });
        });
    }

    var emailForm = document.querySelector('[data-settings-email]');
    if (emailForm) {
        emailForm.addEventListener('submit', function (event) {
            event.preventDefault();
            if (!emailForm.checkValidity()) {
                emailForm.reportValidity();
                return;
            }
            var fd = new FormData(emailForm);
            apiPost(apiUrl('account.php'), { action: 'request_email_change', email: fd.get('email') })
                .then(function (data) {
                    closeSettingsField('email');
                    var confirmApi = settingsConfirm();
                    if (confirmApi) {
                        confirmApi.emailPending(data.message);
                    } else {
                        alert(data.message || 'Un e-mail de confirmation a été envoyé à la nouvelle adresse.');
                    }
                })
                .catch(function (err) { settingsError(err.message); });
        });
    }

    var passwordForm = document.querySelector('[data-settings-password]');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function (event) {
            event.preventDefault();
            if (!passwordForm.checkValidity()) {
                passwordForm.reportValidity();
                return;
            }
            var fd = new FormData(passwordForm);
            var password = String(fd.get('password') || '');
            var passwordConfirm = String(fd.get('passwordConfirm') || '');
            if (password !== passwordConfirm) {
                settingsError('Les nouveaux mots de passe ne correspondent pas.');
                return;
            }
            apiPost(apiUrl('account.php'), {
                action: 'update_password',
                currentPassword: fd.get('currentPassword'),
                password: password,
                passwordConfirm: passwordConfirm,
            }).then(function () {
                closeSettingsField('password');
                var confirmApi = settingsConfirm();
                if (confirmApi) {
                    confirmApi.passwordUpdated();
                } else {
                    alert('Mot de passe mis à jour.');
                }
            }).catch(function (err) { settingsError(err.message); });
        });
    }

    function syncPaymentMethodDisplay(value) {
        var label = value || 'Aucun moyen enregistré';
        document.querySelectorAll('[data-settings-display-payment]').forEach(function (el) {
            el.textContent = label;
        });
        document.querySelectorAll('.portal-account-plan-details-payment').forEach(function (el) {
            el.textContent = value || '-';
        });
        document.querySelectorAll('[data-settings-field="payment-method"] [data-settings-edit]').forEach(function (btn) {
            btn.textContent = value ? 'Modifier' : 'Ajouter';
        });
        document.querySelectorAll('[data-settings-payment-remove]').forEach(function (btn) {
            btn.hidden = !value;
        });
    }

    var paymentForm = document.querySelector('[data-settings-payment]');
    if (paymentForm) {
        paymentForm.addEventListener('submit', function (event) {
            event.preventDefault();
            if (!paymentForm.checkValidity()) {
                paymentForm.reportValidity();
                return;
            }
            var fd = new FormData(paymentForm);
            var paymentMethod = String(fd.get('paymentMethod') || '').trim();
            apiPost(apiUrl('account.php'), { action: 'update_billing', paymentMethod: paymentMethod })
                .then(function () {
                    syncPaymentMethodDisplay(paymentMethod);
                    closeSettingsField(document.querySelector('[data-settings-field="payment-method"]'), true);
                })
                .catch(function (err) { settingsError(err.message); });
        });
    }

    document.querySelectorAll('[data-settings-payment-remove]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            if (!window.confirm('Supprimer le moyen de paiement enregistré ?')) {
                return;
            }
            apiPost(apiUrl('account.php'), { action: 'remove_payment_method' })
                .then(function () {
                    syncPaymentMethodDisplay('');
                    var input = document.querySelector('[data-settings-payment] [name="paymentMethod"]');
                    if (input) {
                        input.value = '';
                    }
                    closeSettingsField(document.querySelector('[data-settings-field="payment-method"]'), true);
                })
                .catch(function (err) { settingsError(err.message); });
        });
    });

    var deleteBtn = document.querySelector('[data-account-delete]');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function () {
            if (!window.confirm('Supprimer définitivement votre compte et toutes vos données ?')) {
                return;
            }
            apiPost(apiUrl('account.php'), { action: 'delete_account' })
                .then(function () { window.location.href = '/portal/index.php'; })
                .catch(function (err) { alert(err.message); });
        });
    }

    function showSubscriptionManageView(view) {
        document.querySelectorAll('[data-subscription-manage-view]').forEach(function (el) {
            el.hidden = el.getAttribute('data-subscription-manage-view') !== view;
        });
    }

    function syncRenewalActionButtons(cancelled) {
        if (typeof cancelled !== 'boolean') {
            var statusEl = document.querySelector('[data-subscription-manage-status]');
            if (!statusEl) {
                return;
            }
            cancelled = (statusEl.textContent || '').trim() === 'Annulé';
        }
        document.querySelectorAll('[data-subscription-show-cancel-confirm]').forEach(function (btn) {
            btn.hidden = cancelled;
        });
        document.querySelectorAll('[data-subscription-reactivate]').forEach(function (btn) {
            btn.hidden = !cancelled;
        });
    }

    function setRenewalStatusClass(el, cancelled) {
        if (!el) {
            return;
        }
        el.textContent = cancelled ? 'Annulé' : 'Actif';
        el.className = 'portal-account-sub-renewal-status '
            + (cancelled ? 'portal-account-sub-renewal-status--cancelled' : 'portal-account-sub-renewal-status--active');
    }

    function applyRenewalState(cancelled) {
        document.querySelectorAll('[data-subscription-manage-status], [data-subscription-renewal-status], [data-subscription-overview-status]').forEach(function (el) {
            setRenewalStatusClass(el, cancelled);
        });
        syncRenewalActionButtons(cancelled);
        if (window.CapsulePortalAccountNav) {
            var hash = window.location.hash.replace(/^#/, '');
            if (hash.indexOf('parametres/') === 0) {
                window.CapsulePortalAccountNav.activate('settings', { sub: 'subscription', updateHash: false });
            }
        }
    }

    syncRenewalActionButtons();

    document.querySelectorAll('[data-subscription-show-cancel-confirm]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            showSubscriptionManageView('confirm-cancel');
        });
    });

    document.querySelectorAll('[data-subscription-manage-back]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            showSubscriptionManageView('overview');
        });
    });

    document.querySelectorAll('[data-subscription-cancel-confirm]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            apiPost(apiUrl('account.php'), {
                action: 'cancel_renewal',
                cancel: true,
            }).then(function () {
                showSubscriptionManageView('overview');
                applyRenewalState(true);
            }).catch(function (err) {
                alert(err.message);
            });
        });
    });

    document.querySelectorAll('[data-subscription-reactivate]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            apiPost(apiUrl('account.php'), {
                action: 'cancel_renewal',
                cancel: false,
            }).then(function () {
                showSubscriptionManageView('overview');
                applyRenewalState(false);
            }).catch(function (err) {
                alert(err.message);
            });
        });
    });

    document.querySelectorAll('[data-skin-delete]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var registryId = btn.getAttribute('data-skin-delete') || '';
            var label = btn.getAttribute('data-skin-label') || 'ce skin';
            if (!registryId || !window.confirm('Supprimer la sauvegarde « ' + label + ' » ?')) {
                return;
            }
            apiPost(apiUrl('skins.php'), { action: 'delete', registryId: registryId })
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
            apiPost(apiUrl('classroom.php'), {
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
            apiPost(apiUrl('classroom.php'), {
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
            apiPost(apiUrl('classroom.php'), { action: 'regenerate_invite' })
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
            apiPost(apiUrl('classroom.php'), { action: 'delete' })
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
