# Inventaire parité — AlmaLinux 10 GNOME VM → CapsuleOS

> Collecte : **juin 2026** · Registre : `linux-alma` · Indice machine : [`linux-alma-parity-index.json`](inventaires/linux-alma-parity-index.json)  
> Procédure : [`procedure-lab-linux-alma-gnome.md`](procedure-lab-linux-alma-gnome.md) · VM : [`linux-alma-vm.json`](inventaires/linux-alma-vm.json)

**État global** : **Π = 96** (`status_global: ok`) · **Π étendu = 93** (inclut apps P2 `clocks`/`calendar`) · VM `capsule@192.168.122.199` · skin dérivé `linux-rocky` · cycle **C22** watermark bureau Alma clôturé (suite C21).

---

## Méthode de mesure

| Composant | Poids | Périmètre |
|-----------|-------|-----------|
| Shell | 0,25 | topBar, overview, tray, wallpaper |
| Apps | 0,75 | 7 slots **priority** (gate campagne) : nemo, firefox, terminal, themes, update_manager, text_editor, calculator |
| Apps étendu | 0,75 | 9 slots (priority + P2 `clocks`, `calendar`) → **Π étendu = 93** (indicatif, non gate) |

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
| Paramètres | **gnome-control-center** | Slot `themes` · `themes_gnome.html` | Partiel (Π **87→93**) |

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
| `nemo` | Fichiers | 91 | — | routing smoke |
| `firefox` | Firefox | 92 | — | onglets Proton C11 |
| `terminal` | Ptyxis | 90 | — | `smoke-terminal-ptyxis-chrome` |
| `themes` | Paramètres | **87→93** | **Th1–Th4** | `themes-user-scenarios.json` |
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

### Apps P2

| Slot | Label | Π | Scénarios P0 | Contrat |
|------|-------|---|--------------|---------|
| `clocks` | Horloges | **87** | **H1–H4** | `clocks-user-scenarios.json` |
| `calendar` | Agenda | **63→87** | **Cal1–Cal4** | `calendar-user-scenarios.json` |

Pattern documenté : [procedure-scenarios-pedagogiques-gnome.md](procedure-scenarios-pedagogiques-gnome.md).

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

## Gaps ouverts

| Gap | Tag | Notes |
|-----|-----|-------|
| Captures VM pixel-perfect | **Vc** P1 | D-Bus `Shell.Screenshot` AccessDenied via SSH |
| `virsh almalinux10` absent hôte | P1 | VM accessible IP ; playbook `screenshotCapture` documenté |
| Vc Paramètres GNOME | P2 | Tour playbook VM OK ; captures comparables Capsule non collectées |

---

## Prochaines étapes

1. **Vc VM** — session GDM locale ou fix D-Bus screenshot
2. **P2 apps** — baobab, tour

---

## Commandes parité

```bash
node usr/lib/capsuleos/tools/lab/compare-os-parity.mjs --id linux-alma
node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-alma

# Smokes scénarios (exemple calendar)
CAPSULE_HTTP_BASE=http://127.0.0.1:5501 \
  node usr/lib/capsuleos/tools/lab/smoke-gnome-calendar-scenarios.mjs --id linux-alma
```
