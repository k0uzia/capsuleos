# Spécification pixel-perfect — Linux Mint Cinnamon (panel + menu)

Référence VM : `<lab-inventory:linux-mint-pixel-perfect>` · Mint 22.3 Zena · Cinnamon 6.6.7 · thème **Mint-Y-Dark-Aqua**  
Clone CapsuleOS : `http://127.0.0.1:5501/home/Debian/Mint/index.html`  
Résolution de contrôle : **1280×800**

## Politique de tolérance

| Type | Seuil | Notes |
|------|-------|-------|
| Géométrie (bbox, hauteurs, gaps) | **≤ 1 px** | `maxDeltaPx` sur métriques clés |
| Proportions colonnes menu | **≤ 1 %** relatif (≈ 6 px sur 600) | Grille 20 / 25 / 55 % + gap 2 px |
| Couleur / rendu police | optionnel | AE capture documenté, non bloquant |
| Ellipsis sidebar | obligatoire | Comportement VM : troncature CSS, pas d’élargissement colonnes |

Outil de mesure :

```bash
CAPSULE_MINT_URL=http://127.0.0.1:5501/home/Debian/Mint/index.html \
  node usr/lib/capsuleos/tools/lab/measure-mint-shell-geometry.mjs --capture --compare
```

Sortie : `root/docs/inventaires/captures/linux-mint/clone-baseline/metrics.json`

Captures VM (ground truth) : `root/docs/inventaires/captures/linux-mint/baseline/`  
Captures clone : `root/docs/inventaires/captures/linux-mint/clone-baseline/`

Diff visuel (ImageMagick) : `compare -metric AE baseline/NN.png clone-baseline/NN.png` — seuil **documenté** dans `metrics.json` (`visualDiff[].absoluteError`), géométrie DOM prime.

## gsettings VM (2026-06-08)

| Clé | Valeur |
|-----|--------|
| `org.cinnamon panels-height` | `['1:40']` |
| `org.cinnamon panel-zone-icon-sizes` | `[{"panelId":1,"left":0,"center":0,"right":24}]` |
| Thème Cinnamon / GTK | Mint-Y-Dark-Aqua |
| Icônes | Mint-Y-Sand |

## Checklist panel (40 px)

| Élément | VM px | Sélecteur clone |
|---------|-------|-----------------|
| Hauteur panel | 40 | `#tableau.mint-panel` |
| Bouton menu (cercle) | 40×40 | `footer nav a[data-link="mainMenu"]` |
| Logo inset | ~33×33 | `… img` |
| Séparateur | 1×25 | `.mint-panel__separator` |
| Icône tray | 24×24 | `.taskbar-tray__icon` (`flex-shrink: 0`) |
| Favoris tray (5 icônes) | 22 px, box ~121 px, gap ~2.86 px | `#mint-tray-favorites` |
| Horloge hauteur | 40 | `.taskbar-clock-trigger` |
| Horloge police | ~18 px (Cantarell/Noto) | `#taskbar-clock` |

Applets VM (ordre) : menu · separator · grouped-window-list · systray · xapp · notifications · printers · removable · keyboard · **favorites** · network · sound · power · calendar · cornerbar.

## Checklist menu (#mainMenu 600×480)

| Élément | VM px | Règle CSS |
|---------|-------|-----------|
| Largeur × hauteur | 600 × 480 | `--mint-menu-width/height` |
| Gap au-dessus du panel | 2 | `bottom: var(--mint-menu-col-gap)` |
| Colonnes | 20 % / 25 % / 55 % | `grid-template-columns: 20% 25% minmax(0,1fr)` |
| Gap inter-colonnes | 2 | `column-gap: 2px` |
| Hauteur champ recherche | 35 | `.menu-search` |
| Largeur champ recherche (utile) | 134 | colonne 25 % − padding `head/5` × 2 |
| Hauteur ligne catégorie | ~34–36 | `.menu-cat` padding VM |
| Icône app grille | ~27 (0.68×head) | `.menu-app-item__icon` |
| Ellipsis sidebar | oui | `.menu-shortcut span` `text-overflow: ellipsis` |

Libellés sidebar attendus tronqués (VM FR) : Télécharg…, Éditeur de…, Paramètre…

## Fichiers source clone

| Fichier | Rôle |
|---------|------|
| `home/Debian/Mint/style/mint-panel.css` | Panel unique (menu btn, tray, favoris, horloge) |
| `home/Debian/Mint/style/mint-y-dark-aqua-tokens.css` | Tokens 40 px, 24 px tray, couleurs VM |
| `home/Debian/Mint/style/apps/mainMenu.skin.css` | Grille menu, ellipsis, recherche |
| `home/Debian/Mint/index.html` | Structure `#tableau` / `#mainMenu` |
| `usr/share/capsuleos/linux/apps/mainMenu.html` | Gabarit 3 colonnes |

## Validation clôture

```bash
node usr/lib/capsuleos/tools/lab/measure-mint-shell-geometry.mjs --capture --compare   # maxDelta ≤ 1
CAPSULE_PANEL_URL=http://127.0.0.1:5501/home/Debian/Mint/index.html \
  node usr/lib/capsuleos/tools/lab/run-capsule-panel-browser.mjs                    # 6/6
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
```

Score formel : `linux-mint-parity-index.json` → `shell.panel.layoutMetrics`, `shell.mainMenu.layoutMetrics`, `Π_vis_layout` (= 100 si `maxDeltaPx` ≤ 1).
