# Statut clone — linux-mint (référence gold)

Procédure : [`procedure-clonage-os-depuis-vm.md`](../procedure-clonage-os-depuis-vm.md) · Checklist : [`templates/clone-os-checklist.md`](../templates/clone-os-checklist.md)

**registryId** : `linux-mint` · **vendor** : `mint` · **toolkit** : `cinnamon`  
**Dernière campagne** : 2026-06-04 — **recréation procédure clonage** (validation bout en bout)

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

- [x] `vendors/mint/panel/` + `default_background.jpg`
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
- [ ] Reproduction **une app par passe** (suite : #10) — [`linux-mint-apps-alphabetique.md`](linux-mint-apps-alphabetique.md)
- Outil : `node usr/lib/capsuleos/tools/lab/generate-mint-apps-catalog.mjs --write`

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
