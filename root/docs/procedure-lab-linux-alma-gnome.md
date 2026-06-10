# Procédure lab — AlmaLinux GNOME (VM → CapsuleOS)

> **Objectif** : reproduire le bureau **AlmaLinux 10 Workstation GNOME** dans `home/RedHat/Alma/`, en dérivant `linux-rocky` avec personnalisation vendor (fonds `almalinux-day/night`, accent blue, assets `vendors/alma/`).

**Lire d'abord** : [branche-redhat-gnome.md](branche-redhat-gnome.md) · modèle Rocky : [procedure-lab-linux-rocky-gnome.md](procedure-lab-linux-rocky-gnome.md).

**Couches complémentaires** :

| Couche | Document |
|--------|----------|
| Infra VM SSH/Wayland | [lab-vm-rhel-wayland.md](lab-vm-rhel-wayland.md) |
| Scénarios pédagogiques GNOME | [procedure-scenarios-pedagogiques-gnome.md](procedure-scenarios-pedagogiques-gnome.md) |
| Parité JSON | [inventaire-parite-alma.md](inventaire-parite-alma.md) · [`linux-alma-parity-index.json`](inventaires/linux-alma-parity-index.json) |
| Playbook Paramètres GNOME | [procedure-creation-playbook-gnome-settings.md](procedure-creation-playbook-gnome-settings.md) · matrice `gnome-settings-parity-matrix-alma.json` (C21) |

---

## Vue d'ensemble — cycles Alma (C0–C23)

```mermaid
flowchart LR
  C0[C0_Inventaire_VM] --> C1[C1_ManΣ_assets]
  C1 --> C2[C2_Shell_panel]
  C2 --> C3[C3-C4_VΣ_captures]
  C3 --> C5[C5-C10_apps_P0]
  C5 --> H6[PbΣ_fonds_vendor]
  H6 --> C11[C11-C12_AppΣ_Π90]
  C11 --> C13[C13_Software_96]
  C13 --> C14[C14_Software_100]
  C14 --> C15[C15_S1-S4]
  C15 --> C16[C16_T1-T4]
  C16 --> C17[C17_C1-C4]
  C17 --> C18[C18_Th1-Th4_themes]
  C18 --> C19[C19_H1-H4_clocks]
  C19 --> C20[C20_Cal1-Cal4_calendar]
  C20 --> C21[C21_Playbook_Settings]
  C21 --> C22[C22_Watermark]
  C22 --> C23[C23_Vc_Settings]
  C23 --> C24[C24_Baobab_Tour]
  C24 --> C25[C25_P2_cloture_Pi]
```

| Cycle | Commit / passe | Prédicats atteints | Π global |
|-------|----------------|-------------------|----------|
| **C0** | `61e8036a` | **I**, inventaire VM 10.2 | — |
| **C1** | `8afa870f` | **ManΣ**, **A∧S** assets Alma | — |
| **C2** | `02608f4d` | Shell panel / top-bar | — |
| **C3–C4** | `fc5b7802` | **VΣ** matrice surfaces | — |
| **C5–C10** | `6938ab0e` | Apps P0, recette intégrale | ~86 |
| **PbΣ H6** | `0fc3992e` | Fonds vendor, playbook GNOME | — |
| **C11–C12** | `8c064e79`, `3ba91ec1` | **AppΣ**, captures Capsule P1 | **90** |
| **C13** | `08f15ea2` | GNOME Software explore grid | **96** |
| **C14** | `b6f99faf` | Logiciels clôturé | **100** (slot) |
| **C15** | `2c98dc36` | **ScΣ** Software S1–S4 | — |
| **C16** | `2417c650` | **ScΣ** Éditeur T1–T4 | — |
| **C17** | `8f947d14` | **ScΣ** Calculatrice C1–C4 | **94** |
| **C18** | `5c50a1cc` | **ScΣ** Paramètres Th1–Th4 | **96** |
| **C19** | `244cff54` | **ScΣ** Horloges H1–H4 | **96** |
| **C20** | `aa606f82` | **ScΣ** Agenda Cal1–Cal4 | **96** |
| **C21** | `3201ec12` | Playbook Paramètres GNOME dédié (18 panneaux) | **96** (Π étendu **93**) |
| **C22** | `832b23c1` | Filigrane bureau Alma (`smoke-alma-watermark`) | **96** |
| **C23** | `10db0422` | **Vc** Paramètres GNOME — captures Capsule P0/P1 | **96** |
| **C24** | `316a9cab` | **ScΣ** Baobab B1–B4 + Tour T1–T4 | **96** (Π étendu **91**) |
| **C25** | (cette passe) | **ScΣ** snapshot/characters/system_monitor/screenshot + clôture Π | **96** (Π étendu **92**) |

### Clôture clone Π (C25)

Tous les slots P2 Alma documentés (8/8) avec contrats scénarios, smokes Playwright verts et captures Capsule.

```bash
# Smokes C25 (exemple)
CAPSULE_HTTP_BASE=http://127.0.0.1:5501 \
  node usr/lib/capsuleos/tools/lab/smoke-gnome-snapshot-scenarios.mjs --id linux-alma

# État réplication
cat root/docs/inventaires/linux-alma-replication-state.json
cat root/docs/inventaires/linux-alma-parity-index.json | jq '.cloneClosure,.pi_global_extended'
```

Gaps restants honnêtes : Vc VM (D-Bus) · `screenshot` Capsule-only (rpm absent el10) · `snapshot` sans webcam lab.

---

## Phase 0 — Prérequis (bloquants)

### 0.1 VM AlmaLinux 10

| Critère | Vérification |
|---------|--------------|
| AlmaLinux **10.2** Workstation | `cat /etc/os-release` |
| Session **graphique** (GDM Wayland) | pas SSH seul |
| Utilisateur lab `capsule` | IP NAT typique `192.168.122.199` |
| Domaine libvirt | `virshName: almalinux10` (peut être absent sur hôte agent — VM joignable par IP) |

### 0.2 Paquets sonde (VM)

Identique Rocky — voir [procedure-lab-linux-rocky-gnome.md §0.2](procedure-lab-linux-rocky-gnome.md#02-paquets-sonde-sur-la-vm).

### 0.3 Clé SSH (hôte)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/capsuleos-lab -N ""
ssh-copy-id -i ~/.ssh/capsuleos-lab.pub capsule@192.168.122.199
```

### 0.4 Test Wayland

```bash
ssh -i ~/.ssh/capsuleos-lab capsule@192.168.122.199 \
  'export DISPLAY=:0 XAUTHORITY=$(ls /run/user/$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1); wmctrl -l; echo exit:$?'
```

Attendu : **`exit:0`**.

### 0.5 Inventaire lab local

Copier l'entrée `linux-alma` depuis [`etc/capsuleos/lab-inventory.example.json`](../../etc/capsuleos/lab-inventory.example.json) vers `etc/capsuleos/lab-inventory.json` (gitignoré).

Champs clés : `registryId: linux-alma`, `virshName: almalinux10`, `capsuleUrl: http://127.0.0.1:5501/home/RedHat/Alma/index.html`.

### 0.6 Serveur HTTP CapsuleOS

```bash
cd /chemin/vers/CapsuleOS
python3 -m http.server 5501
```

### 0.7 Playbook captures VM

Documenté dans [`linux-alma-vm.json`](inventaires/linux-alma-vm.json) → `lab.screenshotCapture` :

| Backend | Statut Alma (juin 2026) |
|---------|-------------------------|
| `org.gnome.Shell.Screenshot` (D-Bus SSH) | **AccessDenied** — session distante |
| `gnome-screenshot -w` | Absent CRB el10 par défaut |
| `virsh screenshot almalinux10` | Domaine absent hôte agent courant |
| **Compensation** | Captures Capsule Playwright (`capture-capsule-*-views.mjs`) |

Collecteur : `node usr/lib/capsuleos/tools/lab/collect-vm-apps-visual-investigation.mjs --id linux-alma --filter P0 --ssh`

---

## Phase 1 — Inventaire ground truth

```bash
bash root/tools/lab/bootstrap-vm.sh linux-alma
node usr/lib/capsuleos/tools/lab/lab-ssh.mjs --id linux-alma --cmd '$HOME/capsuleos-lab/os-probe-gnome.sh state'
bash root/tools/lab/pull-vm-assets.sh --id linux-alma
```

Mettre à jour [`linux-alma-vm.json`](inventaires/linux-alma-vm.json) et [`linux-alma-vm.md`](inventaires/linux-alma-vm.md).

Checklist Alma spécifique :

- [ ] Fonds `/usr/share/backgrounds/almalinux-day.jpg` + `almalinux-night.jpg`
- [ ] `gsettings get org.gnome.desktop.interface accent-color` → `blue`
- [ ] `gsettings get org.gnome.desktop.background picture-uri-dark` → `almalinux-night.jpg`
- [ ] 7 favoris dash (pas Music)

---

## Phase 2 — Bootstrap skin depuis Rocky

```bash
node usr/lib/capsuleos/tools/linux/bootstrap-alma-from-rocky.mjs
```

Puis personnaliser :

```
home/RedHat/Alma/
├── alma-overrides.css          # wallpaper Alma, accent #3584e4
├── content/profile-data.js     # url almalinux.org
└── style/apps/*.skin.css       # overrides vendor si besoin
```

Assets : `usr/share/capsuleos/assets/images/vendors/alma/` · `SOURCE-VM.txt` obligatoire.

---

## Phase 3 — Apps P0 et parité

Brief agent :

```bash
node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-alma
node usr/lib/capsuleos/tools/lab/compare-os-parity.mjs --id linux-alma
```

Slots **priority** (poids apps 0,75) : `nemo`, `firefox`, `terminal`, `themes`, `update_manager`, `text_editor`, `calculator`.

Smokes shell :

```bash
CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-rocky-shell-polish.mjs --playwright
```

---

## Phase 4 — Scénarios pédagogiques (pattern réutilisable)

Ordre logique par slot (après Π structurel ≥ 90 sur le slot) :

```text
contrat JSON → validateur → smoke Playwright → captures Capsule → parity-index
```

| Slot | Contrat | Scénarios P0 | Smoke | Capture |
|------|---------|--------------|-------|---------|
| Logiciels | `software-user-scenarios.json` | S1–S4 | `smoke-gnome-software-scenarios.mjs` | `capture-capsule-software-views.mjs` |
| Éditeur | `text-editor-user-scenarios.json` | T1–T4 | `smoke-gnome-text-editor-scenarios.mjs` | `capture-capsule-text-editor-views.mjs` |
| Calculatrice | `calculator-user-scenarios.json` | C1–C4 | `smoke-gnome-calculator-scenarios.mjs` | `capture-capsule-calculator-views.mjs` |
| Paramètres | `themes-user-scenarios.json` | Th1–Th4 | `smoke-gnome-themes-scenarios.mjs` | `capture-capsule-themes-views.mjs` |
| Horloges | `clocks-user-scenarios.json` | H1–H4 | `smoke-gnome-clocks-scenarios.mjs` | `capture-capsule-clocks-views.mjs` |
| Agenda | `calendar-user-scenarios.json` | Cal1–Cal4 | `smoke-gnome-calendar-scenarios.mjs` | `capture-capsule-calendar-views.mjs` |

Exemple copy-paste (Calculatrice, Alma) :

```bash
CAPSULE_HTTP_BASE=http://127.0.0.1:5501 \
  node usr/lib/capsuleos/tools/lab/smoke-gnome-calculator-scenarios.mjs --id linux-alma

node usr/lib/capsuleos/tools/validate-calculator-user-scenarios.mjs

CAPSULE_HTTP_BASE=http://127.0.0.1:5501 \
  node usr/lib/capsuleos/tools/lab/capture-capsule-calculator-views.mjs --id linux-alma
```

Détail du pattern : [procedure-scenarios-pedagogiques-gnome.md](procedure-scenarios-pedagogiques-gnome.md).

### C20 — Agenda (org.gnome.Calendar)

**Install VM** : le RPM `gnome-calendar` est absent des dépôts el10. Contournement lab — Flatpak Flathub :

```bash
ssh -i ~/.ssh/capsuleos-lab capsule@192.168.122.199 \
  'sudo flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo && \
   sudo flatpak install -y flathub org.gnome.Calendar'
```

| Source | Version | Libellé fr_FR |
|--------|---------|---------------|
| flatpak `org.gnome.Calendar` | **50.0** | Agenda |
| rpm `gnome-calendar` | absent | — |

Inventaire : [`linux-alma-calendar-vm-inventory.json`](inventaires/linux-alma-calendar-vm-inventory.json)

Scénarios P0 : Cal1 vue mois · Cal2 créer évènement · Cal3 vue semaine · Cal4 mois suivant.

```bash
node usr/lib/capsuleos/tools/validate-calendar-user-scenarios.mjs

CAPSULE_HTTP_BASE=http://127.0.0.1:5501 \
  node usr/lib/capsuleos/tools/lab/smoke-gnome-calendar-scenarios.mjs --id linux-alma

CAPSULE_HTTP_BASE=http://127.0.0.1:5501 \
  node usr/lib/capsuleos/tools/lab/capture-capsule-calendar-views.mjs --id linux-alma
```

Π slot calendar : **63 → 87**. **Vc VM** : pending (captures Capsule documentées).

---

## Phase 4b — Playbook Paramètres GNOME (C21)

Matrice vendor dédiée (R-LOC1) — plus d'emprunt silencieux sur `gnome-settings-parity-matrix-rocky.json`.

```bash
# Bootstrap initial (déjà fait) — recréer si dérive
node usr/lib/capsuleos/tools/lab/bootstrap-gnome-settings-matrices.mjs --id linux-alma --write

# Collecte tour panneaux VM (SSH capsule@192.168.122.199)
node usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-playbook.mjs --id linux-alma

# Gates playbook
node usr/lib/capsuleos/tools/lab/smoke-alma-gnome-settings-playbook.mjs
node usr/lib/capsuleos/tools/lab/verify-gnome-settings-parity-chain.mjs --id linux-alma

# Vc Paramètres (C23 — compensation Capsule, VM D-Bus bloquée)
CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node root/tools/lab/capture-capsule-alma.mjs
CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/collect-capsule-visual-investigation.mjs --id linux-alma --filter P0
CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/collect-capsule-visual-investigation.mjs --id linux-alma --filter P1
node usr/lib/capsuleos/tools/lab/enrich-visual-investigation-capsule-parity.mjs --id linux-alma
node usr/lib/capsuleos/tools/lab/smoke-alma-gnome-settings-visual.mjs
```

**Profil H6 Alma** (`h6-gnome-settings-lib.mjs`) : `requiresBaseline: false` — pas de `gnome-settings-vm-baseline-linux-alma.js` ; playbook inventaire + clôture `linux-alma-gnome-settings-h6-closure.json` suffisent.

Ground truth VM (juin 2026) :

- `picture-uri` → `file:///usr/share/backgrounds/almalinux-day.jpg`
- `picture-uri-dark` → `almalinux-night.jpg`
- `accent-color` → `blue`

Inventaires : [`linux-alma-gnome-settings-playbook.json`](inventaires/linux-alma-gnome-settings-playbook.json) · [`linux-alma-gnome-settings-parity-drift.json`](inventaires/linux-alma-gnome-settings-parity-drift.json)

**Π global** : `pi_global` reste sur les 7 slots priority (gate campagne). `pi_global_extended` documente l'inclusion P2 `clocks` (87) et `calendar` (87) — voir [`inventaire-parite-alma.md`](inventaire-parite-alma.md).

---

## Phase 5 — Clôture technique

```bash
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
```

Checklist humaine :

- [ ] `home/RedHat/Alma/index.html` ≡ façade générée
- [ ] Fonds Alma day/night basculent via Paramètres → Apparence
- [ ] Accent blue par défaut (VM ground truth)
- [ ] [`linux-alma-parity-index.json`](inventaires/linux-alma-parity-index.json) à jour

---

## Gaps restants (juin 2026)

| Gap | Priorité | Action |
|-----|----------|--------|
| **Vc VM** pixel-perfect apps | P1 | D-Bus screenshot ou console GDM locale |
| `virsh almalinux10` absent hôte | P1 | Enregistrer domaine libvirt ou documenter IP seule |
| Watermark Alma (`fedora_logo_*`) | P2 | Inventaire VM ou gradient CSS fallback |
| `clocks`, `calendar` | P2 | Π **87** (H1–H4, Cal1–Cal4) · **Vc** Capsule |
| Vc Paramètres GNOME VM | P2 | D-Bus bloqué — **compensé Capsule C23** (`smoke-alma-gnome-settings-visual`) |
| `baobab`, `tour` | P2 | Π **88** / **87** (B1–B4, T1–T4) · **Vc** Capsule C24 |

---

## Skills agent

1. `onboarding`
2. `os-linux` + `capsuleos-distro-linux-alma` + `capsuleos-vendor-alma`
3. `gnome-hig-replication` + `design-shell-layout`
4. [branche-redhat-gnome.md](branche-redhat-gnome.md)

Brief : `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-alma`

---

## Historique des passes

| Date | Passe | Résultat |
|------|-------|----------|
| 2026-06-09 | C0 inventaire VM | Alma 10.2 · Shell 49.4 · SSH OK |
| 2026-06-09 | C1 assets | ManΣ · pull-vm-assets Alma |
| 2026-06-10 | C11–C12 AppΣ | Captures Capsule · Π **90** |
| 2026-06-10 | C13–C14 Software | Explore grid · Π slot **100** |
| 2026-06-10 | C15–C17 scénarios | S/T/C P0 · Π global **94** |
| 2026-06-10 | C18 themes | Th1–Th4 · Π **96** |
| 2026-06-10 | C19 clocks | H1–H4 · Π slot **87** |
| 2026-06-10 | C20 calendar | Cal1–Cal4 · flatpak 50.0 · Π slot **87** |
| 2026-06-10 | C21 playbook Settings | Matrice Alma · 18/18 VM · smoke + verify chain |
| 2026-06-10 | C22 watermark | Filigrane `background-logo` · tokens `--alma-watermark` |
| 2026-06-10 | C23 Vc Settings | Captures Capsule P0/P1 · Vc=4 Vp=4 · baobab → C24 |
| 2026-06-10 | C24 baobab + tour | B1–B4 · T1–T4 · rpm VM confirmés · Π étendu **91** |
