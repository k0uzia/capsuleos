# Inventaire parité — Rocky Linux 10 GNOME VM → CapsuleOS

> Collecte : **juin 2026** · Registre : `linux-rocky` · Inventaire JSON : [`inventaires/linux-rocky-vm.json`](inventaires/linux-rocky-vm.json)  
> Procédure : [`procedure-lab-linux-rocky-gnome.md`](procedure-lab-linux-rocky-gnome.md) · Playbook Paramètres : [`procedure-creation-playbook-gnome-settings.md`](procedure-creation-playbook-gnome-settings.md) · Référence design : [`branche-redhat-gnome.md`](branche-redhat-gnome.md)

---

## Versions

| Composant | VM réelle | CapsuleOS | Action |
|-----------|-----------|-----------|--------|
| Distribution | Rocky Linux **10.2** (Red Quartz) | `linux-rocky` P1 | OK |
| Shell / DE | GNOME Shell **49.4** Wayland | Coque `fedora-*` / `#rocky` | P1 — valider tokens vs captures |
| Explorateur | **Nautilus 47** | Slot `nemo` · gabarit `nemo-gnome` | P0 résolu — titre « Fichiers » |
| Navigateur | Firefox ESR/RPM | Slot `firefox` | P1 — chrome onglets |
| Terminal | **Ptyxis** | Slot `terminal` · `linux:redhat` | OK — invite `capsule@rocky` |

---

## Shell GNOME

| Aspect | VM | CapsuleOS | Statut |
|--------|-----|-----------|--------|
| Top bar | Date longue + horloge + tray | `fedora-top-bar` + `rocky-clock-date` | P1 |
| Dock permanent gauche | **Absent** (GNOME RHEL) | `#tableau` **masqué** | OK (modèle RHEL) |
| Dash Aperçu | **7** favoris VM (pas Music) | 7 favoris + grille apps (ordre VM) | OK |
| Recherche Aperçu | Shell search | `overview.js` + `CapsuleAppSearch` | P1 |
| Quick Settings | Volume, réseau, thème | `volume-popover` · Paramètres → `themes` · Capture → `screenshot` | OK |
| Extension fond | background-logo (fedora watermark) | `::after` bureau + carte Aperçu | OK |
| Chrome fenêtre | Bordures Adwaita clair/sombre | `window-chrome.gnome.base.css` · tokens `--capsule-chrome-*` | OK |
| CSD libadwaita apps | Headerbar + ombre | `gnome-app-csd.base.css` · provider `libadwaita-gnome` | OK |

---

## Paramètres GNOME (`themes`)

> Modèle pédagogique aligné sur [SUSE SLED 15 SP7 — Customizing your settings](https://documentation.suse.com/sled/15-SP7/html/SLED-all/cha-gnome-settings.html). Parité fonctionnelle RL10 conservée sur **Apparence** (schéma clair/sombre Capsule).

| Panneau SUSE | Slot / ID | Contenu CapsuleOS | Fonctionnel | Statut |
|--------------|-----------|-------------------|-------------|--------|
| Wi-Fi | `wifi` | État vide réseau | Non | OK (entrée Aperçu) |
| Bluetooth §3.5 | `bluetooth` | Interrupteur + liste vide | Toggle visuel | OK |
| Apparence (RL10) | `appearance` | Style, accent, schéma, contraste, taille texte | **Oui** (thème Capsule) | OK |
| Arrière-plan §3.1 | `background` | Onglets + grille fonds + « Ajouter une image » | Sélection visuelle | OK |
| Région et langue §3.2 | `region` | Langue / Formats compte + connexion | Statique | OK |
| Clavier §3.3 | `keyboard` | Disposition + lien raccourcis | Statique | OK |
| Souris §3.7 | `mouse` | Bouton principal, vitesse, défilement | Statique | OK |
| Son §3.10 | `sound` | Sortie, volume, balance, alerte | Volume curseur | OK |
| Écrans §3.9 | `displays` | Orientation, résolution, échelle, Night Light | Toggle visuel | OK |
| Alimentation §3.6 | `power` | Extinction écran, veille | Statique | OK |
| Imprimantes §3.8 | `printers` | État vide CUPS | Statique | OK |
| Apps par défaut §3.11 | `default-apps` | Web, mail, calendrier, médias… | Statique | OK |
| Partage §3.12 | `sharing` | Interrupteur global + SSH distant | Toggle visuel | OK |
| À propos de | `about` | Rocky Linux 10 · GNOME 47 | Statique | OK |

**Ouverture contextuelle** : Aperçu → `wifi` · Quick Settings (engrenage) → `appearance` · menu bureau « Paramètres d'affichage » → `displays`.

Gabarit : `themes_gnome.html` · JS : `themes.js` (`setCapsuleSettingsPanel`, navigation sidebar).

---

## Lanceurs (checklist panel)

| Slot CapsuleOS | VM (app réelle) | Capsule état | VM état | Statut |
|----------------|-----------------|--------------|---------|--------|
| `nemo` (Fichiers) | Nautilus | running OK | running OK, **active fragile** | P1 Wayland |
| `firefox` | Firefox | OK | OK | OK |
| `terminal` | Ptyxis | OK | running OK, **active fragile** | P1 Wayland |

**Passe lab 2026-06-04 (Paramètres SUSE)** : refonte totale slot `themes` — 13 panneaux sidebar, composants switch/slider/onglets, Apparence fonctionnelle · chromes adaptatifs clair/sombre · `validate-all` + `smoke-rocky-gnome-ref` OK · commit `bba875a`.

**Passe lab 2026-06-06 (suite)** : captures Capsule étendues (12 PNG : Aperçu, QS, Loupe, Papers) · rapport visuel enrichi · virsh indisponible sur hôte → audit VM.

**Passe lab 2026-06-06** : grille Aperçu ↔ apps RL10 VM · Papers (`visionneur_pdf`) · captures PNG Capsule · rapport visuel.

**Passe lab 2026-06-04 (suite 3)** : Snapshot + Capture d'écran (slots CSD) · Quick Settings accent Adwaita · fond capture Rocky.

**Passe lab 2026-06-04 (suite 2)** : Loupe RL10 branchée · Quick Settings (tokens CSS + Paramètres) · Snapshot/Lecteur vidéo alignés VM.

**Passe lab 2026-06-04 (suite)** : filigrane `background-logo` émulé (watermark VM pull `/usr/share/rocky-logos/`) · carte workspace Aperçu avec logo VM · tokens nettoyés.

**Passe lab 2026-06-04** : ordre dash aligné sur `gsettings favorite-apps` VM · grille Aperçu sans « Fedora Media Writer » (→ Visite guidée) · icône Calculatrice SVG pull VM · `validate-all` + `smoke-rocky-gnome-ref` OK.

**Passe lab 2026-06-06** : Capsule **6/6** (`run-capsule-panel-browser.mjs`) · VM **0/6** `active` (P1 Wayland — `wmctrl`/`xdotool` ne voit pas les fenêtres, `running` OK via `pgrep`).

Référence slots : [`linux-gnome-capsule-slots.md`](inventaires/linux-gnome-capsule-slots.md).

---

## Applications et favoris dash

| Application VM | Slot CapsuleOS | Dash VM | Overview Capsule | Statut |
|----------------|----------------|---------|------------------|--------|
| Nautilus | `nemo` | ✓ | ✓ `data-overview-link` | OK |
| Firefox | `firefox` | ✓ | ✓ | OK |
| Ptyxis | `terminal` | ✓ | ✓ | OK |
| GNOME Software | `update_manager` | ✓ | ✓ | OK |
| Text Editor | `text_editor` | ✓ | ✓ | OK |
| Calculator | `calculator` | ✓ | overview | P1 |
| Calendar | `calendar` | ✓ (dash) | ✓ | OK |
| Clocks | `clocks` | décoratif VM | overview | OK |
| Settings (gnome-control-center) | `themes` | via grille + QS + menu bureau | ✓ 13 panneaux SUSE | OK |
| LibreOffice Writer | `librewriter` | — | overview | P2 (Flatpak RL10) |

---

## Thèmes et assets

| Élément | VM | CapsuleOS | Statut |
|---------|-----|-----------|--------|
| Schéma couleurs | `default` / `prefer-light` | `data-theme` dark/light | OK |
| Accent | `blue` (#3584e4) | `--menu-accent` | OK |
| GTK | Adwaita | Tokens Nautilus + CSD apps (`gnome-app-csd.base.css`) | OK |
| Bordures fenêtre | Thème clair/sombre | `--capsule-chrome-window-border` · skins Rocky/Fedora/Ubuntu | OK |
| Fond | gemstone-skies XML | PNG jour/nuit pull VM | OK |
| Icônes panel | VM `/usr/share/icons` | `vendors/rocky/panel/` | OK (pull VM) |

Snapshot : [`linux-rocky-vm-theme.json`](inventaires/linux-rocky-vm-theme.json).

---

## Parité visuelle (captures)

Rapport détaillé : [`linux-rocky-comparaison-visuelle.md`](inventaires/linux-rocky-comparaison-visuelle.md).

| Scène | VM PNG | Capsule PNG | Verdict |
|-------|--------|-------------|---------|
| Bureau sombre | ✓ | ✓ | P1 — comparer dock/overview |
| Nautilus sombre | ✓ | ✓ | P1 — tokens headerbar |
| Firefox sombre | ✓ | ✓ | P1 |
| Terminal sombre | ✓ | ✓ | P1 — Ptyxis vs chrome |
| Bureau clair | ✓ | ✓ | OK mécanisme thème |
| Nautilus clair | ✓ | ✓ | P1 |
| Paramètres — Apparence | — | ✓ `rocky-capsule-*-settings-appearance.png` | P1 — capture VM à collecter |
| Paramètres — Écrans | — | ✓ `rocky-capsule-dark-settings-displays.png` | P1 — capture VM à collecter |
| Paramètres — Son | — | — | P2 — capture optionnelle |

Commandes :

```bash
# Capsule (15 scènes : bureau, aperçu, QS, apps RL10, Paramètres…)
node root/tools/lab/capture-capsule-rocky.mjs

# VM apps (virsh) — si hyperviseur local ; sinon audit/ déjà collecté
bash root/tools/lab/vm-rocky-capture-host.sh

# Rapport VM ↔ Capsule
node root/tools/lab/compare-rocky-visual-pass.mjs
```

Captures shell VM : `rocky-vm/audit/` (Aperçu, Quick Settings) via `run-vm-deep-audit-phases.mjs`.

---

## Confrontation documentation officielle

| Source officielle | Exigence | CapsuleOS | Écart |
|-------------------|----------|-----------|-------|
| [RL10 Release Notes](https://docs.rockylinux.org/release_notes/10_0/) | Ptyxis remplace GNOME Terminal | Slot `terminal` | OK |
| RL10 | GNOME Text Editor remplace gedit | Slot `text_editor` | OK |
| RL10 | Wayland par défaut | N/A navigateur | OK |
| [GNOME HIG](https://developer.gnome.org/hig) | Overview + dash séparés du bureau | `fedora-overview` | P1 polish |
| GNOME Shell Design | Top bar visible dans Overview | Implémenté | OK |
| [SUSE — Customizing settings](https://documentation.suse.com/sled/15-SP7/html/SLED-all/cha-gnome-settings.html) | Panneaux Paramètres (§3.1–3.12) | Slot `themes` — 13 panneaux | OK pédagogique ; logique métier partielle |
| RL10 | Tweaks intégrés dans Paramètres | Apparence fonctionnelle dans `themes` | OK |

---

## Backlog par priorité

### P0 — bloquant fidélité

- [x] Routage Nautilus (`nemo-gnome` + `nautilus.skin.css` + profil boot)
- [x] Profil `CAPSULE_SKIN_PROFILE_ID` avant `capsule-skin-boot`
- [ ] Parité VM panel `active` sous Wayland (sonde — non bloquant sandbox)

### P1 — assumé / à affiner

- [x] Dash Aperçu **8 icônes** (7 favoris VM + grille apps) — calculatrice ajoutée juin 2026
- [x] **4 bureaux virtuels** — `gnome-workspaces.js` · `Super+Page Up/Down`
- [x] **Menu contextuel bureau** — `gnome-desktop-context-menu.js`
- [x] **Transitions Aperçu** — 220/280 ms cubic-bezier dans `overview.css`
- [x] **Polices VM** — `--font-ui` Red Hat Text · `--font-mono` Red Hat Mono
- [x] Prompt terminal : `capsule@rocky` (`body#rocky` + `CAPSULE_TERMINAL_PROFILE`)
- [x] Polish tokens `gnome-shell/tokens.css` — `--rocky-watermark`, dédup calendrier
- [x] Filigrane bureau VM (`background-logo` → `watermark/fedora_logo_*.svg`)
- [x] **Chrome fenêtre adaptatif** — bordures/anneau actif clair+sombre (`window-chrome.gnome.base.css`)
- [x] **Paramètres GNOME** — coque sidebar + 13 panneaux doc SUSE · navigation · Apparence fonctionnelle
- [x] **Ouverture Paramètres** — Aperçu/QS/menu bureau (`setCapsuleSettingsPanel`)
- [ ] Polish tokens Nautilus / Firefox / top bar vs captures VM
- [ ] Recherche Aperçu — comportement Shell complet
- [ ] Raccourci bureau « Rocky Linux - À propos » : `rocky-logo.svg` (CapsuleOnly)

### P2 — extension

- [x] Grille Aperçu alignée VM RL10 — Papers, Baobab, SystemMonitor · apps absentes marquées
- [x] Inventaire apps installées — [`linux-rocky-vm-apps-installed.json`](inventaires/linux-rocky-vm-apps-installed.json)
- [x] Catalogue strict apps — [`linux-rocky-apps-catalog.json`](inventaires/linux-rocky-apps-catalog.json) · [procedure-apps-catalog.md](procedure-apps-catalog.md)
- [x] Captures Capsule — 12 scènes (`capture-capsule-rocky.mjs` : Aperçu, QS, Loupe, Papers…)
- [x] Rapport visuel VM audit ↔ Capsule — `compare-rocky-visual-pass.mjs`
- [ ] Apps overview optionnelles (Contacts, Météo, Cartes…) — recherche sans slot, non installées VM lab
- [x] **Loupe** — slot `visionneur_images` · titre « Loupe » · grille + recherche Aperçu
- [x] **Snapshot** — slot `snapshot` · gabarit CSD · grille + recherche Aperçu
- [x] **Capture d'écran** — slot `screenshot` · Quick Settings · recherche Aperçu
- [x] **Lecteur vidéo** — décoratif RL10 (Showtime absent VM) · slot Capsule `lecteur_multimedia` hors recherche Rocky
- [x] **Captures Paramètres** — scènes Apparence / Écrans dans `capture-capsule-rocky.mjs` (15 PNG total)
- [x] **Baobab** — slot `baobab` · CSD libadwaita · grille + recherche Aperçu
- [x] **System Monitor** — slot `system_monitor` · CSD libadwaita · grille + recherche Aperçu
- [ ] **Bluetooth Quick Settings** — panneau Paramètres OK, tray QS incomplet
- [ ] Multi-écrans Join/Mirror (Écrans §3.9.2)

### CapsuleOnly

- [x] Missions `checklist`
- [x] Lien retour accueil CapsuleOS dans dash

---

## Audit profond VM (phases 2–5)

Rapport : [`linux-rocky-deep-audit.json`](inventaires/linux-rocky-deep-audit.json) · captures : `vendors/rocky/inventory/rocky-vm/audit/` (14 PNG)

| Phase | Résultat |
|-------|----------|
| Matrice interactions | 11 surfaces (S1–S8, W1–W2) |
| Menus contextuels | Bureau + Nautilus |
| Bureaux virtuels | 4 fixes · `Super+Page_Down/Up` |
| Animations | Burst Aperçu ×3 |
| Clavier | Bindings gsettings testés |

Commande : `node usr/lib/capsuleos/tools/lab/run-vm-deep-audit-phases.mjs --id linux-rocky --phases 2,3,4,5`

---

## Passe lab juin 2026 (suite)

| Étape | Résultat |
|-------|----------|
| Fonds Rocky PNG → WebP | 10 wallpapers + `capsule-theme-storage` |
| Panel `firefox-48` WebP | rocky / alma |
| Captures Capsule | 20 PNG régénérées (`capture-capsule-rocky.mjs`) |
| Comparaison VM↔Capsule | 14/14 paires — [`linux-rocky-comparaison-visuelle.md`](inventaires/linux-rocky-comparaison-visuelle.md) |
| Audit Nautilus | `audit-nautilus-rocky.mjs` OK (Adwaita, fil d'Ariane) |
| Smoke shell visuel | `smoke-rocky-shell-visual.mjs` — overview, dash 7, CSD, fond WebP |

VM lab (`192.168.122.234`) : checklist panel SSH en attente (VM hors ligne).

---

## Commandes de revalidation

```bash
# Audit static + interactif (VM up)
node usr/lib/capsuleos/tools/lab/collect-vm-deep-audit.mjs --id linux-rocky --phase static --write-doc
node usr/lib/capsuleos/tools/lab/run-vm-deep-audit-phases.mjs --id linux-rocky --phases 2,3,4,5

# Sonde VM
node usr/lib/capsuleos/tools/lab/lab-ssh.mjs --id linux-rocky --cmd '$HOME/capsuleos-lab/os-probe-gnome.sh state'

# Smokes (HTTP lab 8765)
node usr/lib/capsuleos/tools/lab/smoke-rocky-gnome-ref.mjs
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-rocky-shell-visual.mjs
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-gnome-nautilus-routing.mjs
node root/tools/lab/audit-nautilus-rocky.mjs
node root/tools/lab/compare-rocky-visual-pass.mjs

# Clôture + validation
./root/tools/lab/update-rocky-nautilus.sh
node usr/lib/capsuleos/tools/validate-all.mjs
```

---

## Références croisées

- [reference-gnome-expert.md](reference-gnome-expert.md)
- [branche-redhat-gnome.md](branche-redhat-gnome.md)
- [procedure-lab-linux-rocky-gnome.md](procedure-lab-linux-rocky-gnome.md)
- [procedure-creation-playbook-gnome-settings.md](procedure-creation-playbook-gnome-settings.md)
- [linux-rocky-gnome-settings-playbook.md](inventaires/linux-rocky-gnome-settings-playbook.md)
- [linux-rocky-gnome-settings-interaction.md](inventaires/linux-rocky-gnome-settings-interaction.md)
- [linux-rocky-vm.md](inventaires/linux-rocky-vm.md)
- [linux-rocky-vm-apps-installed.json](inventaires/linux-rocky-vm-apps-installed.json)
- [convention-reproduction-os.md](convention-reproduction-os.md) §8
- [roadmap.md](roadmap.md) — jalons Phase 2 GNOME Rocky
