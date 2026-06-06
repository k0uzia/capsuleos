# Inventaire parité — KDE neon User Edition VM → CapsuleOS

> Collecte VM : 2026-06-06 · Registre : `linux-kde-neon`  
> **HIG KDE** : [kde-hig-ressources.md](kde-hig-ressources.md) · branche : [branche-plasma-kde.md](branche-plasma-kde.md)  
> Inventaire : [`inventaires/linux-kde-neon-vm.json`](inventaires/linux-kde-neon-vm.json)  
> **Clôture Discover** : [`inventaires/linux-kde-neon-discover-closure.md`](inventaires/linux-kde-neon-discover-closure.md)  
> **Clôture Kickoff** : [`inventaires/linux-kde-neon-kickoff-closure.md`](inventaires/linux-kde-neon-kickoff-closure.md)  
> **Clôture Panel + tray** : [`inventaires/linux-kde-neon-panel-tray-closure.md`](inventaires/linux-kde-neon-panel-tray-closure.md)  
> Captures CapsuleOS : `home/public/Images/screen_KDE-Neon/capsule-*.png`

## Versions

| Composant | VM réelle | CapsuleOS | Statut |
|-----------|-----------|-----------|--------|
| Distribution | KDE neon User Edition 24.04 noble | `profile-data.js` 24.04 | ✅ |
| Shell / DE | Plasma Wayland | toolkit kde / plasma | ✅ |
| Explorateur | Dolphin | slot `nemo` + template `dolphin` | ⏳ parité P0 |
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
| VM lab | `bash root/tools/lab/vm-kde-neon-capture-host.sh` | `vm-desktop.png`, `vm-kickoff.png`, `vm-discover.png` |
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

### P0 — prochain

- [ ] Dolphin (`nemo`) — vues icônes / liste / compacte
- [ ] Diff pixel côte à côte VM vs CapsuleOS (bureau complet)

### P1

- [ ] Captures VM Discover par onglet (script host instable)
- [ ] Slot `nemo` documenté (convention KDE)

### P2 (réouverture Kickoff / tray possible)

- [ ] Popovers tray contenu dynamique (Klipper, réseau KCM)
- [ ] Renommer tokens `--opensuse-*` → `--kde-neon-*`
- [ ] Recherche Discover filtrante · fiches app · catégories actives

## Gates (clôture 2026-06-06, revalidés à l’exécution)

```bash
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs   # OK (2026-06-06)
node usr/lib/capsuleos/tools/validate-all.mjs                    # OK (2026-06-06)
```

Résultat `validate-all` : assets ✅ · links ✅ · capsule ✅ · quality ✅ (186 avertissements vanilla-js préexistants, non bloquants — voir `root/docs/passe-vanilla-json.md`).

- Discover · Kickoff · Panel/tray : clôture fonctionnelle validée utilisateur ✅
- `.cursor` → symlink `root/.cursor` ✅
