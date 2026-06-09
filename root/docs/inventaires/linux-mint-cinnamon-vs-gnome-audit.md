# Audit Cinnamon vs GNOME — Linux Mint

> **Date** : 2026-06-08 · **Périmètre** : `linux-mint` (skin `home/Debian/Mint/`)  
> **Paradigme** : [paradigme-toolkit-cinnamon.md](../paradigme-toolkit-cinnamon.md)

---

## 1. Synthèse

| Zone | État avant | Action | État après |
|------|------------|--------|------------|
| `skin.profile.json` / `linux-mint.json` | Déjà `toolkit: cinnamon` | + `desktopEnvironment` 6.6 | OK |
| `os-registry.json` | `toolkit.cinnamon` sans version DE | + `desktopEnvironment` | OK |
| `mainMenu-data-cinnamon.js` | 95× `toolkits/gnome/apps` | → `toolkits/cinnamon/apps` | OK |
| `mint-menu-parity.js` | 10× `toolkits/gnome/apps` | → `toolkits/cinnamon/apps` | OK |
| `index.html` (preload catalog) | 12× chemins gnome/apps | → cinnamon/apps | OK |
| Pack assets menu | Icônes sous `gnome/apps/` seul | Symlinks `cinnamon/apps/` (111) | OK |
| `imports.css` | Pas de skins apps dédiés | + themes/calculator/terminal/screenshot | OK |
| `themes.skin.css` | Classes `gnome-settings-wallpaper` | Alias `cinnamon-settings-wallpaper` | OK |
| `window-chrome-contexts.json` | Cinnamon isolé de GNOME | Inchangé (déjà correct) | OK |
| `contentLoader.js` | Branches Cinnamon panel menu | Inchangé | OK |
| `explorer-toolkit-paths.js` | Défaut cinnamon pour Mint | Inchangé | OK |
| `generate-mint-menu-data.mjs` | Résolution gnome-first | cinnamon-first | OK |
| Gates | Scripts absents | `validate-toolkit-paradigm`, `validate-clone-assets`, `print-validation-plan` | OK |

**Ubuntu / Rocky / Fedora** : non touchés — conservent `toolkit: gnome`, `nemo-gnome`, `toolkits/gnome/apps/dash|overview`.

---

## 2. Inventaire grep — fuites GNOME corrigées

### `home/Debian/Mint/`

| Fichier | Pattern | Correction |
|---------|---------|------------|
| `content/mint-menu-parity.js` | `./assets/images/toolkits/gnome/apps/*` | → `cinnamon/apps` |
| `index.html` | preload `#mint-catalog-asset-refs` | → `cinnamon/apps` |
| `style/apps/themes.skin.css` | `gnome-settings-wallpaper` | alias cinnamon + import statique |
| `style/imports.css` | — | skins apps Cinnamon ajoutés |

### `usr/lib/capsuleos/`

| Fichier | Pattern | Correction |
|---------|---------|------------|
| `shells/linux/mainMenu-data-cinnamon.js` | 95 refs gnome/apps | → cinnamon/apps |
| `tools/lab/generate-mint-menu-data.mjs` | `resolveIcon` gnome-first | cinnamon-first |
| `shells/linux/fileExplorer/explorer-icon-base.js` | remap gnome/elements/nemo | + cinnamon/elements/nemo |

### `etc/capsuleos/`

| Fichier | État |
|---------|------|
| `profiles/linux-mint.json` | `toolkit.cinnamon`, `nemo`, + `desktopEnvironment` |
| `contracts/window-chrome-contexts.json` | `cinnamon` : `nemo`, `cinnamon-window-behaviors.js` |
| `os-registry.json` | entrée `linux-mint` alignée |

---

## 3. Déjà conformes (pas de patch requis)

- `skin.profile.json` : `extends: kernel:linux/branch:mint/toolkit:cinnamon`
- `CAPSULE_EXPLORER_TEMPLATE: nemo` (pas `nemo-gnome`)
- `CAPSULE_STATIC_SKIN_SLOTS: ["mainMenu"]` + `mainMenu.skin.css`
- `cinnamon-window-behaviors.js`, `cinnamon-settings.js` chargés dans `index.html`
- Cluster CSS `toolkit-cinnamon/variables.css` + `chrome.css` dans `imports.css`
- Nemo skin : tokens `--nemo-*`, pas `nautilusChromeMode`
- Pas de `overview.js` / dash GNOME sur Mint

---

## 4. Exceptions documentées (légitimes)

Ces références **GNOME** restent volontaires sur Mint :

| Référence | Fichier(s) | Justification |
|-----------|------------|---------------|
| `terminal-window--gnome`, `gnome-terminal-header__*` | `style/apps/terminal.skin.css` | Mint shippe **gnome-terminal** (GTK, pas Ptyxis) |
| `--gnome-calc-*`, `#gnomeCalculatorApp` | `style/apps/calculator.skin.css` | Gabarit partagé org.gnome.Calculator |
| `--gnome-shot-*`, `#gnomeScreenshotApp` | `style/apps/screenshot.skin.css` | Gabarit partagé org.gnome.Screenshot |
| `org.gnome.Calculator.webp`, `org.gnome.Calendar.webp` | `vendors/mint/panel/`, raccourcis bureau | Noms fichiers VM (Adwaita/Mint-Y) |
| `data-link="gnome_disks"`, `gnome-disks.js` | `index.html` | App **Disques** (ID upstream GNOME) |
| `.gnome-settings-wallpaper` dans `themes.js` | noyau partagé | Mint skin alias `.cinnamon-settings-wallpaper` ; pas de `themes_gnome.html` |
| Apps `org.gnome.*` dans menu | icônes cinnamon/apps (symlinks) | Apps GTK installées sur Mint ; **chemin** cinnamon, pas gnome toolkit |

**Interdit** (gate `validate-toolkit-paradigm.mjs`) :

- `toolkits/gnome/apps` dans skin Mint ou `mainMenu-data-cinnamon.js`
- `toolkit: gnome` dans profils Mint
- `nemo-gnome`, `themes_gnome.html`, `mainMenu-data.js` (générique GNOME)

---

## 5. Assets — répartition packs

| Pack | Rôle Mint |
|------|-----------|
| `toolkits/cinnamon/header/` | Boutons fenêtre Muffin |
| `toolkits/cinnamon/elements/nemo/` | Toolbar/sidebar Nemo |
| `toolkits/cinnamon/apps/` | Lanceurs menu Cinnamon (symlinks → VM) |
| `toolkits/gnome/apps/dash|overview/` | **Non utilisé** par Mint (Ubuntu uniquement) |
| `vendors/mint/panel/` | Icônes panel / favoris |
| `icons/cinnamon/` | Nemo + cinnamon-settings |

Commande sync : `node usr/lib/capsuleos/tools/linux/sync-cinnamon-app-icons.mjs`

---

## 6. Documentation / skills

| Fichier | Mise à jour |
|---------|-------------|
| `root/docs/paradigme-toolkit-cinnamon.md` | Créé |
| `root/skills/os-linux/SKILL.md` | Section Cinnamon vs GNOME |
| `.cursor/rules/capsuleos-agent-onboarding.mdc` | Renvoi paradigme Mint |

---

## 7. Cloisonnement multi-DE (2026-06-08)

Audit étendu Rocky/Ubuntu/KDE + réparation menu contextuel Nautilus GNOME (régression `00816fb`) :

- Matrice DE : [paradigme-toolkit-de.md](../paradigme-toolkit-de.md)
- Rapport cloisonnement : [toolkit-cloisonnement-audit.md](toolkit-cloisonnement-audit.md)
- Fix : `fileExplorerContextMenu.js` — dispatch `bindNautilusGnomeContextMenu` (Rocky/Ubuntu) vs `bindNemoContextMenu` (Mint)

**Cause Rocky** : le passage Mint v2 a remplacé le menu Nautilus HTML (`#nemo-context-menu`) par le menu Nemo dynamique sans garde toolkit.

---

## 8. Validation post-patch

```bash
node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --all
node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --id linux-mint
node usr/lib/capsuleos/tools/validate-clone-assets.mjs --id linux-mint
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
node usr/lib/capsuleos/tools/lab/smoke-gnome-nautilus-interactions.mjs --profile=linux-rocky
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 node usr/lib/capsuleos/tools/lab/run-capsule-panel-browser.mjs
```
