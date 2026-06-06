# Fidélité GNOME Fichiers (Nautilus) — CapsuleOS

Référence : [Nautilus sur Ubuntu-fr](https://doc.ubuntu-fr.org/nautilus), captures VM Rocky (`inventory/rocky-vm/audit/03-nautilus-open.png`), gabarit `usr/share/capsuleos/linux/explorers/nautilus/shell-gnome.html`.

## Architecture

| Couche | Fichier |
|--------|---------|
| Gabarit HTML | `usr/share/capsuleos/linux/explorers/nautilus/shell-gnome.html` |
| Skin Rocky | `home/RedHat/Rocky/style/apps/nautilus.skin.css` |
| Moteur commun | `usr/lib/capsuleos/shells/linux/fileExplorer/fileExplorerCore.js` |
| Interactions Nautilus | `fileExplorerNautilus.js` |
| Menu contextuel | `fileExplorerContextMenu.js` |
| Slot runtime | `div.windowElement#nemo[data-link="nemo"]`, template `nemo-gnome` |

## Matrice fonctionnelle

| Fonction (Ubuntu-fr / VM) | Implémentation Capsule | Statut |
|---------------------------|------------------------|--------|
| Sidebar Places (Dossier personnel, Récents, Favoris, Réseau, Corbeille) | `data-link` + `buildNemoPlaceFolderMap()` | OK |
| Dossiers XDG (Bureau, Documents, Musique, Images, Vidéos, Téléchargements) | Sidebar `data-link` | OK |
| Navigation précédent / suivant / parent / accueil | `bindFileExplorerNavigationControls` | OK |
| Recherche dans le dossier courant | `#nemo-search-input` → `searchQuery` | OK |
| Barre d’emplacement (`Ctrl+L`, saisie `/` ou `~`) | `fileExplorerNautilus.js` | OK |
| Vue icônes / liste (`Ctrl+1` / `Ctrl+2`) | `setFileExplorerViewMode` | OK |
| Zoom (`Ctrl+±`) | `applyFileExplorerZoom` | OK |
| Fichiers cachés (`Ctrl+H`) | `fileExplorerState.showHiddenFiles` | OK |
| Nouveau dossier (bouton, `Shift+Ctrl+N`, menu contextuel) | `createNewFolderInCurrentDirectory` | OK |
| Actualiser (`F5`, menu contextuel) | `refreshFileExplorerDirectory` | OK |
| Menu contextuel zone fichiers | `#nemo-context-menu` | OK |
| Propriétés | `#nemo-properties-dialog` + `fileExplorerProperties.js` | OK |
| Bureau — Nouveau dossier (menu bureau) | `gnome-desktop-context-menu.js` | OK |
| Onglets (`Ctrl+T`) | `#nautilus-tabstrip` + `fileExplorerTabs.js` | OK |
| Thème clair / sombre | `nautilus.skin.css` (`html[data-theme]`) | OK |
| Icônes Adwaita (remap Cinnamon) | `explorer-icon-base.js` | OK |
| Glisser-déposer (sidebar + grille) | `fileExplorerDnD.js` | OK |

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
