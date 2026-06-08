# Analyse Logithèque — VM Linux Mint 22.3 → CapsuleOS

**Objectif** : ground truth pour le slot `mintinstall` (distinct de `update_manager` / mintupdate).

**Collecte** : SSH `capsule@192.168.1.146` · campagne 2026-06-08.

---

## 1. Identité VM

| Élément | VM |
|---------|-----|
| Paquet | **mintinstall 8.4.0** |
| Binaire | `/usr/bin/mintinstall` |
| `.desktop` | `mintinstall.desktop` — **Logithèque** (FR) / Software Manager (EN) |
| WM class | `mintinstall.py.Mintinstall.py` |
| UI | GTK3 + gresource |
| Géométrie | **852×784** (wmctrl, fenêtre « Logithèque ») |

---

## 2. Anatomie visuelle

- Barre supérieure : champ **Rechercher des applications…** + menu hamburger
- Panneau gauche : **Accueil**, **Tous les logiciels**, **Flatpak**, séparateur, catégories (Internet, Bureautique, Graphisme, Jeux, Multimédia, …), **Installés**
- Vue **Accueil** : tuiles applications en vedette (VLC, Audacity, FileZilla, VS Code, …)
- Vue catégorie / recherche : liste avec icône, nom, description, bouton **Installer**

---

## 3. Implémentation CapsuleOS (#14)

| Zone | Fidélité |
|------|----------|
| Slot dédié `mintinstall` (≠ `update_manager`) | **P0** |
| Titre fenêtre « Logithèque » | **P0** |
| Géométrie 852×784 | **P0** |
| Accueil + vedette (4 apps VM) | **P0** |
| Recherche + catégories sidebar | **P0** |
| Installation simulée (bouton → Installé) | **P1** |
| Catalogue complet 101 apps menu | **P4** (hors #14) |

---

## 4. Commandes lab

```bash
ssh capsule@192.168.1.146 'DISPLAY=:0 mintinstall &'
node usr/lib/capsuleos/tools/lab/smoke-mint-mintinstall.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
```
