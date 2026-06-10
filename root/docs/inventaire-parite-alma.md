# Inventaire parité — AlmaLinux 10 GNOME VM → CapsuleOS

> Collecte : **juin 2026** · Registre : `linux-alma` · Indice machine : [`linux-alma-parity-index.json`](inventaires/linux-alma-parity-index.json)  
> Procédure : [`procedure-lab-linux-alma-gnome.md`](procedure-lab-linux-alma-gnome.md) · VM : [`linux-alma-vm.json`](inventaires/linux-alma-vm.json)

**État global** : **Π = 96** (`status_global: ok`) · **Π étendu = 92** (15 slots apps documentés, 8 P2) · VM `capsule@192.168.122.199` · skin dérivé `linux-rocky` · campagne scénarios **C15–C30 clôturée** · overview **15/15**.

---

## Méthode de mesure

| Composant | Poids | Périmètre |
|-----------|-------|-----------|
| Shell | 0,25 | topBar, overview, tray, wallpaper |
| Apps | 0,75 | 7 slots **priority** (gate campagne) : nemo, firefox, terminal, themes, update_manager, text_editor, calculator |
| Apps étendu | 0,75 | 15 slots (priority + 8 P2) → **Π étendu = 92** (indicatif, non gate) |

Dimensions par slot : `vis`, `nav`, `int`, `ctx`, `kb`, `data` (0–100).

Seuils : **ok ≥ 90** · **partiel ≥ 60**.

Champ machine : `linux-alma-parity-index.json` → `pi_global` (priority) · `pi_global_extended` (tous slots apps documentés).

---

## Versions

| Composant | VM réelle | CapsuleOS | Statut |
|-----------|-----------|-----------|--------|
| Distribution | AlmaLinux **10.2** (Lavender Lion) | `linux-alma` P3 | OK |
| Shell / DE | GNOME Shell **49.4** Wayland | Coque dérivée Rocky · `#alma` | OK |
| Explorateur | **Nautilus 47** | Slot `nemo` · `nemo-gnome` | OK (Π 91) |
| Terminal | **Ptyxis** | Slot `terminal` · profil Alma | OK (Π 90) |
| Logiciels | **GNOME Software 49** | Slot `update_manager` | OK (Π **100**) |
| Paramètres | **gnome-control-center** | Slot `themes` · `themes_gnome.html` | OK (Π **94**, Vc Capsule C23) |

---

## Shell GNOME

| Surface | Π | Smoke / preuve |
|---------|---|----------------|
| topBar | 99 | `smoke-rocky-shell-polish.mjs --playwright` |
| overview | 94 | dash is-running Playwright C12 |
| tray | 99 | checks 3/3 |
| wallpaper | **98** | fonds `almalinux-day/night` · filigrane `background-logo` · catalogue `almaWallpaperCatalog` |

Ground truth VM :

- `accent-color`: **blue** (`#3584e4`)
- `picture-uri`: `file:///usr/share/backgrounds/almalinux-day.jpg`
- `picture-uri-dark`: `almalinux-night.jpg`
- Extension `background-logo@fedorahosted.org` : `logo-position` **bottom-left** · `logo-size` **12.5** · `logo-border` **50** · fichiers `/usr/share/almalinux-logos/fedora_logo_{dark,light}background.svg`

### Watermark bureau (C22)

| Paramètre VM | CapsuleOS |
|--------------|-----------|
| `logo-position` bottom-left | `body#alma::after` · `left` + `background-position: left bottom` |
| `logo-size` 12.5 % | `--alma-watermark-width: 12.5%` |
| `logo-border` 50 px | `--alma-watermark-inset: max(3.125rem, …)` |
| dark → `fedora_logo_darkbackground.svg` | tokens sombre + assets SHA256 VM |
| clair pédagogique → `fedora_logo_lightbackground.svg` | `html[data-theme="light"]:has(#alma)` (VM utilise darkbackground pour les deux clés gsettings ; choix pédagogique standard RHEL) |

Smoke : `smoke-alma-watermark.mjs` · captures : `root/docs/inventaires/captures/linux-alma/*-watermark-*.png`

---

## Apps priority — détail

| Slot | Label | Π | Scénarios P0 | Contrat |
|------|-------|---|--------------|---------|
| `nemo` | Fichiers | **94** | **N1–N4** | `nautilus-user-scenarios.json` |
| `firefox` | Firefox | **94** | **F1–F4** | `firefox-user-scenarios.json` |
| `terminal` | Ptyxis | **94** | **Te1–Te4** | `terminal-user-scenarios.json` |
| `themes` | Paramètres | **94** | **Th1–Th4** · **Vc C23** | `themes-user-scenarios.json` |
| `update_manager` | Logiciels | **100** | S1–S4 | `software-user-scenarios.json` |
| `text_editor` | Éditeur | 92 | T1–T4 | `text-editor-user-scenarios.json` |
| `calculator` | Calculatrice | 91 | C1–C4 | `calculator-user-scenarios.json` |

### Scénarios pédagogiques (C15–C19)

| Cycle | Slot | Scénarios | Smoke |
|-------|------|-----------|-------|
| C15 | Logiciels | S1 install · S2 recherche · S3 MAJ · S4 lancer | `smoke-gnome-software-scenarios.mjs` |
| C16 | Éditeur | T1 nouveau · T2 ouvrir VFS · T3 enregistrer sous · T4 onglets | `smoke-gnome-text-editor-scenarios.mjs` |
| C17 | Calculatrice | C1 basique · C2 chaîne/effacer · C3 Avancé · C4 copier | `smoke-gnome-calculator-scenarios.mjs` |
| C18 | Paramètres | Th1 mode sombre · Th2 fond Alma · Th3 accent · Th4 panneau Écrans | `smoke-gnome-themes-scenarios.mjs` |
| C19 | Horloges | H1 Monde/Tokyo · H2 chronomètre · H3 minuteur · H4 alarme | `smoke-gnome-clocks-scenarios.mjs` |
| C20 | Agenda | Cal1 vue mois · Cal2 créer évènement · Cal3 vue semaine · Cal4 mois suivant | `smoke-gnome-calendar-scenarios.mjs` |
| C24 | Baobab | B1 home · B2 Ordinateur · B3 treemap · B4 /boot | `smoke-gnome-baobab-scenarios.mjs` |
| C24 | Visite guidée | T1 lancer · T2 avancer · T3 terminer · T4 précédent | `smoke-gnome-tour-scenarios.mjs` |
| C25 | Caméra | Sn1 Photo · Sn2 Vidéo · Sn3 sans caméra · Sn4 libellés FR | `smoke-gnome-snapshot-scenarios.mjs` |
| C25 | Caractères | Ch1 défaut · Ch2 recherche euro · Ch3 sélection © · Ch4 copier | `smoke-gnome-characters-scenarios.mjs` |
| C25 | Moniteur système | Sm1 processus · Sm2 ressources · Sm3 recherche · Sm4 FS | `smoke-gnome-system-monitor-scenarios.mjs` |
| C25 | Capture d'écran | Sc1 config · Sc2 fenêtre · Sc3 capture · Sc4 nouvelle (Capsule-only) | `smoke-gnome-screenshot-scenarios.mjs` |
| C26 | Fichiers (Nautilus) | N1 home · N2 Documents/Téléchargements · N3 nouveau dossier · N4 Favoris/Réseau | `smoke-gnome-nautilus-scenarios.mjs` |
| C27 | Firefox | F1 accueil · F2 barre adresse · F3 onglets · F4 favori La Capsule | `smoke-gnome-firefox-scenarios.mjs` |
| C28 | Terminal (Ptyxis) | Te1 invite · Te2 pwd/ls · Te3 onglet · Te4 whoami/help | `smoke-gnome-terminal-scenarios.mjs` |
| C29 | LibreOffice Writer | Lw1 ouvrir · Lw2 saisie · Lw3 gras · Lw4 enregistrer/nouveau | `smoke-gnome-librewriter-scenarios.mjs` |
| C30 | Missions CapsuleOS | Ck1 ouvrir · Ck2 consulter · Ck3 cocher · Ck4 progression | `smoke-gnome-checklist-scenarios.mjs` |

### Apps P2

| Slot | Label | Π | Scénarios P0 | Contrat |
|------|-------|---|--------------|---------|
| `clocks` | Horloges | **87** | **H1–H4** | `clocks-user-scenarios.json` |
| `calendar` | Agenda | **87** | **Cal1–Cal4** | `calendar-user-scenarios.json` |
| `baobab` | Utilisation des disques | **88** | **B1–B4** | `baobab-user-scenarios.json` |
| `tour` | Visite guidée | **87** | **T1–T4** | `tour-user-scenarios.json` |
| `snapshot` | Caméra | **86** | **Sn1–Sn4** | `snapshot-user-scenarios.json` |
| `characters` | Caractères | **88** | **Ch1–Ch4** | `characters-user-scenarios.json` |
| `system_monitor` | Moniteur système | **88** | **Sm1–Sm4** | `system-monitor-user-scenarios.json` |
| `screenshot` | Capture d'écran | **87** | **Sc1–Sc4** (Capsule-only) | `screenshot-user-scenarios.json` |

Pattern documenté : [procedure-scenarios-pedagogiques-gnome.md](procedure-scenarios-pedagogiques-gnome.md).

---

## Overview Alma — scénarios avant / après (C27 doc)

Audit : `node usr/lib/capsuleos/tools/lab/audit-gnome-overview-scenarios.mjs --id linux-alma`

### Slots câblés **avec** scénarios P0 (après C25)

| Zone | Slot | Label | Scénarios avant | Scénarios après | Contrat |
|------|------|-------|-----------------|-----------------|---------|
| dash | `update_manager` | Logiciels | smoke structurel | **S1–S4** | `software-user-scenarios.json` |
| dash | `text_editor` | Éditeur | smoke structurel | **T1–T4** | `text-editor-user-scenarios.json` |
| dash | `calendar` | Calendrier | — | **Cal1–Cal4** | `calendar-user-scenarios.json` |
| dash | `terminal` | Terminal | chrome Ptyxis | **Te1–Te4** | `terminal-user-scenarios.json` |
| dash | `nemo` | Fichiers | routing Nautilus | **N1–N4** | `nautilus-user-scenarios.json` |
| dash | `firefox` | Firefox | onglets Proton | **F1–F4** | `firefox-user-scenarios.json` |
| grid | `themes` | Paramètres | playbook | **Th1–Th4** | `themes-user-scenarios.json` |
| grid | `clocks` | Horloges | — | **H1–H4** | `clocks-user-scenarios.json` |
| grid | `baobab` | Disques | — | **B1–B4** | `baobab-user-scenarios.json` |
| grid | `tour` | Visite guidée | — | **T1–T4** | `tour-user-scenarios.json` |
| grid | `snapshot` | Caméra | — | **Sn1–Sn4** | `snapshot-user-scenarios.json` |
| grid | `characters` | Caractères | — | **Ch1–Ch4** | `characters-user-scenarios.json` |
| grid | `system_monitor` | Moniteur | — | **Sm1–Sm4** | `system-monitor-user-scenarios.json` |
| grid | `librewriter` | LibreOffice Writer | gabarit partiel | **Lw1–Lw4** | `librewriter-user-scenarios.json` |
| dock | `checklist` | Missions | capsuleOnly | **Ck1–Ck4** | `checklist-user-scenarios.json` |

### Clôture overview C26–C30

Overview Alma **15/15** slots câblés avec scénarios P0 (juin 2026). Dernier gap **C30 checklist** fermé — module pédagogique Capsule-only documenté dans `linux-alma-checklist-capsule-inventory.json`.

Manifeste : `etc/capsuleos/contracts/gnome-user-scenarios-index.json` · doc : [procedure-playbook-gnome-apps-overview.md](procedure-playbook-gnome-apps-overview.md).

---

## Playbook Paramètres GNOME (C21)

| Étape | Artefact / commande | Résultat |
|-------|---------------------|----------|
| Matrice parité | `gnome-settings-parity-matrix-alma.json` | 18 panneaux · `registry: linux-alma` (dérivé Rocky, non legacy) |
| Matrice assets | `gnome-settings-assets-matrix-alma.json` | 4 entrées : `almalinux-day/night` + watermarks |
| Collecte VM | `collect-vm-gnome-settings-playbook.mjs --id linux-alma` | **18/18** panneaux · **28** mappés · **0** dérive |
| Smoke | `smoke-alma-gnome-settings-playbook.mjs` | OK |
| Chaîne | `verify-gnome-settings-parity-chain.mjs --id linux-alma` | Profil H6 relaxed (sans baseline VM stricte) |
| H6 | `linux-alma-gnome-settings-h6-closure.json` | Clôturé PbΣ (juin 2026) |

**Dérives Alma vs Rocky** (ground truth VM) :

| Zone | Rocky | Alma |
|------|-------|------|
| Fond actif | `rocky-default-10-gemstone-skies-*.png` | `almalinux-day.jpg` / `almalinux-night.jpg` |
| Catalogue Paramètres | 10 fonds WebP Rocky | tuile `almalinux` (`almaWallpaperCatalog`) |
| gcc | GNOME 47.x | **47.7** (identique famille) |
| Baseline JS | `gnome-settings-vm-baseline-linux-rocky.js` | **absent** (profil `requiresBaseline: false`) |
| Panneaux absents | — | aucun (18/18 comme Rocky) |

Inventaire : [`linux-alma-gnome-settings-playbook.json`](inventaires/linux-alma-gnome-settings-playbook.json)

---

## Vc Paramètres GNOME — compensation Capsule (C23)

| Contrôle | Priorité | Captures Capsule | Smoke |
|----------|----------|------------------|-------|
| `theme` | P0 | bureau clair/sombre · panneau Apparence | `smoke-alma-gnome-settings-visual` |
| `night-light` | P0 | bureau · panneau Écrans | idem |
| `dynamic-workspaces` | P0 | overview bureaux | idem |
| `dnd` | P0 | réglages rapides | idem |
| `accent` | P1 | panneau Apparence (orange) | idem |
| `wallpaper` | P1 | panneau Fond · bureau Alma | idem |

Artefacts :

- Inventaire : [`linux-alma-gnome-settings-visual-investigation.json`](inventaires/linux-alma-gnome-settings-visual-investigation.json) — `capsuleCapturesP0: 4` · `visualMatchClassifiedP0: 4`
- PNG : `root/docs/inventaires/captures/linux-alma/gnome-settings-visual-capsule/`
- Source Playwright : `capture-capsule-alma.mjs` → `vendors/alma/inventory/alma-capsule/`
- Chaîne : `collect-capsule-visual-investigation.mjs --id linux-alma` · `enrich-visual-investigation-capsule-parity.mjs`

**Vc VM** reste bloqué (D-Bus `Shell.Screenshot` AccessDenied) — parité documentée côté Capsule uniquement.

---

## Gaps ouverts

| Gap | Tag | Notes |
|-----|-----|-------|
| Captures VM pixel-perfect | **Vc** P1 | D-Bus `Shell.Screenshot` AccessDenied via SSH |
| `virsh almalinux10` absent hôte | P1 | VM accessible IP ; playbook `screenshotCapture` documenté |
| **Vc VM** apps P2 | P1 | D-Bus screenshot bloqué — compensé captures Capsule C24 |

---

## Prochaines étapes

1. **Vc VM** — session GDM locale ou fix D-Bus screenshot (non bloquant si Capsule OK)
2. Réplication scénarios vers `linux-rocky` / `linux-fedora` / `linux-ubuntu` (smokes `--id` déjà paramétrables ; Rocky : gaps Loupe/Papers P1)
3. **`registryOverrides.linux-mint`** — débloquer `smoke-apps-snapshot` et AppΣ Mint

## Clôture clone Π (C25)

| Élément | Valeur |
|---------|--------|
| Π priority | **96** (inchangé — formula prioritySlots) |
| Π étendu | **92** (15 slots apps) |
| P2 documentés | 8/8 (`clocks` … `screenshot`) |
| État | [`linux-alma-replication-state.json`](inventaires/linux-alma-replication-state.json) |
| Gaps honnêtes | Vc VM D-Bus · screenshot Capsule-only · snapshot sans webcam lab |

---

## Commandes parité

```bash
node usr/lib/capsuleos/tools/lab/compare-os-parity.mjs --id linux-alma
node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-alma

# Smokes scénarios (exemple calendar)
CAPSULE_HTTP_BASE=http://127.0.0.1:5501 \
  node usr/lib/capsuleos/tools/lab/smoke-gnome-calendar-scenarios.mjs --id linux-alma
```
