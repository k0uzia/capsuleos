# Roadmap Discover magasin — `linux-kde-neon`

> **Campagne** : `discover-store-kde-neon` · pivot ground uniquement  
> **Orchestrateur** : `smoke-discover-kde-neon.mjs` · **Smoke Kirigami** : `smoke-kde-neon-discover.mjs`

## Objectif

Brancher le **catalogue magasin CapsuleOS** (`capsule-store-catalog.js`) dans Discover Neon : section **« À découvrir »**, fiches apps store, installation simulée (`CapsuleGnomeStore`).

## Phases

| # | Phase | Livrable | Gate |
|---|-------|----------|------|
| D1 | Catalogue actif | `storeCatalogStatus: active` · scripts store dans `index.html` | `smoke-discover-kde-neon.mjs` statique |
| D2 | Section accueil | Grille « À découvrir » · icônes `iconClass` · sans `usr/share` en JS | smoke runtime section |
| D3 | Fiche + install | Détail store · `recordStoreInstall` · retrait carte post-install | smoke runtime LibreOffice |
| D4 | Parité visuelle | Capture `06-discover` avec section magasin · compare VM | `capture-capsule-kde-neon.mjs` |
| D5 | Recherche | Filtre champ recherche accueil / installé | backlog P2 |

## État (2026-06-11)

| Phase | Statut |
|-------|--------|
| D1 | ✅ merge `main` (`0234756a`) |
| D2 | ✅ `discover-kde-store-icons.css` · `getStoreDiscoverApps` |
| D3 | ✅ smoke runtime install LibreOffice |
| D4 | ✅ baseline `06-discover` + `capsule-discover.png` (section À découvrir) |
| D5 | ⏳ backlog |

## Recette

```bash
python3 -m http.server 5500 --bind 127.0.0.1
node usr/lib/capsuleos/tools/lab/smoke-discover-kde-neon.mjs
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-discover.mjs
CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/run-kde-neon-pass.mjs
```

## Références

- [`linux-kde-neon-discover-closure.md`](linux-kde-neon-discover-closure.md) — Kirigami G6
- `etc/capsuleos/contracts/presentation-bindings.json` — `linux-kde-neon`
- `usr/lib/capsuleos/shells/linux/discover-kde.js`
