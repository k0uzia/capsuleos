# Brief agent — KDE neon User Edition

> Campagne **v15-kde-settings-full-front** — front intégral Paramètres KDE Plasma (juin 2026).

## Contexte

- **ID registre** : `linux-kde-neon`
- **Famille** : linux · **Tier** : **P1** · **Statut** : active · **fidelityLevel** : 4
- **Toolkit** : kde / Plasma · **Vendor** : neon
- **VM lab** : `capsule@192.168.122.48` · clé `~/.ssh/capsuleos-lab`
- **Ground truth** : [`ground-truth-kde.md`](../ground-truth-kde.md)

## v15 — objectifs

1. **Inventaire VM exhaustif** : 92 modules KCM → `kde-settings-front-inventory.json`
2. **Registry option-par-option** : `kde-settings-controls-registry.json` (13 effets P0)
3. **Front multi-KCM** : `systemsettings_kde_neon.html` — hub + 4 surfaces KCM
4. **Se+** : `kde-kconfig-bindings.js` + verify chain (SeΣ)
5. **Crédibilité pédagogique** : 8 scénarios + seuil Φ_norm 90
6. **Propagation** : `smoke-kde-v15-propagation` dérivés Plasma

## Chaîne v15 (ordre)

1. `collect-vm-kde-settings-inventory.mjs --id linux-kde-neon --write`
2. `collect-vm-kde-settings-interaction.mjs --id linux-kde-neon --write`
3. `sync-kde-settings-parity-matrix.mjs --write`
4. `generate-kde-kconfig-bindings.mjs`
5. `run-kde-settings-lab.mjs --id linux-kde-neon`
6. `sync-linux-skin-closure.mjs`

## État

- [`linux-kde-neon-replication-state.json`](../inventaires/linux-kde-neon-replication-state.json)
- Registre : [`kde-settings-controls-registry.json`](../../tools/lab/kde-settings-controls-registry.json)
