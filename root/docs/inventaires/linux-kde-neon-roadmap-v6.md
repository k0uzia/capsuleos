# Roadmap v6 — propagation dérivés KDE

> **Campagne** : `v6-derived-parity` · pivot `linux-kde-neon` · dérivés openSUSE, MX-KDE, Debian-KDE

## Objectif

Porter le niveau v4/v5 Neon vers les **3 skins dérivés** sans réouvrir les campagnes structurelles clôturées.

## P0 — Cloisonnement ✅

- Debian-KDE : icônes Firefox `toolkits/gnome` → `toolkits/kde`
- Gate : `smoke-kde-v6-derived.mjs` (¬gnome leak)

## P1 — Discover Kirigami dérivés ✅

| Couche | Fichier |
|--------|---------|
| Template | `update_manager_kde_neon.html` (profils + skin.profile) |
| JS | `discover-kde.js` dans les 3 `index.html` |
| Catalogue | `content/discover-catalog.json` (pivot Neon) |
| CSS partagé | `usr/share/capsuleos/linux/apps/style/discover-kirigami-kde.shared.css` |
| Surcouche vendor | `style/apps/update_manager.skin.css` par dérivé |

## P2 — Backlog

- Captures VM par dérivé
- Propagation Cred* smokes sur dérivés (échantillon)
- Polish calendrier tray
- Π pivot 95 → 100

## Vérification

```bash
node usr/lib/capsuleos/tools/lab/smoke-kde-v6-derived.mjs
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
```
