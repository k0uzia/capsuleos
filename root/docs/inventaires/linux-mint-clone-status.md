# Statut clone — linux-mint (référence gold)

Procédure : [`procedure-clonage-os-depuis-vm.md`](../procedure-clonage-os-depuis-vm.md) · Checklist : [`templates/clone-os-checklist.md`](../templates/clone-os-checklist.md)

**registryId** : `linux-mint` · **vendor** : `mint` · **toolkit** : `cinnamon`  
**Dernière campagne** : 2026-06-08 — **ManΣ + passe intégration** ([`integration-pass-2026-06-08.json`](../../../proc/linux-mint/integration-pass-2026-06-08.json))

**Campagne v2 (en cours)** : **réplique exacte VM modèle** — périmètre = tout ce qui est sur `capsule@192.168.1.146` ; état formel : [`linux-mint-replication-state.json`](linux-mint-replication-state.json). CapsuleOnly et P1 permanents **hors clôture**.

**Ground truth** : [`linux-mint-vm.json`](linux-mint-vm.json) · [`inventaire-parite-mint-vm.md`](../inventaire-parite-mint-vm.md)

---

## Phase 0 — Prérequis

- [x] VM accessible en SSH (`lab-inventory.json` local)
- [x] `validate-all.mjs` baseline vert
- [x] `print-agent-brief.mjs linux-mint` disponible

## Phase 1 — Discovery

- [x] `collect-mint-inventory.mjs --write-doc` (inventaire frais)
- [x] `linux-mint-vm.json` + rapport parité enrichi

## Phase 2 — Catalogue

- [x] `linux-mint` **active** dans `os-registry.json` (22 actives)
- [x] `etc/capsuleos/profiles/linux-mint.json` + `home/Debian/Mint/` + façade `<base href>`
- [x] `profile-data.js` 22.3 Zena + `stackLine` composants VM

## Phase 3 — Assets

- [x] **ManΣ** (2026-06-08) : manifeste approuvé, staging 157 fichiers, import playbook `pull=0`
- [x] `vendors/mint/panel/` (nemo, firefox, terminal, xed) + **41** fonds `linuxmint/`
- [x] `validate-asset-zones.mjs` OK

## Phase 4 — Shell / panel

- [x] Noyau panel partagé (running-link, window-list, effets Cinnamon)
- [x] `run-capsule-panel-browser` CapsuleOS **6/6**
- [x] `compare-os-parity` VM documenté (étapes 1/4 = P1 lab si échec)

## Phase 5 — Applications

- [x] Favoris VM (xed, mintinstall, cinnamon-settings, …)
- [x] `build-linux-embed.mjs` (8 skins)

## Phase 6 — FS pédagogique

- [x] Sidebar Nemo Documents (comparateur étape 5)
- [x] Pas de regen manifest requis (`home/public` inchangé)

## Phase 7 — Clôture

- [x] `validate-all.mjs` vert
- [x] `briefs/linux-mint.md` généré
- [x] Cette checklist cochée — **procédure validée pour réplication OS**

---

## Parité visuelle Mint-Y-Dark-Aqua (2026-06-04)

- [x] Tokens dédiés `home/Debian/Mint/style/mint-y-dark-aqua-tokens.css` (accent `#1f9ede`, menu `#222226`, sélection `#303036`, panel `#2e2e33`)
- [x] Menu / panel / Alt+Tab / terminal / raccourcis bureau alignés VM (plus de vert `#5abc3b` / `#87cf3e` hérité des variables globales)
- [x] `build-linux-embed.mjs` + `validate-all` + `smoke-mint-interaction.mjs` OK

## Catalogue applications (passe alphabétique)

- [x] Inventaire VM : **101** entrées menu visibles → [`linux-mint-apps-alphabetique.md`](linux-mint-apps-alphabetique.md)
- [x] **#2 Calculatrice** — `calculator` (GNOME, mode De base, smoke OK)
- [x] **#3 Capture d'écran** — `screenshot` (GNOME Screenshot, smoke OK)
- [x] **#4 Dessin** — `drawing` (Drawing / mao, smoke OK)
- [x] **#7 Firefox** — P0 barre Muffin + P1 New Tab Proton, icônes toolbar, multi-onglets — [`linux-mint-firefox-vm.md`](linux-mint-firefox-vm.md) · `smoke-mint-firefox.mjs`
- [x] **#8 Gestionnaire d'archives** — analyse VM [`linux-mint-file-roller-vm.md`](inventaires/linux-mint-file-roller-vm.md), slot `file_roller`, smoke `smoke-mint-file-roller.mjs`
- [x] **#9 Gestionnaire de mises à jour** — analyse VM [`linux-mint-update-manager-vm.md`](inventaires/linux-mint-update-manager-vm.md), écran d'accueil + état à jour, smoke `smoke-mint-update-manager.mjs`
- [x] **#8 Gestionnaire d'archives** — `file_roller`, smoke `smoke-mint-file-roller.mjs` OK (2026-06-08)
- [x] **#10 Gestionnaire de pilotes** — `mintdrivers`, smoke `smoke-mint-mintdrivers.mjs` OK (2026-06-08)
- [x] **#11 Lecteur vidéo** — `lecteur_multimedia` / Celluloid, smoke `smoke-mint-celluloid.mjs` OK (2026-06-08)
- [x] **#12 LibreOffice Calc** — `librecalc`, smoke `smoke-mint-librecalc.mjs` OK (2026-06-08)
- [x] **#13 LibreOffice Writer** — `librewriter`, smoke `smoke-mint-librewriter.mjs` OK (2026-06-08)
- [x] **#14 Logithèque** — slot `mintinstall` dédié (≠ `update_manager`), smoke `smoke-mint-mintinstall.mjs` OK (2026-06-08) · [`linux-mint-mintinstall-vm.md`](linux-mint-mintinstall-vm.md)
- [x] **#16 Paramètres du système** — slot `themes` / cinnamon-settings 6.6 (30 panneaux, recherche, thèmes VM), smoke `smoke-mint-cinnamon-settings.mjs` OK (2026-06-08)
- [x] **#19 Visionneur d'images** — xviewer 3.0, smoke `smoke-mint-xviewer.mjs` OK (2026-06-08)
- [x] **#20 Visionneur de documents** — xreader 4.0, smoke `smoke-mint-xreader.mjs` OK (2026-06-08)
- [x] **#21 Analyseur d'espace disque** — `baobab`, smoke `smoke-mint-baobab.mjs` OK (2026-06-08)
- [x] **#22–31 Batch XApp** — `webapp_manager`, `sticky`, `warpinator`, `hypnotix`, `transmission`, `mintbackup`, `bulky`, `timeshift`, `thunderbird`, `mintwelcome` — smoke `smoke-mint-p4-batch.mjs` OK (2026-06-08)
- [ ] Reproduction **une app par passe** (suite catalogue #32+) — [`linux-mint-apps-alphabetique.md`](linux-mint-apps-alphabetique.md)
- Outil : `node usr/lib/capsuleos/tools/lab/generate-mint-apps-catalog.mjs --write`

## Passe parité panel + menu (2026-06-08 PM)

- [x] **Icônes menu** : 97/97 chargées (symlinks `.svg`/`.png` sur assets ManΣ + extensions dans `mainMenu-data-cinnamon.js`)
- [x] **Panel** : séparateur Cinnamon après menu, logo circulaire, tray 24px, favoris 22px
- [x] **Menu** : tokens Mint-Y-Dark-Aqua, libellés FR, géométrie sidebar/catégories/apps
- [x] Captures : `capture-mint-panel-menu.mjs --compare` → `captures/linux-mint/20260608-104657/`
- [x] Captures post-géométrie (`430cfcb`) : `captures/linux-mint/20260608-143806/` · baseline clone `clone-baseline/` · métriques dans `linux-mint-parity-index.json` (layoutMetrics shell)
- [x] **Zéro compromis** panel/menu (2026-06-08) : proportions VM strictes 600px · 20/25/55 %, ellipsis comme `baseline/`, favoris tray VM (gap `head/14`, box 121px) — compromis c3ee064 **annulé** · `captures/linux-mint/20260608-144804/`
- [x] **Fidélité live :5501** (2026-06-08) : cache-bust `style.css?v=20260608shell`, `mainMenu.skin.css` dans `imports.css`, `CAPSULE_FORCE_APP_EMBED` + `CAPSULE_SKIN_CSS_VERSION` — `run-capsule-panel-browser` 6/6 sur `:5501` · `captures/linux-mint/20260608-5501-fix/`
- [x] Checklist panel **6/6** VM + Capsule (`compare-os-parity --capsule-json`)

## Panel / menu v3 rewrite (2026-06-08)

- [x] **Strip** : `footer.css` + `panel-windows.css` supprimés (doublons, héritage portal `--taskbar-height`)
- [x] **Panel** : module unique `mint-panel.css` — régions sémantiques `mint-panel__*` (menu, séparateur, window-list, tray, favoris)
- [x] **Tokens** : `--mint-panel-height: 40px` explicite dans `mint-y-dark-aqua-tokens.css` (pas portal 1.25×)
- [x] **Menu** : `mainMenu.skin.css` réécrit — grille CSS 600×480 · 20/25/55 % · gap 2px ; `mint-menu-parity.js` data-only
- [x] **Noyau** : `CAPSULE_STATIC_SKIN_SLOTS` + skip `mainMenu.base.css` embed (évite double injection CSS)
- [x] **Adaptateurs** : `mint-panel-favorites.js` (créé) + `mint-tray.js` inchangés — `openWindowByDataLink` noyau
- [x] `run-capsule-panel-browser` **6/6** sur `:5501` · `validate-all` vert · `sync-all-views` OK

## Campagne v2 — shell panel (2026-06-08)

- [x] Panel : **menu + grouped-window-list** (lanceurs fixes / checklist / accueil retirés)
- [x] Applet **favoris** tray (5 favoris bureau VM)
- [x] Minimize → `capsuleRunning` + entrée grouped-list minimisée
- [x] Smokes panel : `run-capsule-panel-browser.mjs` **6/6**
- [x] Panel VM : **6/6** (sonde lab — 2026-06-08)

## Campagne v2 — objets modaux (P2)

- [x] Matrice bootstrap **VΣ** — [`linux-mint-ui-state-effects-matrix.json`](linux-mint-ui-state-effects-matrix.json) (8 surfaces shell P0/P1)
- [x] Collecte burst VM + prédicats Ve/Vμ/VΣ (`run-ui-state-effects-pass.mjs --write`, capsuleMatch partial)

## Zone de notification (2026-06-04)

- [x] Tous les applets tray en `<button>` (22px / `--mint-tray-item-size`, ordre VM)
- [x] Popovers : XApp, notifications, imprimantes, amovibles, clavier, réseau, volume, alimentation
- [x] Coin bureau : masquer / restaurer les fenêtres
- [x] `content/mint-tray.js` + `smoke-mint-tray.mjs` OK

---

## Écarts assumés (P1 / hors scope)

- Lanceurs fixes vs `grouped-window-list` Cinnamon
- Calculatrice → terminal/menu
- Firefox focus / minimize en lab VM (P1)
- Applet grouped-window-list natif, multi-écrans : hors scope
