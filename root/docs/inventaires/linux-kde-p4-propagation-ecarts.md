# P4 — Propagation toolkit KDE (écarts par dérivé)

> Source : **KDE Neon** (`home/Debian/KDE-Neon/`) · Campagne v3 · 2026-06-08

## Périmètre propagé

| Couche | Fichier partagé | Skins cibles |
|--------|-----------------|--------------|
| Tray JS | `usr/lib/capsuleos/shells/linux/tray-popover-kde.js` | Neon, openSUSE, MX-KDE, Debian-KDE |
| Tray CSS | `usr/share/capsuleos/linux/apps/style/tray-popover-kde.base.css` | idem |
| Panel dock | `style/plasma-panel-dock.css` (par vendor) | openSUSE ✅ · MX-KDE ✅ · Debian-KDE ✅ |
| Tokens `--kde-plasma-*` | alias dans `plasma-panel-dock.css` | les 4 skins |

## Spécificités conservées (non propagées)

| Skin | Écart volontaire |
|------|------------------|
| **openSUSE** | Launcher Geeko (`opensuse-launcher.svg`) · pins pager · ordre panel VM Tumbleweed |
| **MX-KDE** | Logo MX panel · flyout kickoff (`mainMenu-kde-chrome.js`) · pins checklist MX |
| **Debian-KDE** | Logo Debian desktop · tokens `--opensuse-*` legacy dans breeze (dette nommage, fonctionnel) · pas de Discover Neon JS |

## V4-P3 — propagation Dolphin (2026-06-09) ✅

| Couche | Fichier partagé | Skins cibles |
|--------|-----------------|--------------|
| Dolphin chrome | `usr/lib/capsuleos/shells/linux/fileExplorer/dolphin-kde-chrome.js` | Neon, openSUSE, MX-KDE, Debian-KDE |
| Discover (pivot) | `usr/lib/capsuleos/shells/linux/discover-kde.js` | **4 skins** (V6 — `update_manager_kde_neon.html` + `discover-kirigami-kde.shared.css`) |
| Noyau explorer | `fileExplorerAdvancedChrome.js` … `fileExplorerContextMenu.js` | 4 skins KDE (versions Neon) |
| Tokens Debian | `--debian-kde-*` + alias `--opensuse-*` | Debian-KDE |

## V6 — Discover Kirigami dérivés (2026-06-09) ✅

Voir [linux-kde-neon-roadmap-v6.md](linux-kde-neon-roadmap-v6.md).

**Conservé volontairement** : kickoff 30 apps Neon-only · catalogues vendor-spécifiques futurs.

## Non inclus (backlog)

- Kickoff 30 apps regénéré (Neon-only ; dérivés gardent leur `mainMenu-data.js`)
- Captures VM par dérivé
- Discover full sur openSUSE / MX / Debian-KDE (nécessite catalog vendor + CSS)

## Vérification

```bash
node usr/lib/capsuleos/tools/lab/smoke-kde-p4-propagation.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
```

## Patch one-shot markup tray

`node root/tools/lab/patch-kde-p4-tray-markup.mjs` — réinjecte boutons + popovers depuis Neon (usage lab, pas sync continue).
