# Inventaire parité — Rocky Linux 10 GNOME VM → CapsuleOS

> Collecte : **juin 2026** · Registre : `linux-rocky` · Inventaire JSON : [`inventaires/linux-rocky-vm.json`](inventaires/linux-rocky-vm.json)  
> Procédure : [`procedure-lab-linux-rocky-gnome.md`](procedure-lab-linux-rocky-gnome.md) · Référence design : [`branche-redhat-gnome.md`](branche-redhat-gnome.md)

---

## Versions

| Composant | VM réelle | CapsuleOS | Action |
|-----------|-----------|-----------|--------|
| Distribution | Rocky Linux **10.2** (Red Quartz) | `linux-rocky` P1 | OK |
| Shell / DE | GNOME Shell **49.4** Wayland | Coque `fedora-*` / `#rocky` | P1 — valider tokens vs captures |
| Explorateur | **Nautilus 47** | Slot `nemo` · gabarit `nemo-gnome` | P0 résolu — titre « Fichiers » |
| Navigateur | Firefox ESR/RPM | Slot `firefox` | P1 — chrome onglets |
| Terminal | **Ptyxis** | Slot `terminal` · `linux:redhat` | P1 — invite `capsule@rocky` |

---

## Shell GNOME

| Aspect | VM | CapsuleOS | Statut |
|--------|-----|-----------|--------|
| Top bar | Date longue + horloge + tray | `fedora-top-bar` + `rocky-clock-date` | P1 |
| Dock permanent gauche | **Absent** (GNOME RHEL) | `#tableau` **masqué** | OK (modèle RHEL) |
| Dash Aperçu | **7** favoris VM (pas Music) | 6 liens + grille apps | P1 |
| Recherche Aperçu | Shell search | `overview.js` + `CapsuleAppSearch` | P1 |
| Quick Settings | Volume, réseau, thème | `volume-popover` | P2 |
| Extension fond | background-logo | Non émulé | P2 |

---

## Lanceurs (checklist panel)

| Slot CapsuleOS | VM (app réelle) | Capsule état | VM état | Statut |
|----------------|-----------------|--------------|---------|--------|
| `nemo` (Fichiers) | Nautilus | running OK | running OK, **active fragile** | P1 Wayland |
| `firefox` | Firefox | OK | OK | OK |
| `terminal` | Ptyxis | OK | running OK, **active fragile** | P1 Wayland |

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
| Settings | `themes` | via grille | ✓ | OK |
| LibreOffice Writer | `librewriter` | — | overview | P2 (Flatpak RL10) |

---

## Thèmes et assets

| Élément | VM | CapsuleOS | Statut |
|---------|-----|-----------|--------|
| Schéma couleurs | `default` / `prefer-light` | `data-theme` dark/light | OK |
| Accent | `blue` (#3584e4) | `--menu-accent` | OK |
| GTK | Adwaita | Tokens Nautilus chrome clair | OK |
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

Commandes : `vm-rocky-capture-host.sh`, `capture-capsule-rocky.mjs`, `compare-rocky-visual-pass.mjs`.

---

## Confrontation documentation officielle

| Source officielle | Exigence | CapsuleOS | Écart |
|-------------------|----------|-----------|-------|
| [RL10 Release Notes](https://docs.rockylinux.org/release_notes/10_0/) | Ptyxis remplace GNOME Terminal | Slot `terminal` | OK |
| RL10 | GNOME Text Editor remplace gedit | Slot `text_editor` | OK |
| RL10 | Wayland par défaut | N/A navigateur | OK |
| [GNOME HIG](https://developer.gnome.org/hig) | Overview + dash séparés du bureau | `fedora-overview` | P1 polish |
| GNOME Shell Design | Top bar visible dans Overview | Implémenté | OK |

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
- [ ] Prompt terminal : `capsule@rocky` vs `fed@fedora` résiduel
- [ ] Polish tokens `gnome-shell/tokens.css` depuis captures PNG
- [ ] Logo bureau : `rocky-logo.svg` vs identité VM exacte

### P2 — extension

- [ ] Apps overview décoratives (Météo, Contacts, Cartes, …)
- [ ] Loupe (remplace Eye of GNOME RL10)
- [ ] Snapshot (remplace Cheese)
- [ ] Lecteur vidéo (Totem retiré RL10)

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

## Commandes de revalidation

```bash
# Audit static + interactif
node usr/lib/capsuleos/tools/lab/collect-vm-deep-audit.mjs --id linux-rocky --phase static --write-doc
node usr/lib/capsuleos/tools/lab/run-vm-deep-audit-phases.mjs --id linux-rocky --phases 2,3,4,5

# Sonde VM
node usr/lib/capsuleos/tools/lab/lab-ssh.mjs --id linux-rocky --cmd '$HOME/capsuleos-lab/os-probe-gnome.sh state'

# Smokes
node usr/lib/capsuleos/tools/lab/smoke-rocky-gnome-ref.mjs
CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-gnome-nautilus-routing.mjs

# Clôture + validation
./root/tools/lab/update-rocky-nautilus.sh
node usr/lib/capsuleos/tools/validate-all.mjs
```

---

## Références croisées

- [branche-redhat-gnome.md](branche-redhat-gnome.md)
- [procedure-lab-linux-rocky-gnome.md](procedure-lab-linux-rocky-gnome.md)
- [linux-rocky-vm.md](inventaires/linux-rocky-vm.md)
- [convention-reproduction-os.md](convention-reproduction-os.md) §8
