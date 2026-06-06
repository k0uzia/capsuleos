# Inventaire parité — KDE neon User Edition VM → CapsuleOS

> Collecte VM : 2026-06-06 · Registre : `linux-kde-neon`  
> Inventaire : [`inventaires/linux-kde-neon-vm.json`](inventaires/linux-kde-neon-vm.json)  
> Captures CapsuleOS : `home/public/Images/screen_KDE-Neon/capsule-*.png`

## Versions

| Composant | VM réelle | CapsuleOS | Statut |
|-----------|-----------|-----------|--------|
| Distribution | KDE neon User Edition 24.04 noble | `profile-data.js` 24.04 | ✅ |
| Shell / DE | Plasma Wayland | toolkit kde / plasma | ✅ |
| Explorateur | Dolphin | slot `nemo` + `dolphin` | ✅ |
| Navigateur | Firefox | slot `firefox` | ✅ |
| MAJ | Discover (`plasma-discover`) | `update_manager` + override KDE | ✅ chrome / ⚠️ contenu |

## Panel (1211×756)

| Aspect | VM | CapsuleOS | Statut |
|--------|-----|-----------|--------|
| Launcher | start-here-kde | `toolkits/kde/panel/start-here-kde.svg` | ✅ |
| Pins | Dolphin, Firefox, Konsole, Discover | idem | ✅ |
| Fond | Wallpaper « Next » | `vendors/neon/wallpaper/neon-default.png` | ✅ |
| Tray | réseau, batterie, volume, horloge | idem | ✅ |
| Show-desktop | menu burger | `menu-burger.svg` | ✅ |

## Kickoff

| Aspect | VM | CapsuleOS | Statut |
|--------|-----|-----------|--------|
| Dimensions | 677×513 px | `--opensuse-menu-width/height` | ✅ ajusté |
| Favoris | Firefox, …, Dolphin, Discover | Firefox, Paramètres, Dolphin, Discover | ✅ |
| Pied | Veille / Redémarrer / Éteindre / Session | idem | ✅ |
| Kontact (VM) | présent | absent | P1 assumé |

## Discover

| Aspect | VM | CapsuleOS | Statut |
|--------|-----|-----------|--------|
| Vue par défaut | Page d'accueil (cartes apps) | `update_manager_kde_neon.html` + CSS commun KDE fetch | ✅ structure |
| Fonds sidebar / contenu | blanc `#ffffff`, séparateur `#eff0f1` | calibré Neon skin | ✅ |
| Onglet Accueil actif | fond `#def1fb`, barre `#3daee9` 4px | calibré Neon skin | ✅ |

## Captures automatisées

| Cible | Script | Sortie |
|-------|--------|--------|
| VM lab | `bash root/tools/lab/vm-kde-neon-capture-host.sh` | `vm-desktop.png`, `vm-kickoff.png`, `vm-discover.png` |
| CapsuleOS | `node root/tools/lab/capture-capsule-kde-neon.mjs` | `capsule-desktop.png`, `capsule-kickoff.png`, `capsule-discover.png` |

Prérequis VM : SSH `capsule@192.168.122.2`, VM libvirt `KDE-Neon`, session Plasma active.  
Prérequis CapsuleOS : `python3 -m http.server 5500`, `npm install playwright` (local).

Mécanisme VM : SSH prépare l'état (dbus Kickoff, `plasma-discover`), puis **`virsh -c qemu:///system screenshot KDE-Neon --file …`** depuis l'hôte.

## Assets vendor

| Fichier | Statut |
|---------|--------|
| `wallpaper/neon-default.png` | ✅ pull VM |
| `panel/firefox.png` | ✅ pull VM |
| `panel/dolphin.svg`, `discover.svg`, `konsole.svg` | ✅ |

## Backlog

### P0 — restant

- [x] Script capture VM + CapsuleOS (`vm-kde-neon-capture-host.sh`, `capture-capsule-kde-neon.mjs`)
- [ ] Diff pixel côte à côte VM vs CapsuleOS (revue visuelle)

### P1

- [x] Contenu Discover : paquets `.deb` / Ubuntu (`update_manager_kde_neon.html`)
- [ ] Kontact décoratif dans favoris VM (optionnel)
- [ ] Slot `nemo` documenté (convention KDE)

### P2

- [ ] Renommer tokens `--opensuse-*` → `--kde-neon-*`

## Gates (2026-06-06)

- MCP browser : bureau, Kickoff, Discover OK
- `sync-linux-skin-closure` + embed à relancer après edits `mainMenu-data.js`
