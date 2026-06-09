# Recette clone Mint — passe intégrale (moteur de clonage)

> **Date** : 2026-06-08 · **registryId** : `linux-mint` · **VM** : `capsule@192.168.1.146`  
> **Objectif** : valider de bout en bout le moteur de clonage Cinnamon et documenter le cloisonnement toolkit.  
> **Coordination** : passe Rocky parallèle (`91a017bf`) — périmètre Mint uniquement.  
> **Dernière exécution recette** : 2026-06-08T14:15Z — pallier **8** · rapport [`linux-mint-clone-conformity-report.md`](inventaires/linux-mint-clone-conformity-report.md)

**Lecture obligatoire** : [convention-reproduction-os.md](convention-reproduction-os.md) · [procedure-clonage-os-depuis-vm.md](procedure-clonage-os-depuis-vm.md) · [agent-validation-discipline.md](agent-validation-discipline.md) · [paradigme-toolkit-cinnamon.md](paradigme-toolkit-cinnamon.md)

---

## Checklist recette

### Phase 0 — Baseline

| Étape | Commande | Résultat |
|-------|----------|----------|
| Brief registre | `print-agent-brief.mjs linux-mint` | ✅ |
| H₂ baseline | `validate-all.mjs` | ✅ exit 0 (189 avert. JSON vanilla — hors zone Mint) |
| Paradigme toolkit | `validate-toolkit-paradigm.mjs --id linux-mint` | ✅ |
| Assets clone | `validate-clone-assets.mjs --id linux-mint` | ✅ (zones, profils, 112 icônes cinnamon/apps) |
| Inventaire VM | `collect-mint-inventory.mjs --write-doc` | ✅ JSON `2026-06-08T14:07:17Z` + MD + catalogue 101 apps |

### Phase 1 — Shell (panel / menu / bureau)

| Étape | Commande | Résultat |
|-------|----------|----------|
| Géométrie shell | `measure-mint-shell-geometry.mjs` | ✅ maxΔ **0,7 px** (≤1) · menu 600×480 gap 2 px |
| Panel browser | `run-capsule-panel-browser.mjs` sur `:5501` | ✅ **6/6** |
| Parité VM | `compare-os-parity.mjs --scenario panel-checklist --capsule-json /tmp/capsule-panel.json` | ✅ **6/6** VM + Capsule |
| UI state effects | `run-ui-state-effects-pass.mjs --shell … --write` | ✅ **8/8** (altTab + windowChrome Π=100) |
| Captures baseline | `root/docs/inventaires/captures/linux-mint/clone-baseline/` | ✅ `metrics.json` à jour |

### Phase 2 — Parité index

| Étape | Commande | Résultat |
|-------|----------|----------|
| Apps prioritaires | `run-app-parity-pass.mjs --id linux-mint --priority` | ✅ 8/8 slots (nemo, firefox, text_editor, calculator, file_roller, update_manager, mintinstall, themes) |
| Π_global | `linux-mint-parity-index.json` | ✅ **98** (`status_global: ok`) |
| layoutMetrics shell | panel Π=100 · menu Π=92 · tray Π=100 | ✅ voir indice § `shell` |

### Phase 3 — Cloisonnement audit

| Critère | État | Doc |
|---------|------|-----|
| contentLoader embed Cinnamon | ✅ `CINNAMON_PANEL_MENU_SKINS` + `CAPSULE_FORCE_APP_EMBED` | [processus-branchement-noyau.md](processus-branchement-noyau.md) |
| Chemins toolkit cinnamon | ✅ `toolkits/cinnamon/` menu + panel | [paradigme-toolkit-cinnamon.md](paradigme-toolkit-cinnamon.md) |
| `mint-panel.css` unique | ✅ pas de `footer.css` / `panel-windows.css` legacy | clone-status § panel v3 |
| `mainMenu-data-cinnamon.js` | ✅ 97 icônes cinnamon/apps | audit cinnamon-vs-gnome |
| `fileExplorerContextMenu` scopé | ✅ branche Nemo vs Nautilus restaurée | [toolkit-cloisonnement-audit.md](toolkit-cloisonnement-audit.md) |
| CapsuleResource `./assets/` | ✅ profil + boot manifest | skin.profile.json |
| Cross-check Rocky/Ubuntu | ✅ aucune import Mint | grep `home/Debian/Mint` → 0 |

**Score cloisonnement** : **94/100** — 2 écarts P2 documentés (voir § Non-conformes résiduels).

### Phase 4 — Branching process doc

| Livrable | Fichier |
|----------|---------|
| Table comportement → noyau → hook skin | [processus-branchement-noyau.md](processus-branchement-noyau.md) |
| Matrice DE multi-toolkit | [paradigme-toolkit-de.md](paradigme-toolkit-de.md) |

### Phase 5 — Gaps & fixes

| Gap | Sévérité | Action passe |
|-----|----------|--------------|
| Régression menu clic droit Nautilus (00816fb) | **P0 Rocky** | ✅ `bindFileExplorerContextMenu` dispatch Nautilus/Nemo |
| Bureau Mint — `#desktop { pointer-events: none }` | **P0 Mint** | ✅ `style.css` + repli `body#mint` dans `desktop-context-menu.js` |
| Nemo corbeille — profils trash/sidebar absents | **P1 Mint** | ✅ `bindNemoContextMenu` profils trash + smoke dédié |
| Fuites `toolkits/gnome/apps` dans Mint | P0 Mint | ✅ corrigé b5e39bc + gate paradigm |
| `--taskbar-height` portal hérité | P1 | ✅ alias `--mint-panel-height: 40px` dans tokens |
| Chemins physiques `../../../../usr/` en CSS | P2 | Documenté — migration `./assets/` différée |
| Slots CapsuleOnly (`librewriter`, `checklist`) | CapsuleOnly | Documenté P1 — hors clôture VM |

### Phase 6 — Clôture

| Étape | Commande | Résultat |
|-------|----------|----------|
| Sync vues | `sync-all-views.mjs` | ✅ (à relancer avant push) |
| Gate zone Mint | `validate-all.mjs` + `validate-toolkit-paradigm.mjs --all` | ✅ |
| **Clic droit P0/P1/P2 bureau** | `smoke-mint-context-menus.mjs` sur `:5501` | ✅ matrice [`context-menus.json`](inventaires/interactions/linux-mint/context-menus.json) incl. `desktop.icon` |
| **Nemo menu étape 2** | `bindNemoContextMenu` + `fileExplorerNemoOps.js` | ✅ fond liste (document, terminal, tout sélectionner) ; fichier (ouvrir avec…, renommer, corbeille) ; checklist `print-mint-context-menu-checklist.mjs` |
| **Bureau étape 3** | `mint-desktop-icons.js` + `#desktop-icon-context-menu` | ✅ Dossier personnel + Corbeille visibles ; menu Ouvrir/Couper/Copier/Renommer/Supprimer/Propriétés |
| **Barre titre étape 4** | `cinnamon-window-behaviors.js` + `#muffin-window-context-menu` | ✅ Réduire/Agrandir/Fermer/Toujours au premier plan ; smoke `window.title` ; **R-CIN-CTX4** |
| État réplication | `linux-mint-replication-state.json` | ✅ pallier **8** · Π_global 98 · non-conformités listées |
| Rapport conformité | `linux-mint-clone-conformity-report.md` | ✅ matrice VM↔clone |

---

## Conformes (Mint)

- **Embed** : `contentLoader.js` — skip `mainMenu.base.css`, embed forcé, branche `mint` panel menu.
- **Toolkit paths** : `toolkits/cinnamon/header|elements|apps`, `icons/cinnamon`, `vendors/mint/panel`.
- **Panel** : `mint-panel.css` — régions `mint-panel__*` (menu, window-list, tray, favoris).
- **Menu** : `mainMenu-data-cinnamon.js` + `mainMenu.skin.css` statique (`CAPSULE_STATIC_SKIN_SLOTS`).
- **Nemo context menu** : `bindNemoContextMenu` — menu dynamique `.nemo-app__context-menu`, pas `#nemo-context-menu` GNOME. Cycle VM → matrice → impl → `smoke-mint-context-menus.mjs` → gap map `--write`.
- **WM** : `cinnamon-window-behaviors.js`, `cinnamon-alt-tab.js`, `cinnamon-window-effects.js` — garde `isMintDesktop()`.
- **Assets runtime** : `capsule-resource.js` → `./assets/...` (profil `assetsBase`).

## Non-conformes résiduels (documentés, non bloquants)

| Anti-pattern | Fichier(s) | Niveau | Justification |
|--------------|------------|--------|---------------|
| Chemins physiques `../../../../usr/share/...` en `url()` CSS | `windows.css`, `cinnamon-window-chrome.css`, `firefox.skin.css` | P2 | Fonctionnels ; migration `rewrite-css-asset-urls` planifiée |
| Classes DOM `gnome-*` sur apps GTK partagées | `terminal.skin.css`, `calculator.skin.css`, `screenshot.skin.css` | Exception | Apps upstream GNOME sur Mint — voir paradigme § exceptions |
| Slots `librewriter`, `checklist` | `index.html` | CapsuleOnly | Pédagogie — absents VM panel |
| `ctx` menu Π=50 | `linux-mint-parity-index.json` | P2 | Menu contextuel apps secondaires — hors P0 shell |

---

## Références

- Statut clone : [inventaires/linux-mint-clone-status.md](inventaires/linux-mint-clone-status.md)
- État réplication : [inventaires/linux-mint-replication-state.json](inventaires/linux-mint-replication-state.json)
- Indice parité : [inventaires/linux-mint-parity-index.json](inventaires/linux-mint-parity-index.json)
- Audit GNOME vs Cinnamon : [inventaires/linux-mint-cinnamon-vs-gnome-audit.md](inventaires/linux-mint-cinnamon-vs-gnome-audit.md)
- Cloisonnement : [toolkit-cloisonnement-audit.md](toolkit-cloisonnement-audit.md)
