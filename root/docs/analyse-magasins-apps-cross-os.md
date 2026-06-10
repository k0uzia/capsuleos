# Analyse stratégique — magasins d'applications cross-OS

> **Date** : 10 juin 2026 · **Statut** : analyse + contrat draft (pas d'implémentation massive ce cycle)  
> **Ground truth Mint** : Π=100 · campagne crédibilité v3 clôturée · 43 slots · 130 scénarios  
> **Contrat draft** : [`etc/capsuleos/contracts/store-installable-apps.json`](../../etc/capsuleos/contracts/store-installable-apps.json)  
> **Matrice machine** : [`inventaires/store-installable-matrix.json`](inventaires/store-installable-matrix.json)

---

## 1. Principe produit

CapsuleOS distingue deux niveaux d'applications :

| Niveau | Règle | Source de vérité |
|--------|-------|------------------|
| **Par défaut (VM)** | Shell, menu, favoris = apps réellement installées sur la VM inventoriée | `*-vm-apps-installed.json`, `linux-mint-apps-catalog.json`, `registryOverrides` |
| **Extension magasin** | L'utilisateur peut **ajouter** des apps via le gestionnaire natif simulé | Catalogue dynamique `storeInstallable: true`, `defaultInstalled: false` |

Objectif pédagogique : l'apprenant découvre le **vrai** gestionnaire de paquets de sa distro (Logithèque Mint, GNOME Logiciels, Snap Store Ubuntu…) sans que CapsuleOS pré-installe plus que la VM.

Références officielles consultées :

| OS | Magasin UI | Formats | Doc |
|----|------------|---------|-----|
| **Linux Mint 22** | Logithèque (`mintinstall`) | apt + flatpak (Flathub vérifié) | [Software Manager wiki](https://mintguide.miraheze.org/wiki/Software_Manager) · [Mint 22 notes](https://www.linuxmint.com/rel_wilma_whatsnew.php) |
| **Rocky / Alma 10** | GNOME Logiciels | rpm AppStream + flatpak (remote RH ; Flathub optionnel) | [RHEL 10 Flatpak](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/10/html/administering_rhel_by_using_the_gnome_desktop_environment/installing-applications-by-using-flatpak) |
| **Fedora** | GNOME Logiciels | rpm + flatpak Flathub | [DNF / Software](https://docs.fedoraproject.org/en-US/fedora/latest/system-administrators-guide/package-management/DNF/) |
| **Ubuntu 26.04** | App Center (`snap-store`) | snap + deb ; flatpak via GNOME Software séparé | [Ubuntu software install](https://ubuntu.fan/en/docs/desktop-use/basics/software-install) |

---

## 2. Point de départ — Mint Cinnamon (référence aboutie)

### 2.1 Inventaires sources

| Artefact | Rôle |
|----------|------|
| `linux-mint-apps-catalog.json` | 101 entrées VM → 43 slots Capsule |
| `linux-mint-parity-index.json` | Π apps priority = 100 (8 slots P0) |
| `linux-mint-replication-state.json` | Campagne v3 · CredΣ · 43 apps π=100 |
| `app-fidelity-scenarios.json` + `linux-mint-app-fidelity-scenarios.json` | 130 scénarios crédibilité |
| `apps-catalog.json` → `toolkits.cinnamon` | 4 slotSpecs toolkit (nemo, themes, update_manager, mainMenu) + gabarits embed |

### 2.2 Apps abouties Mint (exportables)

Critères retenus : `statut: ok` dans le catalogue Mint, Π ≥ 92 (campagnes v3), slot ouvrable.

**P0 — cœur bureau (8 slots priority queue)**

| Slot | Label VM | Desktop | Π | functionalDepth |
|------|----------|---------|---|-----------------|
| `nemo` | Fichiers | `nemo.desktop` | 100 | full (Cinnamon) |
| `firefox` | Firefox | `firefox.desktop` | 100 | partial |
| `terminal` | Terminal | `org.gnome.Terminal.desktop` | 100 | full |
| `text_editor` | Éditeur | `org.x.editor.desktop` | 100 | full |
| `calculator` | Calculatrice | `org.gnome.Calculator.desktop` | 100 | full |
| `update_manager` | Mises à jour | `mintupdate-kde.desktop` | 100 | partial |
| `mintinstall` | Logithèque | `mintinstall-kde.desktop` | 100 | partial |
| `themes` | Paramètres | `cinnamon-settings*.desktop` | 100 | full |

**P1/P2 — 33 slots additionnels aboutis** (extrait) : `file_roller`, `librecalc`, `libreoffice_*`, `visionneur_pdf` (xreader), `visionneur_images` (pix), `lecteur_multimedia` (Celluloid), `thunderbird`, `transmission`, `rhythmbox`, `drawing`, `simple_scan`, `baobab`, `system_monitor`, `warpinator`, `timeshift`, etc.

Voir liste complète : [`store-installable-matrix.json`](inventaires/store-installable-matrix.json).

### 2.3 Apps singulières / agnostiques

Slots **réutilisables cross-toolkit** (même gabarit Capsule, variant chrome) :

| Slot | Mint | GNOME RHEL | Ubuntu | Note |
|------|------|------------|--------|------|
| `firefox` | ✅ | ✅ | ✅ | Snap sur Ubuntu 26.04 |
| `calculator` | org.gnome.Calculator | idem | idem | Gabarit partagé |
| `text_editor` | xed | org.gnome.TextEditor | idem | Variants template |
| `nemo` | Nemo | Nautilus | Nautilus | Slot logique unique |
| `file_roller` | FileRoller | idem | idem | |
| `baobab` | idem | idem | idem | |
| `libreoffice_*` | apt LO | flatpak/rpm | deb | Writer → slot `librewriter` GNOME |
| `thunderbird` | apt | flatpak/rpm | snap | |
| `transmission` | apt | rpm/flatpak | deb | |
| `lecteur_multimedia` | Celluloid | flatpak/Totem | totem deb | Équivalent fonctionnel |
| `visionneur_images` | pix | Loupe | Loupe | Variants GNOME récents |
| `visionneur_pdf` | xreader | Papers | — | |

**Mint-only (decorative-only cross-OS)** : `mintdrivers`, `mintbackup`, `bulky`, `mintstick*`, `mintwelcome`, `webapp_manager`, `thingy`, `hypnotix`, `mate_color_select`.

---

## 3. Matrice App × OS × magasin

Légende **recommandation** : `P0-store` = 1re vague extension · `P1-store` = utilitaires · `P2-store` = communautaire · `decorative-only` = pas d'export magasin GNOME.

| Slot Capsule | Mint | Rocky | Alma | Fedora | Ubuntu | Capsule Mint | Reco |
|--------------|------|-------|------|--------|--------|--------------|------|
| `firefox` | apt+fp | rpm+fp | rpm+fp | rpm+fp | snap | ok π100 | P0-store |
| `nemo` | apt | rpm | rpm | rpm | deb | ok π100 | default |
| `terminal` | apt | rpm | rpm | rpm | deb | ok π100 | default |
| `text_editor` | apt (xed) | rpm | rpm | rpm | deb | ok π100 | default |
| `calculator` | apt | rpm | rpm | rpm | deb | ok π100 | default |
| `calendar` | apt | **flatpak** | **flatpak** | rpm | deb+fp | ok π100 | **P1-store** |
| `file_roller` | apt | rpm | rpm | rpm | deb | ok π100 | P1-store |
| `libreoffice_startcenter` | apt | flatpak | flatpak | rpm+fp | deb | ok π92 | P1-store |
| `thunderbird` | apt | flatpak | flatpak | rpm | snap | ok π100 | P1-store |
| `transmission` | apt | rpm+fp | flatpak | rpm | deb | ok π100 | P1-store |
| `rhythmbox` | apt | rpm | rpm | rpm | deb | ok π100 | P1-store |
| `lecteur_multimedia` | apt (Celluloid) | flatpak | flatpak | rpm+fp | deb | ok π92 | P1-store |
| `drawing` | apt+fp | flatpak | flatpak | flatpak | deb+fp | ok π100 | P1-store |
| `simple_scan` | apt | rpm | rpm | rpm | deb | ok π100 | P1-store |
| `baobab` | apt | rpm ✓VM | rpm ✓VM | rpm | deb | ok π100 | P1-store |
| `system_monitor` | apt | rpm ✓VM | rpm ✓VM | rpm | deb | ok π100 | P1-store |
| `warpinator` | apt | flatpak | flatpak | flatpak | flatpak | ok π92 | P2-store |
| `timeshift` | apt | flatpak | flatpak | rpm | ppa | ok π92 | P2-store |
| `mintdrivers` | apt | — | — | — | — | ok π100 | decorative |
| `bulky` | apt | — | — | — | — | ok π100 | decorative |
| `webapp_manager` | apt | — | — | — | — | ok π100 | decorative |

`fp` = flatpak · `✓VM` = déjà dans l'inventaire VM lab (ground truth, pas extension).

---

## 4. Top 10 apps Mint abouties → export magasin GNOME

Priorisation pour la **première vague store extension** (slots déjà aboutis Mint, installables via Logiciels/App Center sur ≥3 OS GNOME) :

| Rang | Slot | Pourquoi |
|------|------|----------|
| 1 | `file_roller` | Même desktop GNOME · apt/rpm/deb partout · scénario archives pédagogique |
| 2 | `libreoffice_startcenter` | Suite bureautique universelle · flatpak Flathub aligné Mint |
| 3 | `thunderbird` | Courrier — format diverge (snap Ubuntu) = enseignement magasin |
| 4 | `transmission` | BitTorrent — rpm/deb + flatpak |
| 5 | `rhythmbox` | Lecteur audio GNOME natif rpm |
| 6 | `lecteur_multimedia` | Celluloid flatpak cross-OS · équivalent Totem |
| 7 | `drawing` | Flatpak `com.github.maoschanz.drawing` identique |
| 8 | `simple_scan` | Numérisation — rpm AppStream EL10 |
| 9 | `calendar` | **Gap pédagogique EL10** — flatpak-only Rocky/Alma |
| 10 | `warpinator` | Partage LAN Mint → flatpak communautaire GNOME |

Exclus du top 10 car **déjà default VM** sur GNOME : firefox, nemo, terminal, text_editor, calculator.

---

## 5. Gaps identifiés

| Gap | Impact | Mitigation proposée |
|-----|--------|---------------------|
| **Calendar flatpak-only EL10** | Favori gsettings Rocky sans paquet rpm lab | `storeInstallable: true` + source `flatpak: org.gnome.Calendar` · scénario magasin S1 |
| **Apps Mint meta** | mintdrivers, bulky, webapp_manager… | `decorative-only` sur GNOME · coquille menu si absent VM |
| **Ubuntu snap-first** | Firefox/Thunderbird ≠ Mint apt | Documenter dans scénario magasin · onglets snap/deb App Center |
| **LibreOffice absent VM RL10** | slot `librewriter` partiel | Extension flatpak post-install · ne pas default-install |
| **Mint sans registryOverrides** | `apps-catalog.json` incomplet | Wave séparée — hors scope analyse (noté point-etape §3) |
| **Flatpak Flathub EL10** | Remote RH vs Flathub — politique neutre Alma | Scénario pédagogique « activer Flathub » optionnel |

---

## 6. Architecture proposée (sans implémentation ce cycle)

### 6.1 Extension scénarios magasin — `software-user-scenarios` S1+

Le contrat GNOME existant **`software-user-scenarios.json` (C15)** couvre la navigation Logiciels (recherche, onglets, détail paquet). L'extension **S1+** ajoute :

| Phase | Prédicat | Comportement simulé |
|-------|----------|---------------------|
| S1 | `StoreI` | Inventaire installable filtré par `registryId` (contrat draft) |
| S2 | `StoreC` | Action « Installer » → écriture sessionStorage + épinglage shell |
| S3 | `StoreS` | Smoke Playwright : app absente menu → install → slot ouvert |
| S4 | `StoreΠ` | Parité visuelle post-install vs VM réelle |

Alignement campagne Mint v3 : réutiliser les slots CredΠ aboutis — **pas de nouveau gabarit**, seulement visibilité shell.

### 6.2 Contrat `store-installable-apps.json`

Structure draft (voir fichier) :

```json
{
  "apps": [{
    "slot": "file_roller",
    "sources": {
      "linux-rocky": { "rpm": "file-roller", "defaultInstalled": false, "storeInstallable": true }
    },
    "postInstall": { "slot": "file_roller", "placement": ["overview"] }
  }]
}
```

Champs clés :

- `appId` / `desktopId` — identifiant magasin natif
- `sources.<registryId>` — `rpm` | `apt` | `flatpak` | `snap`
- `storeInstallable` / `defaultInstalled` — à propager dans `registryOverrides`

### 6.3 Persistance — pattern sessionStorage (C15 / C29)

Inspiré des scénarios Logiciels (C15) et LibreWriter (C29) :

```javascript
// Clé : capsule-store-installed:{registryId}
sessionStorage.setItem(key, JSON.stringify({
  appIds: ['org.gnome.FileRoller'],
  installedAt: new Date().toISOString(),
  source: 'rpm'
}));
```

- **Tier SESSION** (`capsule-memory-conventions.js`) — purgé à reset session pédagogique
- **Tier PERSISTENT** (option wave 2) — `localStorage` si l'on veut conserver les apps installées entre rechargements

Le shell lit la clé pour injecter les entrées menu/overview **en plus** du ground truth VM.

### 6.4 `registryOverrides` — extension champs

Dans `apps-catalog.json`, par entrée app :

```json
"org.gnome.FileRoller": {
  "slot": "file_roller",
  "statut": "ok",
  "defaultInstalled": false,
  "storeInstallable": true
}
```

Règle : `defaultInstalled: true` (ou absent) = prédicat **A** VM · `false` = extension magasin uniquement.

### 6.5 Gates futures (hors scope)

| Gate | Script proposé |
|------|----------------|
| `StoreI` | `validate-store-installable-catalog.mjs` |
| `StoreC` | `smoke-store-install-scenario.mjs --id --slot` |
| `StoreΣ` | agrégateur dans `validate-all.mjs` (opt-in) |

---

## 7. Prochaines étapes recommandées

| Priorité | Action | Effort |
|----------|--------|--------|
| P0 | Valider contrat draft avec sonde VM (`dnf search`, `apt-cache`, flatpak remote-ls) | 1 session lab |
| P0 | Scénario S1 Logiciels Rocky : installer `file_roller` depuis magasin simulé | 1 contrat JSON |
| P1 | Propager `storeInstallable` sur 10 apps top matrice (pas 101 Mint) | patch ciblé |
| P1 | Documenter divergence Ubuntu snap dans `software-user-scenarios` S1 | doc |
| P2 | `registryOverrides.linux-mint` complet | wave séparée |

---

## Références internes

- [point-etape-2026-06.md §6](point-etape-2026-06.md) — lien magasins cross-OS
- [campagne-credibilite-pedagogique.md](campagne-credibilite-pedagogique.md) — Mint v3
- [apps-catalog.json](../../etc/capsuleos/contracts/apps-catalog.json) — toolkits + registryOverrides
- [roadmap.md](roadmap.md) — jalon Wave store extension

---

*Analyse stratégique — ne pas confondre avec ordre d'exécution agent (voir plan maître).*
