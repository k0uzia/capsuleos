# Audit CSS / assets — skin KDE Neon (P1 clôture)

> **Statut** : documenté 2026-06-08 · campagne `v3-full-parity`  
> **Convention cible** : JS runtime `./assets/` + `resolveCapsuleResourceUrl` · CSS chemins relatifs documentés

## Résumé

| Zone | JS `./assets/` | CSS `usr/share` | Note |
|------|----------------|-----------------|------|
| `discover-neon.js` | ✅ | — | fix `global` → `resolveCapsuleResourceUrl` |
| `tray-popover-kde.js` | ✅ | — | `TRAY_BASE = './assets/...'` |
| `dolphin-neon.js` | ✅ (IIFE `window`) | — | hamburger + context flyouts |
| `mainMenu-plasma.js` | ✅ | — | référence |
| **CSS skins apps** | — | ⚠️ exceptions | voir §2 |
| **index.html / imports** | — | ✅ canonique | socle noyau CapsuleOS |

## 1. Autorisé (socle noyau)

Chemins `../../../usr/share/capsuleos/` **acceptés** pour :

- `style/imports.css` — thèmes globaux, toolkit KDE, variables
- `index.html` — favicon, scripts noyau, templates apps, icônes panel statiques HTML
- `skin.profile.json` — `CAPSULE_APPS_BASE`, `assetsBase` (contrat closure)
- `apps/mainMenu.html` — icônes session Plasma (suspend/reboot)
- `content/profile-data.js` — logo vendor (1 référence)

**Règle** : pas de migration sans gate `sync-linux-skin-closure` + `validate-all`.

## 2. Exceptions CSS skin (documentées P1)

Fichiers avec `url(../../../../../usr/share/capsuleos/...)` — **intentionnel** (masques Breeze, icônes Discover catégories, chrome fenêtre) :

| Fichier | Occurrences | Pallier migration |
|---------|-------------|-------------------|
| `style/apps/update_manager.skin.css` | ~35 | P3 (symlinks `./assets/` discover) |
| `style/apps/dolphin.skin.css` | ~12 | P2 partiel (hamburger OK en JS) |
| `style/apps/terminal.skin.css` | ~10 | P2 smoke Konsole |
| `style/apps/firefox.skin.css` | 1 | P2 |
| `style/apps/mainMenu.skin.css` | 1 | P3 kickoff |
| `style/windows.css` | 6 | P4 propagation |
| `style/debian-desktop.css` | 1 | wallpaper vendor |
| `style/calendar-popover.css` | 1 | P2 calendrier |

**Interdit** : nouvelles références hors zones autorisées (`validate-asset-zones`).

## 3. Gates P1

```bash
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-shell-polish.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
```

Grep dette JS :

```bash
rg 'usr/share' home/Debian/KDE-Neon/js/   # attendu : 0
```
