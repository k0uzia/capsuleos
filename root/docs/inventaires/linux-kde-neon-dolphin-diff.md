# Diff structuré Dolphin — KDE Neon VM → CapsuleOS

> **Points 1–6** — inventaire visuel Dolphin Neon  
> **Statut** : Points 2–6 ✅ · Point 3 ✅ P0 (2026-06-07) · Périphériques ⏸ P2  
> Parité globale : [`inventaire-parite-neon.md`](../inventaire-parite-neon.md)

## Ground truth

| Source | Fichier | Dimensions | Scène |
|--------|---------|------------|-------|
| VM lab | `vm-dolphin.png` | 1280×800 (virsh) | `$HOME`, vue icônes |
| VM lab | `vm-dolphin-compact.png` | 1280×800 | Vue Synthétique |
| VM lab | `vm-dolphin-list.png` | 1280×800 | Vue Détails |
| VM lab | `vm-dolphin-split-only.png` | 1280×800 | Vue scindée (dbus `split_view`) |
| VM lab | `vm-dolphin-split-hamburger.png` | 1280×800 (live) | Split + menu ☰ ouvert |
| CapsuleOS | `capsule-dolphin.png` | 1211×756 | Vue icônes |
| CapsuleOS | `capsule-dolphin-compact.png` | 1211×756 | Vue Synthétique |
| CapsuleOS | `capsule-dolphin-list.png` | 1211×756 | Vue Détails |
| CapsuleOS | `capsule-dolphin-split.png` | 1211×756 | Vue scindée |
| CapsuleOS | `capsule-dolphin-hamburger.png` | 1211×756 | Split + menu hamburger |

Regénération :

```bash
# VM
bash root/tools/lab/vm-kde-neon-dolphin-views-playbook.sh    # icônes + compact + list
bash root/tools/lab/vm-kde-neon-dolphin-split-playbook.sh    # split-only

# CapsuleOS (serveur 5500)
node root/tools/lab/capture-capsule-kde-neon.mjs             # toutes scènes Neon incl. Dolphin
```

**Note comparaison** : viewports 1280×800 (VM) vs 1211×756 (Capsule). Diff **structurel et chromatique** ; pas de pixel-diff strict sans crop fenêtre.

---

## Synthèse parité (post point 6)

| Zone | Statut | Reste ouvert |
|------|--------|--------------|
| Titlebar | ✅ | — |
| Toolbar (pathbar, loupe, scinder, ☰) | ✅ | — |
| Vue icônes (grille) | ✅ | espacement colonnes ⚠️ mineur |
| Vues Synthétique / Détails | ✅ | — |
| Split + hamburger | ✅ | sélection volet droit VM ⚠️ P2 |
| Sidebar | ✅ | Périphériques ⏸ P2 |
| Footer status | ✅ masqué | — |

---

## Matrice zone par zone (état 2026-06-07)

Légende : ✅ OK · ⚠️ écart mineur · ❌ P0 · ⏸ P2

### 1. Barre titre

| Élément | VM | CapsuleOS | Statut |
|---------|-----|-----------|--------|
| Titre | « Dossier **P**ersonnel — Dolphin » | idem (tiret cadratin) | ✅ |
| Icône app | icône Dolphin seule | icône Dolphin, pin masqué | ✅ |
| Menubar texte | absent | masqué (`dolphin.skin.css`) | ✅ |
| Contrôles fenêtre | Plasma | Plasma (filtre CSS) | ✅ |

### 2. Toolbar

| Élément | VM | CapsuleOS | Statut |
|---------|-----|-----------|--------|
| Retour / Suivant | ✅ | ✅ | ✅ |
| Mode affichage | menu déclencheur | `#dolphin-view-mode-btn` seul | ✅ |
| Pathbar | `> Dossier Personnel` | idem, aligné grille | ✅ |
| Recherche | loupe seule | bouton loupe entre Scinder et ☰ | ✅ |
| Aperçu | absent | masqué | ✅ |
| Scinder | texte + icône | idem | ✅ |
| Menu hamburger | ☰ | `#dolphin-main-menu` + menu complet | ✅ |

### 3. Sidebar

| Élément | Statut | Note |
|---------|--------|------|
| Item actif Dossier Personnel | ✅ | |
| Images / Réseau | ✅ | places16 corrigés |
| Corbeille colorée | ✅ | `places32/user-trash.svg` Breeze |
| Section Périphériques | ⏸ P2 | |

### 4. Vue icônes

| Élément | Statut |
|---------|--------|
| 8 dossiers Breeze bleus | ✅ |
| Bureau preview wallpaper | ✅ |
| Pill « 8 dossiers » | ✅ |
| Grille 4 colonnes / padding | ⚠️ mineur |

### 5. Vues Synthétique / Détails

| Élément | Statut |
|---------|--------|
| Compact 2 colonnes si largeur OK | ✅ |
| Détails Nom / Taille / Modifié | ✅ |
| Taille dossiers vide | ✅ |
| Ligne guide icônes liste | ✅ |

### 6. Split + hamburger

| Élément | Statut |
|---------|--------|
| 2 volets 50/50 | ✅ |
| 2 pathbars toolbar | ✅ |
| Scinder actif (surbrillance) | ✅ |
| Menu ☰ items VM | ✅ |
| Bouton Fermer pathbar droite | ⚠️ VM natif vs toggle Scinder Capsule |
| Sélection indépendante volet droit | ⚠️ P2 |

---

## Checklist point 6 — clôture Dolphin

- [x] Captures VM vues (`vm-dolphin{,-compact,-list}.png`)
- [x] Capture VM split (`vm-dolphin-split-only.png`)
- [x] Captures Capsule paires (`capsule-dolphin*.png`)
- [x] Scripts lab : `capture-capsule-kde-neon.mjs`, playbooks VM views + split
- [x] Matrice diff mise à jour
- [x] Point 3 sidebar P0 (Corbeille colorée)
- [ ] Pixel-diff automatisé (hors scope — viewports différents)

**Suite campagne Neon** : relecture bureau P0 · gates · profil `active` (reactivation-queue).

---

## Fichiers source

| Rôle | Chemin |
|------|--------|
| Skin Neon | `home/Debian/KDE-Neon/style/apps/dolphin.skin.css` |
| JS Neon | `home/Debian/KDE-Neon/js/dolphin-neon.js` |
| Template | `usr/share/capsuleos/linux/explorers/dolphin/shell.html` |
| Captures Capsule | `root/tools/lab/capture-capsule-kde-neon.mjs` |
| Captures VM | `root/tools/lab/vm-kde-neon-capture-host.sh` |
