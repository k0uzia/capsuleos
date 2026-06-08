# Audit cloisonnement toolkits — GNOME / Cinnamon / KDE

> **Date** : 2026-06-08 · **Passe** : recette clone Mint intégrale  
> **Paradigme** : [paradigme-toolkit-de.md](paradigme-toolkit-de.md) · Cinnamon : [paradigme-toolkit-cinnamon.md](paradigme-toolkit-cinnamon.md)  
> **Recette** : [recette-clone-mint-integral.md](recette-clone-mint-integral.md)

---

## 1. Score synthèse

| Métrique | Valeur |
|----------|--------|
| **Score cloisonnement global** | **94 / 100** |
| Gates `validate-toolkit-paradigm --all` | ✅ 4/4 (mint, rocky, ubuntu, debian-kde) |
| Cross-contamination grep Rocky/Ubuntu | ✅ 0 référence Mint |
| Menu contextuel Nautilus Rocky | ✅ restauré (régression 00816fb) |
| Écarts P2 résiduels | 2 (chemins CSS physiques, exceptions GTK documentées) |

---

## 2. Conformes par zone

### Skin Mint (`home/Debian/Mint/`)

| Élément | Module / chemin | Gate |
|---------|-----------------|------|
| Embed apps | `contentLoader.js` — `CINNAMON_PANEL_MENU_SKINS`, `CAPSULE_FORCE_APP_EMBED` | validate-all |
| Menu données | `mainMenu-data-cinnamon.js` — `toolkits/cinnamon/apps` | paradigm `--id linux-mint` |
| Panel CSS | `mint-panel.css` — pas de portal `footer.css` | imports.css |
| Tokens panel | `--mint-panel-height: 40px` → `--taskbar-height` | mint-y-dark-aqua-tokens.css |
| Nemo template | `CAPSULE_EXPLORER_TEMPLATE: nemo` | skin.profile.json |
| WM Muffin | `cinnamon-window-behaviors.js` — `isMintDesktop()` | window-chrome-contexts |
| Alt+Tab | `cinnamon-alt-tab.js` — garde Mint | index.html |
| Tray | `content/mint-tray.js` — skin hook, noyau `volume.js` partagé | smoke-mint-tray |
| Assets | `./assets/images/toolkits/cinnamon/`, `vendors/mint/` | validate-clone-assets |
| Bureau clic droit | `desktop-context-menu.js` — `body#mint` uniquement | paradigm |

### Noyau explorateur

| Fichier | Branche Cinnamon | Branche GNOME | Branche KDE |
|---------|------------------|---------------|-------------|
| `explorer-icon-base.js` | `CINNAMON_BASE` défaut | `usesGnomeAdwaita()` / Yaru | `usesKdeIcons()` |
| `fileExplorerCore.js` | `isNemoTemplate()` | `isNautilusGnomeTemplate()` | `isDolphinTemplate()` |
| `fileExplorerContextMenu.js` | `bindNemoContextMenu` | `bindNautilusGnomeContextMenu` | — |
| `fileExplorerNautilus*.js` | non chargé Mint | chargé Rocky/Ubuntu | non chargé |

**Dispatch menu contextuel** (`bindFileExplorerContextMenu`) :

```text
isNautilusGnome() ? bindNautilusGnomeContextMenu : bindNemoContextMenu
```

### Skins GNOME (Rocky, Ubuntu, Fedora)

- `toolkits/gnome/` — icônes dash/overview
- `nemo-gnome` template + `shell-gnome.html` + `#nemo-context-menu`
- `gnome-window-behaviors.js` — pas de garde Mint
- **Aucune** réf. `mint-panel`, `mainMenu-data-cinnamon`, `cinnamon-window-behaviors`

### Skins KDE

- `dolphin` template, `toolkits/kde`, `icons/kde`
- Pas de `nautilus-app` ni `cinnamon` dans `home/Debian/Debian-KDE/`

---

## 3. Non-conformes détectés (passe 2026-06-08)

| Anti-pattern | Où | Impact | Statut |
|--------------|-----|--------|--------|
| Menu Nautilus supprimé (00816fb) | `fileExplorerContextMenu.js` | Clic droit Rocky cassé | ✅ **Réparé** — branche `isNautilusGnome()` |
| `toolkits/gnome/apps` dans Mint | menu + preload | Icônes GNOME sur menu Cinnamon | ✅ **Corrigé** b5e39bc |
| Portal CSS `--taskbar-height` 1.25×head | thèmes global | Panel Mint trop haut | ✅ **Mitigé** — alias `--mint-panel-height` |
| Chemins physiques `../../../../usr/` en CSS | Mint `windows.css`, chrome, firefox | Contourne CapsuleResource | ⚠️ P2 — documenté, non bloquant |
| Classes `gnome-*` sur terminal/calc/screenshot | skins apps Mint | Confusion toolkit | ✅ Exception légitime (apps GTK upstream) |
| Slots `librewriter`, `checklist` | Mint `index.html` | Absents VM | ✅ CapsuleOnly pédagogie |
| WM logic dupliquée dans `home/` | — | Dette fork | ✅ Absent — WM dans noyau uniquement |

---

## 4. Cross-check — Mint ne doit pas affecter Rocky/Ubuntu

```bash
# Aucun match attendu dans skins GNOME :
rg 'home/Debian/Mint|mint-panel|mainMenu-data-cinnamon' home/RedHat/Rocky home/Debian/Ubuntu
```

**Résultat passe 2026-06-08** : ✅ 0 occurrence.

Inverse (GNOME dans Mint) bloqué par :

```bash
node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --id linux-mint
```

---

## 5. Cause racine — régression menu Nautilus (Rocky)

| Commit | Changement | Effet |
|--------|------------|-------|
| `80b09be` | Menu Nautilus GNOME complet | OK Rocky |
| `00816fb` | Menu Nemo dynamique Mint sans garde GNOME | **Clic droit Rocky cassé** |
| Fix 2026-06-08 | `bindFileExplorerContextMenu` dispatch | Restauré |

**Symptôme** : `#nemo-context-menu` présent mais `contextInit: false` sur Rocky.  
**Leçon** : toute évolution menu explorateur **doit** préserver la branche `isNautilusGnome()`.

---

## 6. Gates recommandés

```bash
node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --all
node usr/lib/capsuleos/tools/validate-clone-assets.mjs --id linux-mint
node usr/lib/capsuleos/tools/validate-toolkit-chrome-isolation.mjs   # via validate-all
node usr/lib/capsuleos/tools/validate-skin-vendor-isolation.mjs      # via validate-all
node usr/lib/capsuleos/tools/lab/smoke-gnome-nautilus-interactions.mjs --profile=linux-rocky  # non-régression Rocky
node usr/lib/capsuleos/tools/validate-all.mjs
```

---

## 7. Non-régression Mint

- Menu Nemo Cinnamon (dynamique, 7 entrées) sur `bindNemoContextMenu` — **pas** le menu Nautilus HTML.
- Panel/menu pixel-perfect (fbf2d12) non régressé : `run-capsule-panel-browser` 6/6, `compare-os-parity` 6/6.
