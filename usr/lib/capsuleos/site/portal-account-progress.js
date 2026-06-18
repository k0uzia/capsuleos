/**
 * Compte — suppression sauvegarde progression.
 */
(function () {
    'use strict';

    const API = '/portal/api/progress.php';

    document.querySelectorAll('[data-progress-delete]').forEach((btn) => {
        btn.addEventListener('click', async (event) => {
            event.preventDefault();
            const mountId = btn.getAttribute('data-progress-delete') || '';
            const label = btn.getAttribute('data-progress-label') || 'cette sauvegarde';
            if (!mountId) {
                return;
            }
            if (!window.confirm(`Supprimer la progression pour « ${label} » ?`)) {
                return;
            }
            const csrf = btn.getAttribute('data-csrf') || '';
            const body = new URLSearchParams();
            body.set('mountId', mountId);
            body.set('_csrf', csrf);
            body.set('_method', 'DELETE');
            const res = await fetch(API, {
                method: 'POST',
                credentials: 'include',
                body,
            });
            if (res.ok) {
                const row = btn.closest('[data-progress-row]');
                if (row) {
                    row.remove();
                }
                const list = document.getElementById('portal-account-progress-list');
                if (list && list.children.length === 0) {
                    const empty = document.getElementById('portal-account-progress-empty');
                    if (empty) {
                        empty.hidden = false;
                    }
                }
            }
        });
    });
}());
