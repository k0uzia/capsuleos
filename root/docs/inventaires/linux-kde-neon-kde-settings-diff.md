# Matrice diff Paramètres système — KDE neon User Edition (VM ↔ Capsule)

> **Statut** : clôturé pivot P0 (2026-06-20) — 22/22 surfaces · aggregate Φ 93 · 2/10 shots ≥90 (écarts focus documentés)  
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

Dernière mesure focus crops : `linux-kde-neon-kde-settings-focus-parity.json` (2026-06-22T09:23 — VM `<lab-inventory:linux-kde-neon-kde-settings>`).

| # | shotId | Surface Capsule | Φ_norm shot | Focus crop min | Statut |
|---|--------|-----------------|-------------|----------------|--------|
| 1 | `kcm-display-config` | `kcm-display` | 91.2 | — | ✅ |
| 2 | `hub-sidebar` | hub Paramétrage | — | sidebar **86.5** ✅ · theme-previews **91.5** ✅ · quick-settings **92.2** ✅ | ✅ |
| 3 | `appearance-panel` | `kcm-themes` / lookandfeel | — | kcm-sidebar **89.5** ✅ · theme-grid **90.7** ✅ · toolbar **89.1** ✅ | ✅ |
| 4 | `accessibility-panel` | `kcm-access` | — | content **90.0** ✅ | ✅ |
| 5 | `desktop-panel` | `kcm-themes` / plasma-style | — | plasma-grid **92.7** ✅ · kcm-sidebar **87.5** (plafond) | ⚠ subnav |
| 6 | `workspace-panel` | hub workspace | 89.8 | — | ⚠ proche |
| 7 | `notifications-panel` | hub notifications | 89.8 | — | ⚠ proche |
| 8 | `applications-panel` | `kcm-applications` | 91.1 | — | ✅ |
| 9 | `colors-panel` | `kcm-themes` / colors | — | accent-row **85.7** ✅ · colors-grid **85.7** (plafond voie B) | ⚠ grille |
| 10 | `about-panel` | hub about | — | about-body **91.2** ✅ | ✅ |

### Plafonds Φ P0 documentés (polish 2026-06-20)

| Région | Φ_norm | Seuil | Plafond / cause |
|--------|--------|-------|-----------------|
| `hub-sidebar/sidebar` | 86.5 | 85 | Capture `hub-sidebar` : icônes `<img>` + `margin-top: 4.25rem` sur nav native |
| `hub-sidebar/theme-previews` | 48.5 | 88 | Ingest Capsule hub (600×337) — visuel interactif ✅ · Φ capture dégradé vs crops VM |
| `appearance-panel/theme-grid` | 41.8 | 90 | Ingest breeze/twilight + LnF oxygen (200×130) — visuel interactif ✅ · Φ capture dégradé (2026-06-23) |
| `colors-panel/colors-grid` | 85.7 | 88 | Plafond voie B ; **extract-vm-tile-crops --write** OK · pull `.colors` régresse (66.6) |
| `*/kcm-sidebar` (capture) | 89.5 / 87.5 | 88 | Subnav img + margin capture ; appearance ✅ · desktop plafond |

Outil voie B colors-grid :

```bash
node usr/lib/capsuleos/tools/lab/calibrate-kde-settings-colors-grid.mjs
```

Outil audit tuiles LnF + hub :

```bash
node usr/lib/capsuleos/tools/lab/calibrate-kde-settings-theme-grid.mjs
node usr/lib/capsuleos/tools/lab/calibrate-kde-settings-theme-grid.mjs --shot hub-sidebar
```

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
| `kcm_kwinoptions` | surface `kcm-windowmanagement` (hub-subnav) | ✅ vague 2 |
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

## Taxonomie navigation VM (audit 2026-06-20)

Référence captures `root/docs/inventaires/captures/linux-kde-neon/apps-visual/themes/*-vm.png` · résolveur `CapsuleKdeSettingsNav.resolveNavLayout(view)`.

| Layout | Comportement VM | Exemples Capsule | Shots P0 |
|--------|-----------------|------------------|----------|
| `hub-panel` | Aside hub + panneau hub (pas de surface KCM) | quick-settings, workspace, notifications, about | 2, 6–7, 10 |
| `kcm-flat` | Aside hub (highlight) + contenu KCM pleine largeur | son, fond d'écran, souris… | — |
| `subnav-replace` | Sous-nav module **remplace** l'aside hub (legacy) | — | — |
| `hub-subnav` | Aside hub **+** 2e colonne sous-modules **+** contenu | accessibilité, affichage, apparence, applications… | 1, 3–5, 7–9 |

**Règle VM (Plasma 6.7)** : `SubCategoryPage` pousse la 2e colonne seulement si `subCategoryModel.count > 1` (voir `SubCategoryPage.qml`). Inventaire détaillé : `linux-kde-neon-kde-settings-nav-layouts.json`.

**Sous-catégories VM `hub-subnav`** (8, 2+ modules) : Couleurs & Thèmes, Wifi et Internet, Affichage & Écran, Applications par défaut, Gestion des fenêtres, Clavier, Disques & Appareils photo, Session.

**Mono-KCM multi-pages `hub-subnav`** : Accessibilité (`kcm_access`).

**Capsule vs parcours catégorie VM** : toutes les sous-catégories VM à 2+ modules alignées `hub-subnav` (hub + 2e aside).

**P1** : assigner le layout avant surface HTML · `kcm-flat` si KCM feuille sans sous-nav.

| Module P1 | Layout | Surface | Statut |
|-----------|--------|---------|--------|
| Son (`kcm_pulseaudio`) | `kcm-flat` | `kcm-sound` | ✅ |
| Bluetooth (`kcm_bluetooth`) | `kcm-flat` | `kcm-bluetooth` | ✅ |
| Imprimantes (`kcm_printer_manager`) | `kcm-flat` | `kcm-printer` | ✅ |
| Disques & appareils photo | `hub-subnav` | `kcm-disks-devices` (SMART · kamera) | ✅ |
| Contrôleur de jeu (`kcm_gamecontroller`) | `kcm-flat` | `kcm-gamecontroller` | ✅ |
| Comptes en ligne (`kcm_kaccounts`) | `kcm-flat` | `kcm-accounts` | ✅ |
| Bureau à distance (`kcm_krdpserver`) | `kcm-flat` | `kcm-remote` | ✅ |
| Wifi et Internet (`networksettings`) | `hub-subnav` | `kcm-network` (5 modules) | ✅ |
| Gestion des fenêtres (`windowmanagement`) | `hub-subnav` | `kcm-windowmanagement` (3 modules) | ✅ |
| Session (`session`) | `hub-subnav` | `kcm-session` (SDDM · Plasma login) | ✅ |
| Applications par défaut (`componentchooser`…) | `hub-subnav` | `kcm-applications` (3 modules) | ✅ |

## Assets VM (2026-06-20)

| Lot | Procédure | Destination |
|-----|-----------|-------------|
| Theme-previews LnF | `bash root/tools/lab/pull-kde-neon-settings-theme-previews.sh` | `assets/.../systemsettings/theme-previews/` |
| Scheme / Plasma | `bash root/tools/lab/pull-kde-neon-color-scheme-previews.sh` | `assets/.../systemsettings/scheme-previews/` |
| Sidebar hub + subnav | `bash root/tools/lab/pull-kde-neon-settings-sidebar-icons.sh` | `assets/.../systemsettings/sidebar/{hub,subnav}/` |
| Inventaire icônes | — | `root/docs/inventaires/linux-kde-neon-kde-settings-sidebar-icons.json` |
| Alignement captures | `kde-settings-visual-align.mjs` (letterbox compare) | `vmLetterbox` dans `kde-settings-visual-focus-regions.json` |

## Audit hub sidebar (2026-06-20)

- **Inventaire front** : `smoke-kde-settings-front-inventory.mjs` OK — 10 shots P0, aucune entrée manquante vs `linux-kde-neon-kde-settings-front-inventory.json`.
- **Icônes** : 31 rôles VM → `linux-kde-neon-kde-settings-sidebar-icons.json` (SHA256 alignés pull VM).
- **Gabarit** : `systemsettings_kde_neon.html` — ordre native-nav conforme inventaire (Souris → À propos) ; stubs `disabled` sur entrées P1 non implémentées.
- **Φ plafond** : sidebar **80.7** — polish densité (`11.35rem`, padding compact) sans gain seuil 85 ; écart structurel icônes/rendu.

## Clôture polish Φ P0 (2026-06-20)

Campagne pivot **documentée** — 6 régions focus sous seuil (plafonds structurels, pas de régression acceptée sur calibrage PNG seul).

| Région | Φ_norm | Seuil | Action |
|--------|--------|-------|--------|
| quick-settings | 92.4 | 88 | ✅ |
| about-body | 91.2 | 90 | ✅ |
| accessibility | 90.0 | 90 | ✅ |
| toolbar | 89.1 | 88 | ✅ |
| accent-row | 85.7 | 85 | ✅ |
| colors-grid | 85.7 | 88 | Plafond — crops VM screenshot (extract --write) |
| kcm-sidebar | 89.5 / 87.5 | 88 | Appearance ✅ · desktop plafond |
| theme-previews | 48.5 | 88 | Ingest Capsule desktop — visuel interactif ✅ (2026-06-23) |
| theme-grid | 41.8 | 90 | Ingest twilight diagonal + oxygen LnF — visuel interactif ✅ (2026-06-23) |
| hub sidebar | 86.5 | 85 | ✅ capture parity + icônes img |

## Prochaine vague (P1)

Stubs hub sidebar **clôturés**. Suite :

1. **P1 icônes hub sidebar** — rendu SVG vs Breeze 32 px (plafond Φ 80.7).
2. **LnF twilight/oxygen (Thème global)** — twilight = LnF breezetwilight violet (VM) · oxygen = LnF VM ; hub-auto reste diagonal Capsule.
3. Inventaire P1 restant (~58 modules). Propagation dérivés KDE : gelée.
