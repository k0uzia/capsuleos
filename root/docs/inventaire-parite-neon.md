# Inventaire parité — KDE neon User Edition VM → CapsuleOS

> Collecte VM : 2026-06-06 · Registre : `linux-kde-neon`  
> **Campagne v2 (réouverte)** : 2026-06-08 post-merge — [`linux-kde-neon-clone-status.md`](inventaires/linux-kde-neon-clone-status.md) · [`linux-kde-neon-replication-state.json`](inventaires/linux-kde-neon-replication-state.json)  
> **HIG KDE** : [kde-hig-ressources.md](kde-hig-ressources.md) · branche : [branche-plasma-kde.md](branche-plasma-kde.md)  
> Inventaire : [`inventaires/linux-kde-neon-vm.json`](inventaires/linux-kde-neon-vm.json)  
> **Discover** : [`inventaires/linux-kde-neon-discover-closure.md`](inventaires/linux-kde-neon-discover-closure.md) — 🔄 **réaudit v2**  
> **Kickoff** : [`inventaires/linux-kde-neon-kickoff-closure.md`](inventaires/linux-kde-neon-kickoff-closure.md) — 🔄 **réaudit v2**  
> **Panel + tray** : [`inventaires/linux-kde-neon-panel-tray-closure.md`](inventaires/linux-kde-neon-panel-tray-closure.md) — 🔄 **réaudit v2**  
> **Dolphin** : [`inventaires/linux-kde-neon-dolphin-diff.md`](inventaires/linux-kde-neon-dolphin-diff.md) — 🔄 **réaudit v2** (points 7–9 ouverts)  
> Captures CapsuleOS : `home/public/Images/screen_KDE-Neon/capsule-*.png`

## Versions

| Composant | VM réelle | CapsuleOS | Statut v2 |
|-----------|-----------|-----------|-----------|
| Distribution | KDE neon User Edition 24.04 noble | `profile-data.js` 24.04 | ✅ |
| Shell / DE | Plasma Wayland | toolkit kde / plasma | 🔄 réaudit |
| Explorateur | Dolphin | slot `nemo` + template `dolphin` | 🔄 réaudit (interactionnel ouvert) |
| Navigateur | Firefox | slot `firefox` | 🔄 P1 (skin + smoke 2026-06-08) |
| MAJ | Discover 6.6.5 (`plasma-discover`) | `update_manager` + override KDE Neon | 🔄 réaudit |

## Panel (1211×756) — réouvert v2

| Aspect | VM | CapsuleOS | Statut v1 | Statut v2 |
|--------|-----|-----------|-----------|-----------|
| Launcher | start-here-kde | `start-here-kde.svg` + filtre thème | ✅ | 🔄 |
| Pins | Dolphin, Firefox, Konsole, Discover | idem | ✅ | 🔄 |
| Fond | Wallpaper « Next » | `vendors/neon/wallpaper/neon-default.png` | ✅ | 🔄 |
| Tray | notifications, MAJ, clipboard, … | popovers + icônes Breeze VM | ✅ | 🔄 |
| Horloge / calendrier | popup Plasma | `calendar-popover-kde.js` | ✅ | 🔄 |
| Show-desktop | user-desktop-symbolic | pull VM | ✅ | 🔄 |

Détail v1 : [`linux-kde-neon-panel-tray-closure.md`](inventaires/linux-kde-neon-panel-tray-closure.md).

## Kickoff — réouvert v2

> Inventaire apps VM : [`inventaires/linux-kde-neon-kickoff-apps.json`](inventaires/linux-kde-neon-kickoff-apps.json)  
> Regénération : `node root/tools/lab/generate-kde-neon-kickoff-data.mjs`

| Aspect | Statut v1 | Statut v2 | Note |
|--------|-----------|-----------|------|
| Transparence, icônes, apps, favoris | ✅ | 🔄 | tokens `--opensuse-*` à renommer |
| Dimensions 677×513 | ✅ | 🔄 | capture baseline compare |

## Discover — réouvert v2

| Aspect | Statut v1 | Statut v2 |
|--------|-----------|-----------|
| 5 onglets Kirigami + chrome | ✅ | 🔄 post-merge |
| Catalogue + icônes VM | ✅ | 🔄 |
| Filtres / fiches / catégories | — | ⏳ P2 |

## Captures automatisées

| Cible | Script | Sorties principales |
|-------|--------|---------------------|
| VM lab | `bash root/tools/lab/vm-kde-neon-capture-host.sh` [`--dolphin-hamburger`] | bureau, kickoff, discover, dolphin |
| CapsuleOS | `node root/tools/lab/capture-capsule-kde-neon.mjs` | idem + recherche / filtre / hamburger (18 scènes) |
| Baseline v2 | `capture-clone-surfaces.mjs --id linux-kde-neon` | checkpoints CI (modèle Mint) |

Prérequis VM : SSH `goupil@192.168.123.52`, clé `~/.ssh/capsuleos-lab`, VM `KDE-Neon`.  
Prérequis CapsuleOS : `python3 -m http.server 5500`, Playwright.

## Assets vendor

| Fichier | Statut |
|---------|--------|
| `wallpaper/neon-default.png` | ✅ pull VM |
| `panel/`, `tray/`, `kickoff/`, `discover/` | ✅ — révalider post-merge |

## Roadmap campagne v2

### Pass 0 — baseline ✅ (2026-06-08)

- [x] Merge upstream + correctifs HTTP
- [x] `validate-all.mjs` exit 0
- [x] `sync-all-views.mjs`
- [x] `capture-clone-surfaces --write-baseline` (2026-06-08)

### Pass 1 — état formel ✅

- [x] `linux-kde-neon-replication-state.json`
- [x] `linux-kde-neon-clone-status.md`
- [x] Réouverture clôtures doc

### Pass 2 — dette conventionnelle ✅ (2026-06-08)

- [x] Fix `?.` `dolphin-neon.js`
- [x] Tokens `--opensuse-*` → `--kde-neon-*`
- [x] Audit `resolveCapsuleResourceUrl` dolphin-neon.js (`./assets/`)
- [x] `interactions/linux-kde-neon/*.json` (nemo, firefox, update_manager)

### Pass 3 — re-parité Dolphin VM 🔄 (2026-06-08)

- [x] Captures : recherche ouverte, filtre Capsule, hamburger VM ↔ Capsule
- [x] Matrice diff points 7–8 captures ✅ · point 9 contextuel ⏳ P2

### Pass 4 — P1 Firefox 🔄 (2026-06-08)

- [x] Skin `firefox.skin.css` (Breeze titlebar + Proton)
- [x] Smoke `smoke-kde-neon-firefox.mjs` exit 0
- [ ] Inventaire VM toolbar détaillé · capture compare 04-firefox stable

### Pass 5 — clôture H₆ ✅ (2026-06-08)

- [x] `validate-all` + `sync-linux-skin-closure`
- [x] `capture-clone-surfaces --compare` stable (horloge figée + waits scènes)
- [x] Brief agent à jour · `replication-state.json` H₆=true

**Backlog P2** : context menu Dolphin, tray, audit assets CSS restants.

## Gates (campagne v2)

```bash
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
node usr/lib/capsuleos/tools/print-validation-plan.mjs home/Debian/KDE-Neon/
```

Résultat Pass 0 : `validate-all` ✅ · profil **`active`** (conservé) · clôtures **réouvertes** pour réaudit.

### P2 (inchangé, reporté après v2)

- [ ] Popovers tray dynamiques (Klipper, réseau KCM)
- [ ] Périphériques sidebar Dolphin
- [ ] Split : sélection volet droit indépendante
- [ ] Menu contextuel Dolphin flyouts complets
