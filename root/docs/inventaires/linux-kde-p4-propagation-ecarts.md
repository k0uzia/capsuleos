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

## Non inclus P4 (backlog P5 / dérivé)

- `dolphin-neon.js` / `discover-neon.js` (restent Neon-only)
- Kickoff 30 apps regénéré (Neon-only ; dérivés gardent leur `mainMenu-data.js`)
- Captures VM par dérivé

## Vérification

```bash
node usr/lib/capsuleos/tools/lab/smoke-kde-p4-propagation.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
```

## Patch one-shot markup tray

`node root/tools/lab/patch-kde-p4-tray-markup.mjs` — réinjecte boutons + popovers depuis Neon (usage lab, pas sync continue).
