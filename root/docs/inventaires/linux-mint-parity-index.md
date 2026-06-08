# Indice de parité interactionnelle — Linux Mint (Π)

**Registry** : `linux-mint` · **VM** : `capsule@192.168.1.146` (Mint 22.3 Zena)

L'indice mesure la **fidélité interactionnelle** (pas seulement l'ouverture de slot) entre la VM modèle et CapsuleOS `home/Debian/Mint/`.

## Fichiers

| Fichier | Rôle |
|---------|------|
| [`linux-mint-parity-index.json`](linux-mint-parity-index.json) | Scores Π par app et shell |
| [`linux-mint-replication-state.json`](linux-mint-replication-state.json) | État campagne réplication |
| [`interactions/linux-mint/<slot>.json`](interactions/linux-mint/) | Inventaires interactions par app |
| [`linux-mint-ui-state-effects-matrix.json`](linux-mint-ui-state-effects-matrix.json) | Matrice effets UI shell + apps |

## Dimensions (Π_app)

| Symbole | Périmètre |
|---------|-----------|
| **Π_vis** | Chrome, layout, icônes, géométrie |
| **Π_nav** | Menus barre, sous-menus, navigation |
| **Π_int** | Boutons, inputs, toggles, listes |
| **Π_ctx** | Clic droit, popovers, modales, toasts |
| **Π_kb** | Raccourcis clavier |
| **Π_data** | État initial, contenu démo cohérent VM |

**Π_app** = moyenne des six dimensions · **Π_global** = moyenne pondérée (shell 25 %, apps 75 %).

## Statuts

| Score | Statut |
|-------|--------|
| ≥ 90 | `ok` — parité interactionnelle |
| 60–89 | `partiel` — slot utilisable, lacunes |
| < 60 | `absent` — interaction majeure manquante |

## Outils

```bash
# Inventaire interactions (template + doc VM)
node usr/lib/capsuleos/tools/lab/collect-app-interaction-inventory.mjs --id linux-mint --slot nemo --write

# Passe Playwright + mise à jour Π
node usr/lib/capsuleos/tools/lab/run-app-parity-pass.mjs --id linux-mint --slot nemo --write

# Priorité P0 (nemo, firefox, xed, calc, file_roller, update_manager, mintinstall, themes)
node usr/lib/capsuleos/tools/lab/run-app-parity-pass.mjs --id linux-mint --priority --write

# Matrice effets UI
node usr/lib/capsuleos/tools/lab/extend-ui-state-effects-matrix.mjs --write

# Passe shell + apps
node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --apps nemo,calculator

# Initialiser / régénérer baselines
node usr/lib/capsuleos/tools/lab/seed-mint-parity-index.mjs --write
```

**Prérequis** : `python3 -m http.server 5500 --bind 127.0.0.1` · Playwright Chromium.

## Procédure autonome (par app)

1. `collect-app-interaction-inventory.mjs --slot X --write`
2. Lire doc VM (`linux-mint-*-vm.md` si présent)
3. Audit gaps Π_nav / Π_int / Π_ctx
4. Brancher noyau (`contentLoader`, behaviors) — pas de fork toolkit
5. Smoke enrichi + `run-app-parity-pass --write`
6. Mettre à jour ce fichier et [`linux-mint-apps-alphabetique.md`](linux-mint-apps-alphabetique.md)
7. `sync-all-views.mjs` · `validate-all.mjs` · commit pallier

## Priorité campagne v2

1. **P0** : `nemo`, `firefox`, `text_editor`, `calculator`, `file_roller`
2. **P1** : `update_manager`, `mintinstall`, `themes`
3. Catalogue alphabétique : apps avec **Π_app < 90**

### Snapshot pallier 4 (2026-06-08)

**Π_global** : 67 (`partiel`)

| Slot | Π_app | Statut |
|------|-------|--------|
| nemo | 100 | ok |
| firefox | 100 | ok |
| text_editor | 92 | ok |
| calculator | 100 | ok |
| file_roller | 92 | ok |
| update_manager | 75 | partiel |
| mintinstall | 75 | partiel |
| themes | 100 | ok |
| baobab | 83 | partiel |
| bulky | 75 | partiel |
| drawing | 83 | partiel |
| font_viewer | 83 | partiel |
| gnome_disks | 75 | partiel |
| gucharmap | 67 | partiel |
| hypnotix | 67 | partiel |

## Patterns noyau extraits (campagne)

| Pattern | Module |
|---------|--------|
| Menubar GTK explorateur | `fileExplorerHeader.js` → `bindFileExplorerMenubar` |
| Menu contextuel Nemo | `fileExplorerContextMenu.js` → `bindFileExplorerContextMenu` |
| Mode popover calculatrice | `calculator.js` + gabarit `calculator.html` |
| Dialogues find/replace/goto xed | `text-editor.js` + `#xed-find-dialog` |
| Gabarit Logithèque | `mintinstall.html` + `mintinstall.js` |
| Cinnamon Settings shell | `cinnamon_settings.html` + `build-linux-embed.mjs` override `themes` |
| Panneau Thèmes `#themesApp` | `cinnamon-settings.js` + popover Mint-Y `themes.js` |
| Baobab / Bulky noyau | `baobab.js` / `bulky.js` + gabarits source |
| Menu Firefox + Ctrl+T/L | `firefoxBrowser.js` |
| F9 panneau Nemo | `nemo-sidebar-controls.js` |
| Disques (gnome-disks) | `gnome-disks.js` |
