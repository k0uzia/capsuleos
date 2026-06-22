# Matrice diff Dolphin — KDE neon User Edition (VM ↔ Capsule)

> **Statut** : clôturé campagne pivot (2026-06-20) — VM session lab exceptionnelle · Registre `linux-kde-neon`  
> Parité globale : [`inventaire-parite-neon.md`](../inventaire-parite-neon.md)  
> Interactions : [`interactions/linux-kde-neon/nemo.json`](interactions/linux-kde-neon/nemo.json)

Explorateur panel P0 : slot `nemo`, template `dolphin`, chrome KDE dans `dolphin-kde-chrome.js`.

## Fichiers source

| Rôle | Chemin |
|------|--------|
| Template HTML | `usr/share/capsuleos/linux/apps/dolphin.html` |
| Chrome KDE (toolkit) | `usr/lib/capsuleos/shells/linux/fileExplorer/dolphin-kde-chrome.js` |
| Menu contextuel | `usr/lib/capsuleos/shells/linux/fileExplorer/fileExplorerContextMenu.js` |
| Noyau explorateur | `usr/lib/capsuleos/shells/linux/fileExplorer/fileExplorerCore.js` |
| CSS skin Neon | `home/Debian/KDE-Neon/style/apps/dolphin.skin.css` |
| Captures VM | `bash root/tools/lab/vm-kde-neon-capture-host.sh --dolphin-g5` · `--dolphin-split` |
| Captures Capsule | `node root/tools/lab/capture-capsule-kde-neon.mjs` |
| Smokes | `smoke-kde-neon-dolphin.mjs` · `smoke-dolphin-vm-parity.mjs` |

## Matrice 9 points

| # | Domaine | VM | Capsule | Statut | Note |
|---|---------|-----|---------|--------|------|
| 1 | Chrome fenêtre Breeze | `vm-dolphin.png` | `capsule-dolphin.png` | ✅ | baseline KdVp `03-dolphin` sans drift |
| 2 | Toolbar + modes vue | idem | idem | ✅ | dbus `icons\|compact\|details` |
| 3 | Sidebar emplacements | idem | idem | ✅ | Emplacements + récents |
| 4 | Grille vue icônes | `vm-dolphin.png` | `capsule-dolphin.png` | ✅ | G5 grid polish CSS |
| 5 | Vues compacte / liste | `vm-dolphin-compact.png` · `vm-dolphin-list.png` | `capsule-dolphin-compact.png` · `capsule-dolphin-list.png` | ✅ | `--dolphin-views` |
| 6 | Section Périphériques | `vm-dolphin.png` | smoke + runtime | ✅ | `ensureNeonPeripheralsSection()` |
| 7 | Recherche + filtre | `vm-dolphin-search-open.png` · `vm-dolphin-search-filter-open.png` | `capsule-dolphin-search-open.png` · `capsule-dolphin-search-filter-open.png` | ✅ | smoke lignes 76–101 |
| 8 | Menu hamburger | `vm-dolphin-hamburger-open.png` | `capsule-dolphin-hamburger.png` | ✅ | 29 icônes hamburger chargées |
| 9 | Menu contextuel + flyouts | smoke runtime VM (pas capture PNG dédiée) | smoke `smoke-kde-neon-dolphin.mjs` | ✅ | flyouts étiquettes + activités ; ≥8 icônes KDE |

Scène Capsule supplémentaire : `capsule-dolphin-split-selection.png` (sélection indépendante split) — validée smoke uniquement.

## Gates (2026-06-20 — VM pivot)

```bash
export KDE_NEON_SSH=capsule@<ip-lab>   # etc/capsuleos/lab-inventory.json (gitignoré)
bash root/tools/lab/vm-kde-neon-capture-host.sh --dolphin-g5
bash root/tools/lab/vm-kde-neon-capture-host.sh --dolphin-split
python3 -m http.server 5500
CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node root/tools/lab/capture-capsule-kde-neon.mjs
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-dolphin.mjs
node usr/lib/capsuleos/tools/lab/smoke-dolphin-vm-parity.mjs
CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --id linux-kde-neon --compare
CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/run-kde-neon-pass.mjs --write
```

## Écarts assumés (hors clôture Dolphin P0)

| Écart | Priorité | Note |
|-------|----------|------|
| Actions fichier réelles (copier/coller/corbeille) | P2 | Décoratif — pas de backend FS |
| Sous-menus hamburger profonds (templates, configure…) | P2 | Structure présente, actions partielles |
| KFind / indexation recherche | P2 | Boutons filtre désactivés |
| Capture VM menu contextuel PNG | P2 | Parité prouvée par smoke runtime |
| Propagation dérivés KDE | gelé | openSUSE · MX-KDE · Debian-KDE |

## Réouverture

Réouvrir si la VM change de version Dolphin, layout toolbar, ou si `capture-clone-surfaces --compare` drift sur `03-dolphin`.
