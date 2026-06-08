# Diff structuré Dolphin — KDE Neon VM → CapsuleOS

> **Points 1–6** — inventaire visuel Dolphin Neon (structurel)  
> **Points 7–9** — interactionnel (réouvert campagne v2, 2026-06-08)  
> **Statut global** : 🔄 **réaudit v2** — clôture v1 (2026-06-07) réouverte  
> Parité globale : [`inventaire-parite-neon.md`](../inventaire-parite-neon.md) · campagne : [`linux-kde-neon-clone-status.md`](linux-kde-neon-clone-status.md)

## Ground truth

| Source | Fichier | Dimensions | Scène |
|--------|---------|------------|-------|
| VM lab | `vm-dolphin.png` | 1280×800 (virsh) | `$HOME`, vue icônes |
| VM lab | `vm-dolphin-compact.png` | 1280×800 | Vue Synthétique |
| VM lab | `vm-dolphin-list.png` | 1280×800 | Vue Détails |
| VM lab | `vm-dolphin-split-only.png` | 1280×800 | Vue scindée (dbus `split_view`) |
| VM lab | `vm-dolphin-split-hamburger.png` | 1280×800 (live) | Split + menu ☰ ouvert |
| VM lab | `vm-dolphin-hamburger-open.png` | — | Menu ☰ complet (à capturer v2) |
| VM lab | `vm-dolphin-search-open.png` | — | Barre recherche ouverte (à capturer v2) |
| CapsuleOS | `capsule-dolphin.png` | 1211×756 | Vue icônes |
| CapsuleOS | `capsule-dolphin-compact.png` | 1211×756 | Vue Synthétique |
| CapsuleOS | `capsule-dolphin-list.png` | 1211×756 | Vue Détails |
| CapsuleOS | `capsule-dolphin-split.png` | 1211×756 | Vue scindée |
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

---

## Synthèse parité

| Zone | Statut v1 | Statut v2 | Reste ouvert |
|------|---------|-----------|--------------|
| Titlebar | ✅ | 🔄 réaudit | — |
| Toolbar (pathbar, loupe, scinder, ☰) | ✅ | 🔄 réaudit | — |
| Vue icônes (grille) | ✅ | 🔄 réaudit | espacement colonnes ⚠️ |
| Vues Synthétique / Détails | ✅ | 🔄 réaudit | — |
| Split + hamburger structurel | ✅ | 🔄 réaudit | sélection volet droit ⚠️ P2 |
| **Recherche + filtre** | — | 🟡 code | captures VM + matrice §7 |
| **Hamburger flyouts** | — | 🟡 code | captures VM + matrice §8 |
| Sidebar | ✅ | 🔄 réaudit | Périphériques ⏸ P2 |
| Menu contextuel | partiel | ⏳ P2 | flyouts, dupliquer, étiquettes |
| Footer status | ✅ masqué | 🔄 | — |

---

## Matrice zone par zone

Légende : ✅ OK · ⚠️ écart mineur · 🟡 code sans clôture VM · ❌ P0 · ⏸ P2

### 1. Barre titre — 🔄 réaudit v2

| Élément | VM | CapsuleOS | Statut |
|---------|-----|-----------|--------|
| Titre | « Dossier **P**ersonnel — Dolphin » | idem (tiret cadratin) | ✅ |
| Icône app | icône Dolphin seule | icône Dolphin, pin masqué | ✅ |
| Menubar texte | absent | masqué (`dolphin.skin.css`) | ✅ |
| Contrôles fenêtre | Plasma | Plasma (filtre CSS) | ✅ |

### 2. Toolbar — 🔄 réaudit v2

| Élément | VM | CapsuleOS | Statut |
|---------|-----|-----------|--------|
| Retour / Suivant | ✅ | ✅ | ✅ |
| Mode affichage | menu déclencheur | `#dolphin-view-mode-btn` seul | ✅ |
| Pathbar | `> Dossier Personnel` | idem, aligné grille | ✅ |
| Recherche | loupe seule | bouton loupe entre Scinder et ☰ | ✅ |
| Aperçu | absent | masqué | ✅ |
| Scinder | texte + icône | idem | ✅ |
| Menu hamburger | ☰ | `#dolphin-main-menu` + menu complet | ✅ |

### 3. Sidebar — 🔄 réaudit v2

| Élément | Statut | Note |
|---------|--------|------|
| Item actif Dossier Personnel | ✅ | |
| Images / Réseau | ✅ | places16 corrigés |
| Corbeille colorée | ✅ | `places32/user-trash.svg` Breeze |
| Section Périphériques | ⏸ P2 | |

### 4. Vue icônes — 🔄 réaudit v2

| Élément | Statut |
|---------|--------|
| 8 dossiers Breeze bleus | ✅ |
| Bureau preview wallpaper | ✅ |
| Pill « 8 dossiers » | ✅ |
| Grille 4 colonnes / padding | ⚠️ mineur |

### 5. Vues Synthétique / Détails — 🔄 réaudit v2

| Élément | Statut |
|---------|--------|
| Compact 2 colonnes si largeur OK | ✅ |
| Détails Nom / Taille / Modifié | ✅ |
| Taille dossiers vide | ✅ |
| Ligne guide icônes liste | ✅ |

### 6. Split + hamburger structurel — 🔄 réaudit v2

| Élément | Statut |
|---------|--------|
| 2 volets 50/50 | ✅ |
| 2 pathbars toolbar | ✅ |
| Scinder actif (surbrillance) | ✅ |
| Menu ☰ items racine VM | ✅ |
| Bouton Fermer pathbar droite | ⚠️ VM natif vs toggle Scinder Capsule |
| Sélection indépendante volet droit | ⚠️ P2 |

### 7. Barre recherche + filtre — 🟡 ouvert v2

| Élément | VM | CapsuleOS | Statut |
|---------|-----|-----------|--------|
| Ouverture loupe toolbar | barre sous toolbar | `#dolphin-search-bar` | 🟡 |
| Champ « Rechercher… » | ✅ | `#dolphin-search` | 🟡 |
| Bouton Filtrer (plat Breeze) | pas dégradé bleu | style plat `#eff0f1` | 🟡 |
| Menu filtre (portée, indexer…) | radios KDE | `data-dolphin-filter-v=2` | 🟡 |
| Icônes indexation | Breeze | `./assets/...` + `resolveCapsuleResourceUrl` | 🟡 |
| Capture paire VM | `vm-dolphin-search-open.png` | `capsule-dolphin-search-open.png` | ✅ 2026-06-08 |

### 8. Menu hamburger + flyouts — 🟡 ouvert v2

| Élément | VM | CapsuleOS | Statut |
|---------|-----|-----------|--------|
| Items racine (labels VM) | dbus + source KDE | `HAMBURGER_ITEMS` v4 | 🟡 |
| Sous-menus `>` | Créer, Affichage, Panneaux, Configurer, Aide, Plus | `HAMBURGER_SUBMENUS` flyouts hover | 🟡 |
| Icônes menu + flyouts | Breeze colorées | `./assets/images/toolkits/kde/...` | 🟡 |
| Actions branchées | natif | open-tab, split, panneaux, etc. | 🟡 |
| Capture paire VM | `vm-dolphin-hamburger-open.png` | `capsule-dolphin-hamburger.png` | ✅ 2026-06-08 |

### 9. Menu contextuel — ⏳ P2

| Élément | Statut | Note |
|---------|--------|------|
| Clic droit fichier/dossier/fond | ✅ partiel | noyau `fileExplorerContextMenu.js` |
| Flyouts sous-menus | ⏳ | dupliquer, étiquettes, activités |
| Icônes KDE | ✅ | `DOLPHIN_CONTEXT_MENU_ICONS` |

---

## Checklist clôture v2 (cible H₆)

### Structurel (points 1–6) — réaudit

- [ ] Captures VM vues rafraîchies post-merge
- [ ] Captures Capsule paires régénérées
- [ ] Matrice 1–6 revalidée visuellement HTTP

### Interactionnel (points 7–9) — ouvert

- [x] Code recherche + filtre (`dolphin-neon.js`, `dolphin.skin.css`)
- [x] Code hamburger v4 + flyouts + icônes
- [x] Captures VM paires recherche / hamburger / filtre (Capsule : `search-filter-open` ; VM filtre : P2)
- [ ] Playwright audit icônes (naturalWidth > 0)
- [ ] Menu contextuel P2 planifié

---

## Fichiers source

| Rôle | Chemin |
|------|--------|
| Skin Neon | `home/Debian/KDE-Neon/style/apps/dolphin.skin.css` |
| JS Neon | `home/Debian/KDE-Neon/js/dolphin-neon.js` |
| Menu contextuel noyau | `usr/lib/capsuleos/shells/linux/fileExplorer/fileExplorerContextMenu.js` |
| Template | `usr/share/capsuleos/linux/explorers/dolphin/shell.html` |
| Captures Capsule | `root/tools/lab/capture-capsule-kde-neon.mjs` |
| Captures VM | `root/tools/lab/vm-kde-neon-capture-host.sh` |
