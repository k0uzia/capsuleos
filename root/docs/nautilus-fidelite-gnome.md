# Fidélité GNOME Fichiers (Nautilus) — CapsuleOS

Référence : [Nautilus sur Ubuntu-fr](https://doc.ubuntu-fr.org/nautilus), captures VM Rocky (`inventory/rocky-vm/audit/03-nautilus-open.png`), gabarit `usr/share/capsuleos/linux/explorers/nautilus/shell-gnome.html`.

## Architecture

| Couche | Fichier |
|--------|---------|
| Gabarit HTML | `usr/share/capsuleos/linux/explorers/nautilus/shell-gnome.html` |
| Skin Rocky | `home/RedHat/Rocky/style/apps/nautilus.skin.css` |
| Moteur commun | `usr/lib/capsuleos/shells/linux/fileExplorer/fileExplorerCore.js` |
| Interactions Nautilus | `fileExplorerNautilus.js` |
| Headerbar (boutons + popovers) | `fileExplorerNautilusHeaderbar.js` |
| Playbook contrôles headerbar | `root/docs/inventaires/nautilus-headerbar-playbook.json` |
| Menu contextuel | `fileExplorerContextMenu.js` |
| Slot runtime | `div.windowElement#nemo[data-link="nemo"]`, template `nemo-gnome` |

## Matrice fonctionnelle

| Fonction (Ubuntu-fr / VM) | Implémentation Capsule | Statut |
|---------------------------|------------------------|--------|
| Sidebar Places (Dossier personnel, Récents, Favoris, Réseau, Corbeille) | `data-link` + `buildNemoPlaceFolderMap()` | OK |
| Dossiers XDG (Bureau, Documents, Musique, Images, Vidéos, Téléchargements) | Sidebar `data-link` | OK |
| Navigation précédent / suivant / parent / accueil | `bindFileExplorerNavigationControls` | OK |
| Fil d’Ariane par défaut (pilule « Dossier personnel » + menu ⋮) | `#nautilus-path-crumbbar` + `nautilusChromeMode: breadcrumb` | OK |
| Rechercher partout (loupe plateau titre, empty state) | `search-everywhere` + `#nautilus-search-empty` | OK |
| Recherche dans le dossier courant (`Ctrl+F`) | `search-folder` + `#nemo-search-input` | OK |
| Barre d’emplacement (`Ctrl+L`, saisie `/` ou `~`) | `location` + `fileExplorerNautilus.js` | OK |
| Vue icônes / liste (`Ctrl+1` / `Ctrl+2`) | `setFileExplorerViewMode` | OK |
| Zoom (`Ctrl+±`) | `applyFileExplorerZoom` | OK |
| Fichiers cachés (`Ctrl+H`) | `fileExplorerState.showHiddenFiles` | OK |
| Nouveau dossier (bouton, `Shift+Ctrl+N`, menu contextuel) | `createNewFolderInCurrentDirectory` | OK |
| Actualiser (`F5`, menu contextuel) | `refreshFileExplorerDirectory` | OK |
| Menu contextuel élément / fond de liste | `#nemo-context-menu` (scopes item/background) | OK |
| États vides (dossier, favoris, réseau…) | `.nautilus-folder-empty` | OK |
| Barre connexion réseau + aide protocoles | `#nautilus-network-bar` + `#nautilus-network-info-menu` | OK |
| Fil d’Ariane multi-segments cliquable | `#nautilus-path-crumbs` | OK |
| Pastille sélection « X sélectionné » | `#nemo-status-label` + `updateNautilusSelectionStatus` | OK |
| Propriétés | `#nemo-properties-dialog` + `fileExplorerProperties.js` | OK |
| Bureau — Nouveau dossier (menu bureau) | `gnome-desktop-context-menu.js` | OK |
| Onglets (`Ctrl+T`) | `#nautilus-tabstrip` + `fileExplorerTabs.js` (état isolé + `localStorage`) | OK |
| Thème clair / sombre | `nautilus.skin.css` (`html[data-theme]`) | OK |
| Icônes Adwaita (remap Cinnamon) | `explorer-icon-base.js` | OK |
| Glisser-déposer (sidebar + grille) | `fileExplorerDnD.js` | OK |
| Couper / Copier / Coller | `fileExplorerNautilusOps.js` + raccourcis | OK |
| Renommer (`F2`) | `renameExplorerItem` | OK |
| Corbeille (`Suppr`) | `trashExplorerItem` + `localStorage` | OK |
| Compresser | `compressExplorerItems` | OK |
| Rechercher partout (manifeste entier) | `renderNautilusSearchEverywhere` | OK |
| Favoris / signets (`Ctrl+D`) | `addNautilusBookmark` + place Favoris | OK |
| Connexions réseau | `connectNautilusNetworkServer` | OK |
| Annuler / Rétablir | `undoExplorerOperation` / `redoExplorerOperation` | OK |

## Headerbar (playbook)

Référence machine : `root/docs/inventaires/nautilus-headerbar-playbook.json` (aligné [Ubuntu-fr Nautilus](https://doc.ubuntu-fr.org/nautilus)).

| Contrôle | Comportement VM | Capsule |
|----------|-----------------|---------|
| Loupe plateau titre | Mode « Rechercher partout » | `setNautilusChromeMode('search-everywhere')` |
| Menu ☰ | Nouvelle fenêtre, onglet, Annuler/Rétablir, Préférences, Aide, À propos | `#nautilus-main-menu` |
| Pilule chemin + ⋮ | Nouveau dossier, console, actualiser, signets, emplacement, copier, propriétés | `#nautilus-path-menu` |
| Précédent / Suivant | Historique | `#precedent` / `#suivant` |
| Filtres recherche | Quoi / type / texte intégral vs nom | `#nautilus-search-filter-menu` |
| Emplacement (ⓘ) | `Ctrl+L` / retour fil d’Ariane | `setNautilusChromeMode('location' \| 'breadcrumb')` |
| Vues liste / icônes | `Ctrl+1` / `Ctrl+2` | `[data-view-mode]` |
| Menu autres vues | Taille icône ±, tri A-Z/Z-A, fichiers cachés | `#nautilus-view-menu` |

Modes chrome (`fileExplorerState.nautilusChromeMode`, persistés par onglet) : `breadcrumb` | `search-folder` | `search-everywhere` | `location`.

Réinjection gabarit : `resetFileExplorerSlotBindings()` dans `contentLoader` évite les écouteurs orphelins après `injectSlot`.

## Places virtuelles

| Place | Constante | Comportement |
|-------|-----------|--------------|
| Récents | `CAPSULE_PLACE_RECENT` | Fichiers récents du manifeste |
| Favoris | `CAPSULE_PLACE_STARRED` | État vide « Aucun favori » |
| Corbeille | `CAPSULE_PLACE_TRASH` | État vide |
| Réseau | `CAPSULE_PLACE_NETWORK` | État vide |
| Système de fichiers | `CAPSULE_PLACE_FILESYSTEM` | Racine VFS ou lien vers home |

## Smokes lab

```bash
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-gnome-nautilus-routing.mjs
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-gnome-nautilus-interactions.mjs
node root/tools/lab/audit-nautilus-rocky.mjs
```

## Clôture skin

Après modification `home/RedHat/Rocky/` :

```bash
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
```
