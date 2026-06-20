# Matrice diff Paramètres système — KDE neon User Edition (VM ↔ Capsule)

> **Statut** : polish par shot (2026-06-20) — crops focus ✓ · sidebar 11.35rem · 6 schémas / 5 Plasma  
> Parité globale : [`inventaire-parite-neon.md`](../inventaire-parite-neon.md)  
> Procédure : [`procedure-kde-settings.md`](../procedure-kde-settings.md)

Slot `themes`, gabarit `systemsettings_kde_neon.html`, chrome Breeze via `kde-systemsettings-nav.js` + `kde-settings-parity.js`.

## Fichiers source

| Rôle | Chemin |
|------|--------|
| Template HTML | `usr/share/capsuleos/linux/apps/systemsettings_kde_neon.html` |
| CSS base | `usr/share/capsuleos/linux/apps/style/systemsettings_kde.base.css` |
| CSS skin Neon | `home/Debian/KDE-Neon/style/apps/themes.skin.css` |
| Navigation / shots | `usr/lib/capsuleos/shells/linux/kde-systemsettings-nav.js` |
| Effets SeΣ | `usr/lib/capsuleos/shells/linux/kde-settings-parity.js` |
| Registre contrôles | `root/tools/lab/kde-settings-controls-registry.json` |
| Inventaire VM front | `root/docs/inventaires/linux-kde-neon-kde-settings-front-inventory.json` |
| Matrice visuelle 10 shots | `root/tools/lab/kde-settings-visual-investigation-matrix.json` |
| Captures VM | `bash root/tools/lab/vm-apps-visual-playbook.sh` · `collect-vm-apps-visual-investigation --ssh` |
| Theme-previews LnF | `bash root/tools/lab/pull-kde-neon-settings-theme-previews.sh` |
| Scheme / Plasma previews | `bash root/tools/lab/pull-kde-neon-color-scheme-previews.sh` · `extract-kde-settings-vm-tile-crops.mjs --write` |
| Crops focus Φ | `node usr/lib/capsuleos/tools/lab/compare-kde-settings-focus-crops.mjs --write` |
| Régions focus | `root/tools/lab/kde-settings-visual-focus-regions.json` |
| Captures Capsule | `root/docs/inventaires/captures/linux-kde-neon/apps-visual-capsule/themes/*-capsule.png` |
| Captures Capsule (regén.) | `node usr/lib/capsuleos/tools/lab/capture-capsule-kde-settings-views.mjs --id linux-kde-neon` |
| Smokes | `smoke-h6-kde-settings-ready.mjs` · `smoke-kde-settings-vm-parity.mjs` · `smoke-kde-settings-visual-parity.mjs` |

## Périmètre VM (inventaire 2026-06-20)

| Métrique | Valeur |
|----------|--------|
| Modules KCM totaux | 92 |
| Priorité P0 | 22 |
| Priorité P1 | 62 |
| Priorité P2 | 8 |

## Matrice 10 shots visuels P0 (KdV)

Seuil clôture : **Φ_norm ≥ 90** (`kde-settings-controls-registry.json`).

| # | shotId | Surface Capsule | Φ_norm (polish) | Focus crop min | Statut |
|---|--------|-----------------|-----------------|----------------|--------|
| 1 | `kcm-display-config` | `kcm-display` | 91.2 | — | ✅ |
| 2 | `hub-sidebar` | hub quick-settings | 85.3 | theme-previews ~88 | ⚠ sidebar + tuiles |
| 3 | `appearance-panel` | `kcm-lookandfeel` | 84.4 | theme-grid ~78 | ⚠ toolbar LnF |
| 4 | `accessibility-panel` | `kcm-access` | 89.2 | 90.6 | ⚠ proche |
| 5 | `desktop-panel` | `kcm-plasma-style` | 86.0 | plasma-grid ~83 | ⚠ |
| 6 | `workspace-panel` | hub workspace | 89.8 | — | ⚠ proche |
| 7 | `notifications-panel` | hub notifications | 89.8 | — | ⚠ proche |
| 8 | `applications-panel` | hub applications | 91.1 | — | ✅ |
| 9 | `colors-panel` | `kcm-colors` | 82.5 | colors-grid ~88 | ⚠ accent-row |
| 10 | `about-panel` | hub about | 88.8 | 89.2 | ⚠ proche |

## 22 modules P0 VM — couverture gabarit

| Module KCM | Couverture Capsule v15 | Priorité campagne |
|------------|------------------------|-------------------|
| `kcm_kscreen` | surface KCM dédiée | ✅ shot 1 |
| `kcm_lookandfeel` | surface KCM + hub | ✅ shot 3 |
| `kcm_access` | surface KCM | ✅ shot 4 |
| `kcm_desktoptheme` | surface KCM | ✅ shot 5 |
| `kcm_workspace` | hub panel | ✅ shot 6 |
| `kcm_notifications` | hub panel | ✅ shot 7 |
| `kcm_componentchooser` | hub panel | ✅ shot 8 |
| `kcm_colors` | surface KCM | ✅ shot 9 |
| `kcm_about-distro` | hub panel | ✅ shot 10 |
| `kcm_icons` | surface KCM `kcm-icons` | ✅ vague 2 |
| `kcm_wallpaper` | surface KCM `kcm-wallpaper` | ✅ vague 2 |
| `kcm_style` | surface KCM `kcm-style` | ✅ vague 2 |
| `kcm_fontinst` | surface KCM `kcm-fontinst` | ✅ vague 2 |
| `kcm_keyboard` | surface KCM `kcm-keyboard` | ✅ vague 2 |
| `kcm_keys` | surface KCM `kcm-keys` | ✅ |
| `kcm_mouse` | surface KCM `kcm-mouse` | ✅ vague 2 |
| `kcm_networkmanagement` | surface KCM `kcm-network` | ✅ vague 2 |
| `kcm_nightlight` | panneau display-config KCM | ✅ vague 2 |
| `kcm_powerdevilprofilesconfig` | surface KCM `kcm-power` | ✅ vague 2 |
| `kcm_regionandlang` | surface KCM `kcm-region` | ✅ vague 2 |
| `kcm_kwinoptions` | surface KCM `kcm-kwinoptions` | ✅ vague 2 |
| `kcm_kwin_virtualdesktops` | surface KCM `kcm-virtualdesktops` | ✅ vague 2 |

**Gap structurel** : ~38 entrées `data-kde-settings-stub` dans le gabarit — réduction progressive P0 hub → P1 KCM dédiés.

## Gates (campagne pivot)

```bash
export KDE_NEON_SSH=capsule@<ip-lab>   # etc/capsuleos/lab-inventory.json (gitignoré)
node usr/lib/capsuleos/tools/lab/collect-vm-kde-settings-inventory.mjs --id linux-kde-neon --write
bash root/tools/lab/pull-kde-neon-color-scheme-previews.sh
node usr/lib/capsuleos/tools/lab/extract-kde-settings-vm-tile-crops.mjs --write
python3 -m http.server 5500
CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/capture-capsule-kde-settings-views.mjs --id linux-kde-neon
node usr/lib/capsuleos/tools/lab/compare-kde-settings-focus-crops.mjs --write
node usr/lib/capsuleos/tools/lab/compare-apps-visual-investigation.mjs --id linux-kde-neon --filter P0 --write
node usr/lib/capsuleos/tools/lab/smoke-kde-settings-vm-parity.mjs
node usr/lib/capsuleos/tools/lab/verify-kde-settings-parity-chain.mjs --id linux-kde-neon
node usr/lib/capsuleos/tools/lab/smoke-h6-kde-settings-ready.mjs --id linux-kde-neon
CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/run-kde-neon-pass.mjs --write
```

## Écarts assumés (hors clôture shots P0)

| Écart | Priorité | Note |
|-------|----------|------|
| Prévisualisations thème VM | ✅ A | LnF preview.png + crops tuiles KCM (`SOURCE-VM-TILE-CROPS.txt`) |
| Grille Couleurs 6 schémas | ✅ | Ordre VM 4×2 · assets crop + `.colors` fallback |
| Style Plasma 5 thèmes | ✅ | air · default · breeze-light/dark · oxygen |
| Sidebar hub/KCM | ⚠ P1 | 11.35rem / 11.6rem — icônes subnav Qt vs SVG |
| Ligne accent Couleurs | ⚠ P1 | Swatches + select — drift Φ accent-row |
| Backend réseau / alimentation / polices | P2 | décoratif — pas de backend système |
| Propagation dérivés KDE | gelé | openSUSE · MX-KDE · Debian-KDE |

## Réouverture

Réouverture si Plasma System Settings change de layout, si inventaire VM > 22 P0, ou si `compare-apps-visual-investigation` drift sous Φ 90 sur shots non documentés.
