# Chrome fenêtre Muffin — VM Linux Mint 22.3 → CapsuleOS

**Objectif** : caler la barre titre SSD Cinnamon (Muffin) simulée dans CapsuleOS sur le ground truth VM.

**Collecte** : SSH `capsule@192.168.1.146` · script [`vm-mint-window-chrome-inventory.sh`](../../tools/lab/vm-mint-window-chrome-inventory.sh) · JSON [`linux-mint-window-chrome-vm.json`](linux-mint-window-chrome-vm.json) · campagne 2026-06-05.

---

## 1. Contexte VM

| Élément | VM |
|---------|-----|
| Release | **22.3** (Zena) |
| Thème Cinnamon | **Mint-Y-Dark-Aqua** |
| Thème GTK | **Mint-Y-Aqua** |
| `button-layout` | `:minimize,maximize,close` |
| Double-clic titre | `toggle-maximize` |
| Résolution lab | 1280×800 @ 96 dpi |

---

## 2. Mesures Muffin (SSD)

Propriété X11 `_NET_FRAME_EXTENTS` — composant **top** = hauteur barre titre WM.

| Slot | Modèle | `_NET_FRAME_EXTENTS.top` | Notes |
|------|--------|--------------------------|-------|
| **Nemo** | muffin-ssd | **32** | Explorateur fichiers |
| **Firefox** | muffin-ssd | **32** | `browser.tabs.inTitlebar=0` |
| **Update Manager** | muffin-ssd | **32** | GTK3 sans CSD |
| File Roller | gtk-csd | — (23 top shadow) | CSD réel ; CapsuleOS simule SSD |
| Calculatrice | gtk-csd | — (23 top shadow) | idem |

**Médiane SSD** : **32 px** (`aggregates.ssdTitlebarTopMedian`).

---

## 3. Écarts CapsuleOS (avant correctif)

Mesure DOM Nemo (`127.0.0.1:5500`, `--head: 40px`) :

| Métrique | VM | CapsuleOS (avant) | Écart |
|----------|-----|-------------------|-------|
| Hauteur barre titre | **32 px** | ~31 px (`head/1.3`) + **padding 10 px** | Boutons écrasés, barre visuellement trop basse |
| Taille boutons min/max/close | **18 px** icône dans **~22 px** (gtk-3 titlebutton) | 20 px puis **32 px** (régression) | Disproportionné vs Muffin réel |
| Hauteur `#windowHeader > nav` | = barre titre | **40 px** (`--head`) | Débordement dans header 31 px |
| Gutter fenêtre (`.windowElement`) | 0 (cadre WM bord à bord) | **2 px** (`--win-client-gutter`) | Header inset, coins décalés |
| `background-size` boutons | contain (thème) | **cover** | Icônes rognées |
| Bordure cadre inactive | 1 px `#303036` | transparente / ombre seule | Cadre peu lisible |

---

## 4. Correctifs CapsuleOS

Fichiers :

- `home/Debian/Mint/style/mint-y-dark-aqua-tokens.css` — `--mint-muffin-control-size: 22px`, `--mint-muffin-control-icon-size: 18px`
- `home/Debian/Mint/style/cinnamon-window-chrome.css` — pastille close en `radial-gradient`, min/max à 18 px, hit box 22 px

Smoke parité :

```bash
node usr/lib/capsuleos/tools/lab/smoke-mint-window-chrome-parity.mjs
```

---

## 5. Relancer la campagne lab

```bash
ssh -i ~/.ssh/capsuleos-lab capsule@192.168.1.146 'DISPLAY=:0 bash -s' \
  < root/tools/lab/vm-mint-window-chrome-inventory.sh \
  > root/docs/inventaires/linux-mint-window-chrome-vm.json

node usr/lib/capsuleos/tools/lab/smoke-mint-window-chrome-parity.mjs
node usr/lib/capsuleos/tools/lab/smoke-mint-window-chrome.mjs
```

---

## 6. Références

- [mint-fenetres-muffin.md](../mint-fenetres-muffin.md)
- [window-chrome-contexts.md](../window-chrome-contexts.md)
- Thème VM : `/usr/share/themes/Mint-Y-Dark-Aqua/cinnamon/`
