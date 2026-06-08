# Rapport cohérence design — Linux Mint (VM ↔ Clone)

**Campagne** : audit fidélité design (au-delà géométrie) · **2026-06-08T16:35:00Z**  
**Ground truth** : `capsule@192.168.1.146` · Mint 22.3 Zena · **Mint-Y-Dark-Aqua** · **Mint-Y-Sand**  
**Clone** : `http://127.0.0.1:5501/home/Debian/Mint/index.html` · viewport **1280×800**  
**Références** : [`linux-mint-vm.json`](linux-mint-vm.json) · [`linux-mint-pixel-perfect-spec.md`](linux-mint-pixel-perfect-spec.md) · [`linux-mint-clone-conformity-report.md`](linux-mint-clone-conformity-report.md)

---

## Méthode

| Étape | Artefact |
|-------|----------|
| Captures VM | `root/docs/inventaires/captures/linux-mint/baseline/` (01–05) |
| Captures clone | `root/docs/inventaires/captures/linux-mint/clone-baseline/` (rafraîchi) |
| SSH VM | `gsettings` thèmes · extrait `cinnamon.css` Mint-Y-Dark-Aqua |
| Styles calculés | Playwright/CDP — panel, menu, horloge, nemo header vs `mint-y-dark-aqua-tokens.css` |
| Géométrie | `measure-mint-shell-geometry.mjs --capture --compare` |

### gsettings VM (SSH 2026-06-08)

| Clé | Valeur |
|-----|--------|
| `org.gnome.desktop.interface gtk-theme` | Mint-Y-Dark-Aqua |
| `org.cinnamon.desktop.interface icon-theme` | Mint-Y-Sand |
| `org.cinnamon.theme name` | Mint-Y-Dark-Aqua |
| `org.cinnamon panels-height` | `['1:40']` |
| `org.cinnamon panel-zone-icon-sizes` | right **24** px |
| Police UI VM | **Noto Sans** (fc-match) · panel `#panel { font-weight: bold; color: #e1e1e1 }` |

---

## Matrice design VM vs clone

### 1. Couleurs (`--mint-*` ↔ VM hex)

| Surface | Token / VM hex | Clone (avant fix) | Clone (après fix) | Statut |
|---------|----------------|-------------------|-------------------|--------|
| Panel bg | `#2e2e33` | `rgb(46,46,51)` ✓ | ✓ | OK |
| Panel texte | `#e1e1e1` | `rgb(230,240,255)` portail | `rgb(225,225,225)` ✓ | **fix P0** |
| Menu shell | `#222226` | ✓ | ✓ | OK |
| Sidebar | `#27272b` | ✓ | ✓ | OK |
| Catégories | `#2a2a2f` | ✓ | ✓ | OK |
| Accent aqua | `#1f9ede` | ✓ | ✓ | OK |
| Hover panel | `#303036` / `#3c3c44` | ✓ | ✓ | OK |
| Bordure menu | `#1a1a1b` | ✓ | ✓ | OK |
| Muffin titlebar | `#303036` (VM cinnamon) | ✓ | ✓ | OK |
| Recherche focus | bordure `#1f9ede` | double anneau a11y GNOME | bordure aqua seule | **fix P1** |

### 2. Typographie

| Élément | VM | Clone (avant) | Clone (après) | Statut |
|---------|-----|---------------|---------------|--------|
| Stack UI | Noto Sans, Cantarell | `system-ui` hérité portail | `Noto Sans, Cantarell, …` | **fix P0** |
| Panel weight | **bold** | 400 | **700** | **fix P1** |
| Horloge | ~18 px, tabular | 18.18 px ✓ | + stack héritée ✓ | OK |
| Menu cat actif | bold | bold ✓ | ✓ | OK |

### 3. Icônes (Mint-Y-Sand)

| Zone | Source clone | VM | Statut |
|------|--------------|-----|--------|
| Panel menu logo | `vendors/mint/panel/` webp | Mint-Y-Sand | OK |
| Tray (CSS sprites) | symboles Mint 24 px | zone right 24 px | OK |
| Favoris tray (5) | webp panel 22 px | favorites applet | OK |
| Menu apps grille | ManΣ + cinnamon paths | Mint-Y-Sand | OK shell |
| Apps GTK catalogue | 68 refs `toolkits/gnome/apps` | upstream GTK | **P2** (MAN-DRIFT-68) |

### 4. Ombres / radius

| Élément | VM | Clone | Statut |
|---------|-----|-------|--------|
| Bouton menu | cercle 50 % | 50 % ✓ | OK |
| Menu popover | `box-shadow` 6 px noir 0.5 | ✓ | OK |
| Fenêtre Muffin | radius ~10 px | `--mint-window-frame-radius: 10px` | OK |
| Recherche | `border-radius: 6px` | 6 px ✓ | OK |

### 5. Thème global (échantillon apps)

| App | Couleurs tokens | Chrome | Statut |
|-----|-----------------|--------|--------|
| Nemo | `--nemo-*` alignés VM gtk-3 | Muffin 32 px + toolbar `#222226` | OK |
| Firefox | Proton dark + muffin | séparé `#windowHeader` | OK (P2 polish chrome) |
| Paramètres (themes) | Mint-Y combos | onglets cinnamon | OK |

### 6. Spacing rhythm (`--head` = 40 px)

| Métrique | VM | Clone Δ | Statut |
|----------|-----|---------|--------|
| Panel height | 40 | 0 | OK |
| Menu 600×480 gap 2 | ✓ | 0 | OK |
| Colonnes 20/25/55 % | ✓ | 0.7 % max | OK |
| Favoris gap | 2.86 | 2.84 (0.02) | OK |
| Padding menu (head/4, head/5) | multiples head | ✓ | OK |

---

## Écarts classés

| ID | Sévérité | Dimension | Description | Action |
|----|----------|-----------|-------------|--------|
| DES-TEXT-PORTAL | **P0** | Couleurs | `html{color:var(--texte)}` portail `hsl(216,100%,95%)` hérité malgré `--texte:#e1e1e1` sur `body#mint` | `color` + `font-family` sur `body#mint` |
| DES-FONT-STACK | **P0** | Typo | Panel/menu/horloge en `system-ui` au lieu Noto/Cantarell | idem + `#tableau` explicite |
| DES-PANEL-WEIGHT | **P1** | Typo | Panel 400 vs VM `#panel { font-weight: bold }` | `font-weight: bold` sur `#tableau` |
| DES-SEARCH-FOCUS | **P1** | Couleurs/effets | Anneau a11y double (GNOME) sur `.menu-search:focus-visible` vs bordure aqua VM | `outline/box-shadow: none` + bordure `#1f9ede` |
| MAN-DRIFT-68 | P2 | Icônes | 68 icônes catalogue → `toolkits/gnome/apps` (apps GTK upstream) | Exception paradigme documentée |
| VIS-AE-NO-IM | P2 | Captures | `compare` ImageMagick absent — AE non mesuré | Géométrie ≤1 px prime |

---

## Correctifs appliqués (CSS tokens uniquement)

1. **`mint-y-dark-aqua-tokens.css`** — `body#mint { color; font-family }` réaligne teinte `#e1e1e1` et stack VM.
2. **`mint-panel.css`** — `#tableau` : `color`, `font-family`, `font-weight: bold` ; horloge `font-family: inherit`.
3. **`mainMenu.skin.css`** — `.menu-search:focus(-visible)` : bordure aqua VM, sans anneau a11y GNOME.
4. **Cache-bust** — `style.css?v=20260608design` (skin + façade).

---

## Score **D_design** (0–100 par surface)

| Surface | Score | Notes |
|---------|-------|-------|
| **panel** | **96** | Couleurs/typo VM après fix · tray 24 px · sprites Mint |
| **menu** | **95** | Palette 3 colonnes VM · focus recherche corrigé · ellipsis OK |
| **desktop** | **93** | Raccourcis webp Mint-Y-Sand · ombre texte VM |
| **nemo** | **91** | Tokens gtk-3 · muffin `#303036` · toolbar `#222226` |
| **firefox** | **88** | Proton dark cohérent · chrome muffin séparé (polish mineur) |
| **themes** | **90** | Combos Mint-Y-Dark-Aqua / Mint-Y-Sand fidèles |
| **D_design global** | **92** | Moyenne pondérée shell 40 % + apps 60 % |

---

## Validation clôture

```text
measure-mint-shell-geometry --capture --compare  → maxΔ 0.7 px ≤ 1  ✓
run-capsule-panel-browser (:5501)                  → 6/6              ✓
validate-toolkit-paradigm --id linux-mint          → OK               ✓
sync-linux-skin-closure                            → OK               ✓
validate-all                                       → exit 0           ✓
```

Captures rafraîchies : `root/docs/inventaires/captures/linux-mint/clone-baseline/`

---

## Références

- Tokens : `home/Debian/Mint/style/mint-y-dark-aqua-tokens.css`
- Spéc géométrie : [`linux-mint-pixel-perfect-spec.md`](linux-mint-pixel-perfect-spec.md)
- Conformité intégrale : [`linux-mint-clone-conformity-report.md`](linux-mint-clone-conformity-report.md)
