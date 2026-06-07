# Inventaire parité — KDE neon User Edition VM → CapsuleOS

> Collecte VM : 2026-06-06 · Registre : `linux-kde-neon`  
> **HIG KDE** : [kde-hig-ressources.md](kde-hig-ressources.md) · branche : [branche-plasma-kde.md](branche-plasma-kde.md)  
> Inventaire : [`inventaires/linux-kde-neon-vm.json`](inventaires/linux-kde-neon-vm.json)  
> **Clôture Discover** : [`inventaires/linux-kde-neon-discover-closure.md`](inventaires/linux-kde-neon-discover-closure.md)  
> **Clôture Kickoff** : [`inventaires/linux-kde-neon-kickoff-closure.md`](inventaires/linux-kde-neon-kickoff-closure.md)  
> **Clôture Panel + tray** : [`inventaires/linux-kde-neon-panel-tray-closure.md`](inventaires/linux-kde-neon-panel-tray-closure.md)  
> **Clôture Dolphin** : [`inventaires/linux-kde-neon-dolphin-diff.md`](inventaires/linux-kde-neon-dolphin-diff.md)  
> Captures CapsuleOS : `home/public/Images/screen_KDE-Neon/capsule-*.png`

## Versions

| Composant | VM réelle | CapsuleOS | Statut |
|-----------|-----------|-----------|--------|
| Distribution | KDE neon User Edition 24.04 noble | `profile-data.js` 24.04 | ✅ |
| Shell / DE | Plasma Wayland | toolkit kde / plasma | ✅ |
| Explorateur | Dolphin | slot `nemo` + template `dolphin` | ✅ **clôturé** |
| Navigateur | Firefox | slot `firefox` | ⏳ |
| MAJ | Discover 6.6.5 (`plasma-discover`) | `update_manager` + override KDE Neon | ✅ **clôturé** |

## Panel (1211×756) — clôturé 2026-06-06

| Aspect | VM | CapsuleOS | Statut |
|--------|-----|-----------|--------|
| Launcher | start-here-kde | `start-here-kde.svg` + filtre thème | ✅ |
| Pins | Dolphin, Firefox, Konsole, Discover | idem | ✅ |
| Fond | Wallpaper « Next » | `vendors/neon/wallpaper/neon-default.png` | ✅ |
| Tray | notifications, MAJ, clipboard, luminosité, réseau, volume, expand | popovers + icônes Breeze VM | ✅ |
| Horloge / calendrier | popup Plasma | `calendar-popover-kde.js` | ✅ |
| Show-desktop | user-desktop-symbolic | pull VM | ✅ |

Détail : [`linux-kde-neon-panel-tray-closure.md`](inventaires/linux-kde-neon-panel-tray-closure.md).

## Kickoff — clôturé 2026-06-06

> Inventaire apps VM : [`inventaires/linux-kde-neon-kickoff-apps.json`](inventaires/linux-kde-neon-kickoff-apps.json)  
> Regénération : `node root/tools/lab/generate-kde-neon-kickoff-data.mjs`

| Aspect | VM | CapsuleOS | Statut |
|--------|-----|-----------|--------|
| Transparence (alpha) | fond translucide, blur | tokens `--opensuse-menu-*` | ✅ |
| Icônes catégories | Breeze actions/22 | `kickoff/actions/*.svg` | ✅ |
| Apps par catégorie | 30 entrées menu XDG | `mainMenu-data.js` généré VM | ✅ |
| Toutes les applications | sans doublons | dédup `desktop` | ✅ |
| Favoris | Firefox, Config système, Dolphin, Discover | idem | ✅ |
| Dimensions | 677×513 px | tokens width/height | ✅ |

Détail : [`linux-kde-neon-kickoff-closure.md`](inventaires/linux-kde-neon-kickoff-closure.md).

## Discover — clôturé 2026-06-06

| Aspect | VM | CapsuleOS | Statut |
|--------|-----|-----------|--------|
| Gabarit | Discover 6 Kirigami | `update_manager_kde_neon.html` | ✅ |
| Chrome sidebar | fond blanc, séparateur `#eff0f1`, onglet actif `#def1fb` + barre `#3daee9` | `update_manager.skin.css` | ✅ |
| **Accueil** | 2 sections, cartes apps | 9 apps, grille 2 col., icônes VM | ✅ |
| **Installé(s)** | liste compacte | 14 apps, icônes 32 px | ✅ |
| **Mises à jour** | checkbox + versions + taille | nano noble, badge « 1 », « Tout mettre à jour » fonctionnel | ✅ |
| **Configuration** | SourcesPage backends | Ubuntu / Flatpak / Snap | ✅ |
| **À propos** | FormCard.AboutPage | 6.6.5, GPL, liens, libs, auteurs | ✅ |
| Plein écran / fenêtré | CSD Plasma | sync `data-maximized` + captures | ✅ |
| Titre fenêtre | par onglet | `discover-neon.js` → `#windowTitle` | ✅ |

Détail : [`linux-kde-neon-discover-closure.md`](inventaires/linux-kde-neon-discover-closure.md).

## Captures automatisées

| Cible | Script | Sorties principales |
|-------|--------|---------------------|
| VM lab | `bash root/tools/lab/vm-kde-neon-capture-host.sh` [`--dolphin-only`] | `vm-desktop.png`, `vm-kickoff.png`, `vm-discover*.png`, **`vm-dolphin.png`** |
| CapsuleOS | `node root/tools/lab/capture-capsule-kde-neon.mjs` | bureau, kickoff, discover × 5 onglets (max + windowed) |

Prérequis VM : SSH `capsule@192.168.122.2`, VM libvirt `KDE-Neon`, session Plasma active.  
Prérequis CapsuleOS : `python3 -m http.server 5500`, Playwright (`npm install playwright`).

## Assets vendor

| Fichier | Statut |
|---------|--------|
| `wallpaper/neon-default.png` | ✅ pull VM |
| `panel/firefox.png`, pins SVG | ✅ pull VM |
| `panel/tray/*.svg` | ✅ pull VM |
| `kickoff/actions/*.svg` | ✅ pull VM |
| `discover/*.png` (catalogue) | ✅ 37 icônes |

## Backlog post-clôture bureau Plasma

### P0 — clôturé (2026-06-07)

- [x] Dolphin — points 1–6 ([`linux-kde-neon-dolphin-diff.md`](inventaires/linux-kde-neon-dolphin-diff.md)) : grille, toolbar, vues, split, sidebar Corbeille
- [x] Capture VM Dolphin stabilisée (`kstart dolphin`, playbooks views + split)
- [x] Embed + contentLoader (404 skin probe, vanilla ES6)

**Prochaine étape P0** : relecture visuelle bureau (optionnel) · skin visible dans pick-os public

## Gates (2026-06-07)

```bash
node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/validate-all.mjs   # ✓ OK
node usr/lib/capsuleos/tools/reactivate-os.mjs linux-kde-neon   # ✓ active
```

Résultat : `validate-all` ✅ · profil **`active`** · 13 entrées pick-os publiques.

- Discover · Kickoff · Panel/tray · **Dolphin** : clôture documentée ✅

### P1

- [ ] Captures VM Discover par onglet (script host instable)
- [ ] Slot `nemo` documenté (convention KDE)

### P2 (réouverture Kickoff / tray possible)

- [ ] Popovers tray contenu dynamique (Klipper, réseau KCM)
- [ ] Renommer tokens `--opensuse-*` → `--kde-neon-*`
- [ ] Recherche Discover filtrante · fiches app · catégories actives

- `.cursor` → symlink `root/.cursor` ✅
