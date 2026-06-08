# Diff structuré Dolphin — KDE Neon VM → CapsuleOS

> **Points 1–6** — inventaire visuel Dolphin Neon (structurel)  
> **Points 7–9** — interactionnel  
> **Campagne v4 P0** (2026-06-08) : §3 Périphériques + §6 sélection split clôturés  
> Parité globale : [`inventaire-parite-neon.md`](../inventaire-parite-neon.md) · campagne : [`linux-kde-neon-clone-status.md`](linux-kde-neon-clone-status.md)

## Ground truth

| Source | Fichier | Dimensions | Scène |
|--------|---------|------------|-------|
| VM lab | `vm-dolphin.png` | 1280×800 (virsh) | `$HOME`, vue icônes |
| VM lab | `vm-dolphin-compact.png` | 1280×800 | Vue Synthétique |
| VM lab | `vm-dolphin-list.png` | 1280×800 | Vue Détails |
| VM lab | `vm-dolphin-split-only.png` | 1280×800 | Vue scindée (dbus `split_view`) |
| VM lab | `vm-dolphin-split-hamburger.png` | 1280×800 (live) | Split + menu ☰ ouvert |
| VM lab | `vm-dolphin-hamburger-open.png` | — | Menu ☰ complet |
| VM lab | `vm-dolphin-search-open.png` | — | Barre recherche ouverte |
| CapsuleOS | `capsule-dolphin.png` | 1211×756 | Vue icônes |
| CapsuleOS | `capsule-dolphin-compact.png` | 1211×756 | Vue Synthétique |
| CapsuleOS | `capsule-dolphin-list.png` | 1211×756 | Vue Détails |
| CapsuleOS | `capsule-dolphin-split.png` | 1211×756 | Vue scindée |
| CapsuleOS | `capsule-dolphin-split-selection.png` | 1211×756 | Split + sélections indépendantes v4 |
| CapsuleOS | `capsule-dolphin-hamburger.png` | 1211×756 | Split + menu hamburger |
| CapsuleOS | `capsule-dolphin-search-open.png` | 1211×756 | Recherche ouverte |
| CapsuleOS | `capsule-dolphin-search-filter-open.png` | 1211×756 | Menu filtre recherche |

Regénération :

```bash
# VM
bash root/tools/lab/vm-kde-neon-dolphin-views-playbook.sh    # icônes + compact + list
bash root/tools/lab/vm-kde-neon-dolphin-split-playbook.sh    # split-only
bash root/tools/lab/vm-kde-neon-capture-host.sh --dolphin-hamburger

# CapsuleOS (serveur 5500)
node root/tools/lab/capture-capsule-kde-neon.mjs             # scènes Neon incl. Dolphin
```

**Note comparaison** : viewports 1280×800 (VM) vs 1211×756 (Capsule). Diff **structurel et chromatique** ; pas de pixel-diff strict sans crop fenêtre.  
**Note §6 v4** : la paire VM `vm-dolphin-split-only.png` valide la structure ; la paire Capsule `capsule-dolphin-split-selection.png` valide la sélection indépendante (sans ydotool sur VM lab).

---

## Synthèse parité

| Zone | Statut v3 | Statut v4 P0 | Reste ouvert |
|------|-----------|--------------|--------------|
| Titlebar | 🔄 réaudit | ✅ | — |
| Toolbar (pathbar, loupe, scinder, ☰) | 🔄 réaudit | ✅ | — |
| Vue icônes (grille) | 🔄 réaudit | ✅ | espacement colonnes ⚠️ mineur |
| Vues Synthétique / Détails | 🔄 réaudit | ✅ | — |
| Split structurel | 🔄 réaudit | ✅ | capture VM 2026-06-08 |
| **Sélection split §6** | ⚠️ P2 | ✅ | smoke + capture Capsule |
| **Recherche + filtre** | ✅ | ✅ | — |
| **Hamburger flyouts** | ✅ | ✅ | — |
| **Sidebar §3 Périphériques** | ⏸ P2 | ✅ empty-state | USB réel si VM branchée |
| Menu contextuel | 🟡 P2 | 🟡 | flyouts simulation ✅ |
| Footer status | 🔄 | ✅ masqué | — |

---

## Matrice zone par zone

Légende : ✅ OK · ⚠️ écart mineur · 🟡 code sans clôture VM · ❌ P0 · ⏸ P2

### 1. Barre titre — ✅

| Élément | VM | CapsuleOS | Statut |
|---------|-----|-----------|--------|
| Titre | « Dossier **P**ersonnel — Dolphin » | idem (tiret cadratin) | ✅ |
| Icône app | icône Dolphin seule | icône Dolphin, pin masqué | ✅ |
| Menubar texte | absent | masqué (`dolphin.skin.css`) | ✅ |
| Contrôles fenêtre | Plasma | Plasma (filtre CSS) | ✅ |

### 2. Toolbar — ✅

| Élément | VM | CapsuleOS | Statut |
|---------|-----|-----------|--------|
| Retour / Suivant | ✅ | ✅ | ✅ |
| Mode affichage | menu déclencheur | `#dolphin-view-mode-btn` seul | ✅ |
| Pathbar | `> Dossier Personnel` | idem, aligné grille | ✅ |
| Recherche | loupe seule | bouton loupe entre Scinder et ☰ | ✅ |
| Aperçu | absent | masqué | ✅ |
| Scinder | texte + icône | idem | ✅ |
| Menu hamburger | ☰ | `#dolphin-main-menu` + menu complet | ✅ |

### 3. Sidebar — ✅ v4 P0

| Élément | Statut | Note |
|---------|--------|------|
| Item actif Dossier Personnel | ✅ | |
| Images / Réseau | ✅ | places16 corrigés |
| Corbeille colorée | ✅ | `places32/user-trash.svg` Breeze |
| Section Périphériques | ✅ | empty-state Neon · VM `/media` vide · smoke ✅ |

### 4. Vue icônes — ✅

| Élément | Statut |
|---------|--------|
| 8 dossiers Breeze bleus | ✅ |
| Bureau preview wallpaper | ✅ |
| Pill « 8 dossiers » | ✅ |
| Grille 4 colonnes / padding | ⚠️ mineur |

### 5. Vues Synthétique / Détails — ✅

| Élément | Statut |
|---------|--------|
| Compact 2 colonnes si largeur OK | ✅ |
| Détails Nom / Taille / Modifié | ✅ |
| Taille dossiers vide | ✅ |
| Ligne guide icônes liste | ✅ |

### 6. Split + hamburger structurel — ✅ v4 P0

| Élément | Statut |
|---------|--------|
| 2 volets 50/50 | ✅ |
| 2 pathbars toolbar | ✅ |
| Scinder actif (surbrillance) | ✅ |
| Menu ☰ items racine VM | ✅ |
| Bouton Fermer pathbar droite | ⚠️ VM natif vs toggle Scinder Capsule |
| Sélection indépendante volet droit | ✅ |
| Capture paire structure | `vm-dolphin-split-only.png` ↔ `capsule-dolphin-split.png` | ✅ 2026-06-08 |
| Capture paire sélection | — ↔ `capsule-dolphin-split-selection.png` | ✅ 2026-06-08 |

### 7. Barre recherche + filtre — ✅

| Élément | VM | CapsuleOS | Statut |
|---------|-----|-----------|--------|
| Ouverture loupe toolbar | barre sous toolbar | `#dolphin-search-bar` | 🟡 |
| Champ « Rechercher… » | ✅ | `#dolphin-search` | 🟡 |
| Bouton Filtrer (plat Breeze) | pas dégradé bleu | style plat `#eff0f1` | 🟡 |
| Menu filtre (portée, indexer…) | radios KDE | `data-dolphin-filter-v=2` | 🟡 |
| Icônes indexation | Breeze | `./assets/...` + `resolveCapsuleResourceUrl` | 🟡 |
| Capture paire VM | `vm-dolphin-search-open.png` | `capsule-dolphin-search-open.png` | ✅ 2026-06-08 |
| Capture paire filtre | `vm-dolphin-search-filter-open.png` | `capsule-dolphin-search-filter-open.png` | ✅ 2026-06-08 |

### 8. Menu hamburger + flyouts — ✅

| Élément | VM | CapsuleOS | Statut |
|---------|-----|-----------|--------|
| Items racine (labels VM) | dbus + source KDE | `HAMBURGER_ITEMS` v4 | 🟡 |
| Sous-menus `>` | Créer, Affichage, Panneaux, Configurer, Aide, Plus | `HAMBURGER_SUBMENUS` flyouts hover | 🟡 |
| Icônes menu + flyouts | Breeze colorées | `./assets/images/toolkits/kde/...` | 🟡 |
| Actions branchées | natif | open-tab, split, panneaux, etc. | 🟡 |
| Capture paire VM | `vm-dolphin-hamburger-open.png` | `capsule-dolphin-hamburger.png` | ✅ 2026-06-08 |

### 9. Menu contextuel — ⏳ V4-P1 backlog

| Élément | Statut | Note |
|---------|--------|------|
| Clic droit fichier/dossier/fond | ✅ partiel | noyau `fileExplorerContextMenu.js` |
| Flyouts sous-menus | ⏳ | dupliquer, étiquettes, activités |
| Icônes KDE | ✅ | `DOLPHIN_CONTEXT_MENU_ICONS` |

---

## Checklist clôture v4 P0

- [x] Section Périphériques sidebar (`dolphin-neon.js` + CSS)
- [x] Sélection indépendante split (`paneSelection` noyau + `fileExplorerDolphin.js`)
- [x] Capture VM `vm-dolphin-split-only.png`
- [x] Capture Capsule `capsule-dolphin-split-selection.png`
- [x] `smoke-kde-neon-dolphin.mjs` (split + périphériques)

---

## Fichiers source

| Rôle | Chemin |
|------|--------|
| Skin Neon | `home/Debian/KDE-Neon/style/apps/dolphin.skin.css` |
| JS Neon | `home/Debian/KDE-Neon/js/dolphin-neon.js` |
| Noyau split | `usr/lib/capsuleos/shells/linux/fileExplorer/fileExplorerCore.js` |
| Menu contextuel noyau | `usr/lib/capsuleos/shells/linux/fileExplorer/fileExplorerContextMenu.js` |
| Template | `usr/share/capsuleos/linux/explorers/dolphin/shell.html` |
| Captures Capsule | `root/tools/lab/capture-capsule-kde-neon.mjs` |
| Captures VM | `root/tools/lab/vm-kde-neon-capture-host.sh` |
