# Analyse magasins apps cross-OS

**Statut contrat** : `store-installable-apps.json` — **pilote Alma** (juin 2026)  
**Référence vision** : analyse `de155a70` · Wave store extension

## Principe

| Couche | Rôle |
|--------|------|
| VM ground truth | Apps `defaultInstalled: true` ou `onVm: true` — shell par défaut |
| Extension magasin | Apps `storeInstallable: true`, `defaultInstalled: false` — installables via Logiciels / Logithèque simulé |
| Slot Capsule | Gabarit déjà abouti (Mint v3 ou GNOME ScΣ) — pas de nouveau template inventé |

## Fronts magasin par OS

| registryId | Slot UI | Label FR | Sources |
|------------|---------|----------|---------|
| linux-mint | mintinstall | Logithèque | apt, flatpak |
| linux-rocky | update_manager | Logiciels | rpm, flatpak |
| **linux-alma** | **update_manager** | **Logiciels** | **rpm, flatpak** |
| linux-fedora | update_manager | Logiciels | rpm, flatpak |
| linux-ubuntu | update_manager (snap-store) | Centre d'applications | snap, deb, flatpak |

## Pilote Alma (Wave store juin 2026)

### Apps P0 magasin

| Slot contrat | App ID Logiciels | Source Alma | Slot Capsule post-install |
|--------------|------------------|-------------|---------------------------|
| file_roller | file-roller | rpm file-roller | file_roller |
| libreoffice_startcenter | libreoffice | flatpak org.libreoffice.LibreOffice | librewriter |
| calendar | calendar | flatpak org.gnome.Calendar | calendar |

### Kernel

- Catalogue : `usr/lib/capsuleos/shells/linux/gnome-store-catalog.js`
- UI Logiciels : `update-manager.js` + `update_manager_gnome.html` (section **À découvrir**)
- Épinglage shell : `gnome-store-shell-pin.js` · événement `capsule:store-app-installed`

### sessionStorage (choix documenté)

Deux clés complémentaires :

1. **`capsule-gnome-software-installed`** — map `{ appId: boolean }` pour l'état UI Logiciels (compat S1–S4 existants).
2. **`capsule-store-installed:{registryId}`** — métadonnées structurées `{ appIds[], installedAt, source }` pour audit, reprise session et épinglage overview/dash.

Écriture dual-write à la fin d'une installation store ; lecture fusionne les deux au boot (`initGnomeInstalledFromCatalog`).

### Scénarios pédagogiques

Contrat : `etc/capsuleos/contracts/software-user-scenarios.json`

| ID | Titre |
|----|-------|
| S1–S4 | Flux Logiciels GNOME baseline (Writer, recherche, MAJ, Installées) |
| **S5** | À découvrir → file_roller → Installées |
| **S6** | LibreOffice flatpak → Ouvrir librewriter |
| **S7** | Agenda flatpak → Ouvrir calendar |
| S8 | Erreur réseau (optionnel) |

Smoke : `smoke-gnome-software-scenarios.mjs --id linux-alma`

### Gates

- `validate-store-installable-apps.mjs`
- `validate-software-user-scenarios.mjs`

## Prochaines vagues

- Rocky / Fedora : activer `STORE_APPS_BY_REGISTRY` (catalogue contrat déjà prêt)
- Mint : Logithèque (`mintinstall`) — pattern apt/flatpak distinct
- Ubuntu : snap-store + flatpak via plugin gnome-software
