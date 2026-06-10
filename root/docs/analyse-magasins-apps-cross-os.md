# Analyse magasins apps cross-OS

**Statut contrat** : `store-installable-apps.json` — **actif** (tous OS Linux actifs, architecture centralisée juin 2026)  
**Architecture** : [`architecture-catalogue-apps.md`](architecture-catalogue-apps.md) — slots-manifest + presentation-bindings + générateur `capsule-store-catalog.js`  
**Référence vision** : analyse `de155a70` · Wave store extension · matrice [`inventaires/store-installable-matrix.json`](inventaires/store-installable-matrix.json)

## Principe

| Couche | Rôle |
|--------|------|
| VM ground truth | Apps `defaultInstalled: true` ou `onVm: true` — shell par défaut |
| Extension magasin | Apps `storeInstallable: true`, `defaultInstalled: false` — installables via Logiciels / Logithèque simulé |
| Slot Capsule | Gabarit déjà abouti (Mint v3 ou GNOME ScΣ) — pas de nouveau template inventé |

## Matrice OS actifs × catalogue magasin (juin 2026)

| registryId | StoreFront | Toolkit | Apps store | Smoke S5–S12 | Statut |
|------------|------------|---------|------------|--------------|--------|
| linux-alma | update_manager | gnome | 11 | OK | actif |
| linux-rocky | update_manager | gnome | 11 | OK | actif |
| linux-fedora | update_manager | gnome | 11 | OK | actif |
| linux-ubuntu | update_manager | gnome | 11 | OK | actif (GS50, libellé « Logiciels ») |
| linux-popos | update_manager | cosmic→gnome | 11 | deferred | catalogue actif ; smoke bloqué layout COSMIC (dock) |
| linux-anduinos | update_manager | gnome | 11 | OK | actif |
| linux-mint | mintinstall | cinnamon | 0 | deferred | branché (`mint-store-catalog.js`) |
| linux-kde-neon | update_manager | kde | 0 | deferred | gap UI Discover |
| linux-opensuse | update_manager | kde | 0 | deferred | gap UI Discover |

## Fronts magasin par OS

| registryId | Slot UI | Label FR | Sources |
|------------|---------|----------|---------|
| linux-mint | mintinstall | Logithèque | apt, flatpak |
| linux-rocky | update_manager | Logiciels | rpm, flatpak |
| linux-alma | update_manager | Logiciels | rpm, flatpak |
| linux-fedora | update_manager | Logiciels | rpm, flatpak |
| linux-ubuntu | update_manager | Logiciels | snap, deb, flatpak |
| linux-popos | update_manager (Pop Shop) | Pop Shop | deb, flatpak |
| linux-anduinos | update_manager | Logiciels | deb, flatpak |
| linux-kde-neon | update_manager (Discover) | Discover | apt, flatpak — catalogue deferred |
| linux-opensuse | update_manager (Discover) | Discover | rpm, flatpak — catalogue deferred |

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

## Pilote Rocky (activation juin 2026)

Même **11 apps** que Alma via `generate-store-catalog.mjs` — écarts sources documentés (priorité RPM Rocky quand les deux existent) :

| App ID Logiciels | Source Alma | Source Rocky (UI Logiciels) |
|------------------|-------------|----------------------------|
| thunderbird | flatpak | **rpm** thunderbird (+ flatpak optionnel contrat) |
| transmission | flatpak | **rpm** transmission (+ flatpak optionnel contrat) |
| calendar, libreoffice, lecteur-multimedia, drawing, warpinator, timeshift | flatpak | flatpak (identique) |
| file-roller, rhythmbox, simple-scan | rpm | rpm (identique) |

Skin `home/RedHat/Rocky/` : slots store (`file_roller`, `thunderbird`, …), scripts `capsule-store-catalog.js` + `gnome-store-catalog.js` + `gnome-store-shell-pin.js`. Overview : épinglage dynamique post-install.

Smoke Rocky : `smoke-gnome-software-scenarios.mjs --id linux-rocky` (S5–S12).

Slots réutilisés depuis Mint v3 / toolkit GNOME — aucun gabarit inventé. `rhythmbox` : profondeur decorative (lecteur minimal). Overview : lanceurs `data-store-pin` masqués révélés à l'install (`simple_scan`, `lecteur_multimedia`).

### Kernel

- Catalogue : `var/lib/capsuleos/generated/capsule-store-catalog.js` (généré) consommé par `gnome-store-catalog.js` — **11 apps** `linux-alma` · **11 apps** `linux-rocky`
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

Smoke : `smoke-gnome-software-scenarios.mjs --id linux-alma` · `--id linux-rocky` · `--id linux-fedora` · `--id linux-ubuntu` · `--id linux-anduinos` — Pop!_OS : deferred (layout COSMIC)

Captures Capsule (échantillon P1) : `root/docs/inventaires/captures/linux-alma/alma-capsule-store-*.png`

### Gates

- `validate-store-installable-apps.mjs` — P0×3 + P1×8 Alma
- `validate-software-user-scenarios.mjs` — S1–S7 + S9–S12

## Mint (Logithèque)

- Catalogue généré : **0 apps** (`storeCatalogStatus: vm-preinstalled` — ground truth VM pré-installé)
- Runtime : `capsule-store-catalog.js` + `mint-store-catalog.js` branchés sur `home/Debian/Mint/`
- UI : `mintinstall.js` conserve son catalogue pédagogique hardcodé ; fusion store généré = vague ultérieure
- Smoke : `smoke-mint-nemo.mjs` (pas de régression Nemo)

## KDE (deferred)

- `linux-kde-neon` / `linux-opensuse` : `presentation-bindings` + `storeCatalogStatus: deferred`
- Catalogue généré vide (0 apps) — pas de `toolkitVariants.kde` pour slots store P1
- UI Discover (`update_manager_kde*.html`) sans grille « À découvrir » store — documenter avant implémentation

## Prochaines vagues

- Mint : fusion catalogue généré → section Logithèque « À découvrir »
- KDE : slots store + UI Discover grille (quand `toolkitVariants.kde` aboutis)
