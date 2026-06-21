# Nemo — VM Linux Mint 22.3 (sombre) → CapsuleOS

**Collecte** : SSH `<lab-inventory:linux-mint-nemo>` · [`vm-mint-nemo-inventory.sh`](../../tools/lab/vm-mint-nemo-inventory.sh) · JSON [`linux-mint-nemo-vm.json`](linux-mint-nemo-vm.json).

---

## 1. Contexte VM

| Élément | VM |
|---------|-----|
| Nemo | **6.6.3+zena** |
| Thème GTK / Cinnamon | **Mint-Y-Dark-Aqua** |
| Vue par défaut | `icon-view` |
| Sidebar | `places`, largeur **170 px** |
| Fenêtre type | 800×550 |

---

## 2. Couleurs GTK (ground truth)

Extrait `gtk-3.0/gtk-dark.css` :

| Zone | VM | CapsuleOS (avant) |
|------|-----|-------------------|
| Sidebar | **#2c2c31** | #27272b |
| Contenu fichiers | **#222226** | #2e2e33 |
| Toolbar / header app | **#222226** | #2e2e33 / #27272b |
| Séparateurs | **#202023** | #303036 |
| Pathbar fond | **#2e2e33** | #303036 |
| Pathbar texte | **#dadada** | #e1e1e1 |
| Sélection sidebar | **#1f9ede** plein + texte blanc | rgba aqua 14–18 % |
| Survol sidebar | **rgba(255,255,255,0.12)** | aqua + bordure gauche |

---

## 3. Structure DOM

| Élément | VM | CapsuleOS (avant) |
|---------|-----|-------------------|
| Sections sidebar (`Poste de travail`, `Marque-pages`, `Réseau`) | repliables | absentes dans `shell.html` |
| Système de fichiers / Corbeille | icônes et labels corrects | **inversés** dans `shell.html` |
| Footer places/tree/F9 | boutons `nemo-footer-btn` | liens `<a>` |
| Recherche / path mode | `#nemo-search`, `#nemo-toggle-path-mode` | IDs manquants |

**Cause** : le gabarit canonique `explorers/nemo/shell.html` n’avait pas été resynchronisé depuis `linux/apps/nemo.html`.

---

## 4. Correctifs CapsuleOS

- `usr/share/capsuleos/linux/explorers/nemo/shell.html` — resync toolbar, sidebar, footer depuis `nemo.html`
- `usr/share/capsuleos/linux/explorers/nemo/base.css` — règles search, breadcrumb, footer-btn, tree
- `home/Debian/Mint/style/apps/nemo.skin.css` — tokens Mint-Y-Dark-Aqua, sidebar 170 px, sélection pleine aqua

Smoke : `node usr/lib/capsuleos/tools/lab/smoke-mint-nemo.mjs`

---

## 5. Relancer la campagne

```bash
ssh -i ~/.ssh/capsuleos-lab <lab-inventory:linux-mint-nemo> 'DISPLAY=:0 bash -s' \
  < root/tools/lab/vm-mint-nemo-inventory.sh \
  > root/docs/inventaires/linux-mint-nemo-vm.json

node usr/lib/capsuleos/tools/lab/smoke-mint-nemo.mjs
```
