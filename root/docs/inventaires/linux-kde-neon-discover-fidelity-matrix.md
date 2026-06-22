# Matrice de fidélité Discover — KDE Neon (VM ↔ Capsule)

> Objectif : audit exhaustif P0→P2, fondé sur références VM et docs existantes.
> Orchestrateur complet : `node root/tools/lab/run-discover-kde-neon-recursive-capture.mjs`

## Références

- Captures VM/Capsule : `home/public/Images/screen_KDE-Neon/`
- Closure / doc : `root/docs/inventaires/linux-kde-neon-discover-closure.md`
- Diff fiche VLC : `root/docs/inventaires/linux-kde-neon-discover-detail-diff.md`
- Interactions (slot update_manager) : `root/docs/inventaires/interactions/linux-kde-neon/update_manager.json`
- Inventaires VM :  
  - Sidebar : `root/docs/inventaires/linux-kde-neon-discover-sidebar-icons.json`  
  - Catégories : `root/docs/inventaires/linux-kde-neon-discover-category-apps.json`  
  - Fiches Installé(s) : `root/docs/inventaires/linux-kde-neon-discover-installed-app-details.json`

## Matrice par vue

### Accueil (Home)

- VM : `vm-discover.png`
- Capsule : `capsule-discover.png`
- Smokes : `smoke-discover-vm-parity.mjs`, `smoke-kde-neon-discover.mjs`, `smoke-discover-kde-neon.mjs`
- Écarts connus (à revalider VM) :
  - Surcouche Capsule : section « À découvrir » (catalogue magasin CapsuleOS) — documentée comme hors VM.

### Installé(s) — liste

- VM : `vm-discover-installed.png`
- Capsule : `capsule-discover-installed.png`, `capsule-discover-installed-windowed.png`
- Smokes : `smoke-discover-vm-parity.mjs`, `smoke-kde-neon-discover.mjs`
- Écarts connus : aucun bloquant (liste VM ↔ Capsule OK).

### Fiche application (store : catalogue CapsuleOS)

- VM : (hors scope VM, surcouche produit)
- Capsule : `capsule-discover.png` (section), fiche via smoke runtime (LibreOffice)
- Smokes : `smoke-discover-kde-neon.mjs`, `smoke-discover-neon-store-icons.mjs`
- Points de fidélité :
  - Icônes `iconClass` magasin (chemins logiques `./assets/…`).

### Fiche application (VLC — référence VM)

- VM : `vm-discover-detail-vlc.png`, `vm-discover-detail-vlc-scrolled.png`
- Capsule : `capsule-discover-detail-vlc.png`, `capsule-discover-detail-vlc-scrolled.png`
- Smokes : `smoke-discover-vm-parity.mjs`, `smoke-kde-neon-discover.mjs`
- Écarts connus (P2) :
  - Actions backend décoratives (Partager/Supprimer), ratings live non reproduits.

### Fiches Installé(s) (Ark, Dolphin, etc.)

- VM : `vm-discover-installed-detail-*.png` (14 fiches, `--discover-installed-details`)
- Capsule : `capsule-discover-installed-detail-*.png`
- Smokes : `smoke-discover-neon-installed-details.mjs`, `smoke-discover-vm-parity.mjs` (paires détail)
- Écarts connus (P2) :
  - Structuration description (titres + listes) à affiner app par app vs VM (audit micro, non bloquant).

### Mises à jour (Updates)

- VM : `vm-discover-updates.png`
- Capsule : `capsule-discover-updates.png`, `capsule-discover-updates-windowed.png`
- Smokes : `smoke-discover-vm-parity.mjs`, `smoke-kde-neon-discover.mjs`
- Écarts connus :
  - Interactions updateAll/refresh : à vérifier en parité micro (hover/focus/disabled).

### Configuration (Sources) / À propos

- VM : `vm-discover-config.png`, `vm-discover-about.png`
- Capsule : `capsule-discover-config*.png`, `capsule-discover-about*.png`
- Smokes : `smoke-discover-vm-parity.mjs`
- Écarts connus :
  - Toggles configuration décoratifs : à comparer aux états VM (enabled/disabled/valeurs).

### Sidebar : navigation + catégories

- VM : inventaire `linux-kde-neon-discover-sidebar-icons.json`
- Capsule : `update_manager_kde_neon.html`, `update_manager.skin.css`
- Smokes : `smoke-discover-neon-sidebar-icons.mjs`, `smoke-discover-neon-categories.mjs`, `smoke-kde-neon-discover.mjs`
- Écarts connus :
  - Template HTML marque les catégories `disabled` mais les smokes exigent des catégories actives : aligner DOM/runtime sur la VM.

