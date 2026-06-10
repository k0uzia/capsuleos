# Analyse magasins apps cross-OS

**Statut contrat** : `store-installable-apps.json` — **actif** (pilote Alma, architecture centralisée juin 2026)  
**Architecture** : [`architecture-catalogue-apps.md`](architecture-catalogue-apps.md) — slots-manifest + presentation-bindings + générateur `capsule-store-catalog.js`  
**Référence vision** : analyse `de155a70` · Wave store extension · matrice [`inventaires/store-installable-matrix.json`](inventaires/store-installable-matrix.json)

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

### Apps P0 magasin (wave 1)

| Slot contrat | App ID Logiciels | Source Alma | Slot Capsule post-install |
|--------------|------------------|-------------|---------------------------|
| file_roller | file-roller | rpm file-roller | file_roller |
| libreoffice_startcenter | libreoffice | flatpak org.libreoffice.LibreOffice | librewriter |
| calendar | calendar | flatpak org.gnome.Calendar | calendar |

### Apps P1 magasin (wave 2 — extension juin 2026)

| Slot contrat | App ID Logiciels | Source Alma | Slot Capsule | Scénario |
|--------------|------------------|-------------|--------------|----------|
| thunderbird | thunderbird | flatpak org.mozilla.Thunderbird | thunderbird | S9 |
| transmission | transmission | flatpak com.transmissionbt.Transmission | transmission | S10 |
| rhythmbox | rhythmbox | rpm rhythmbox | rhythmbox | — (decorative) |
| lecteur_multimedia | lecteur-multimedia | flatpak io.github.celluloid_player.Celluloid | lecteur_multimedia | overview pin |
| drawing | drawing | flatpak com.github.maoschanz.drawing | drawing | — |
| simple_scan | simple-scan | rpm simple-scan | simple_scan | S12 |
| warpinator | warpinator | flatpak org.x.Warpinator | warpinator | S11 |
| timeshift | timeshift | flatpak com.timeshift.TimeShift | timeshift | — |

Slots réutilisés depuis Mint v3 / toolkit GNOME — aucun gabarit inventé. `rhythmbox` : profondeur decorative (lecteur minimal). Overview : lanceurs `data-store-pin` masqués révélés à l'install (`simple_scan`, `lecteur_multimedia`).

### Kernel

- Catalogue : `var/lib/capsuleos/generated/capsule-store-catalog.js` (généré) consommé par `gnome-store-catalog.js` — **11 apps** `linux-alma`
- UI Logiciels : `update-manager.js` + `update_manager_gnome.html` (section **À découvrir**)
- Icônes grille : `update_manager_gnome.base.css` — classes `gnome-software__cardicon--*`
- Épinglage shell : `gnome-store-shell-pin.js` · événement `capsule:store-app-installed` · overview + dash

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
| S5 | À découvrir → file_roller → Installées |
| S6 | LibreOffice flatpak → Ouvrir librewriter |
| S7 | Agenda flatpak → Ouvrir calendar |
| **S9** | Thunderbird flatpak → Ouvrir thunderbird |
| **S10** | Transmission flatpak → Installées |
| **S11** | Warpinator flatpak communautaire → Ouvrir warpinator |
| **S12** | Numériseur simple rpm → Installées |
| S8 | Erreur réseau (optionnel) |

Smoke : `smoke-gnome-software-scenarios.mjs --id linux-alma`

Captures Capsule (échantillon P1) : `root/docs/inventaires/captures/linux-alma/alma-capsule-store-*.png`

### Gates

- `validate-store-installable-apps.mjs` — P0×3 + P1×8 Alma
- `validate-software-user-scenarios.mjs` — S1–S7 + S9–S12

## Prochaines vagues

- Rocky / Fedora : activer `STORE_APPS_BY_REGISTRY` (catalogue contrat déjà prêt)
- Mint : Logithèque (`mintinstall`) — pattern apt/flatpak distinct
- Ubuntu : snap-store + flatpak via plugin gnome-software
