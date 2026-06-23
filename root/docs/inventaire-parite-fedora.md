# Parité Fedora Workstation — CapsuleOS

> Collecte : **juin 2026** · Registre : `linux-fedora` · Inventaire : [`inventaires/linux-fedora-vm.json`](inventaires/linux-fedora-vm.json)  
> Référence structurelle : `linux-rocky` (upstream) · VM lab : Fedora 44 GNOME Shell **50.2**

## Cloisonnement vendor (juin 2026)

Fedora partage le toolkit GNOME avec Ubuntu mais **pas** le shell Ubuntu (dock Unity). La porosité venait de :

| Source | Risque |
|--------|--------|
| Classe `fedora-dock` réutilisée par Ubuntu | Apparence Unity sur tout skin avec `display:flex` |
| `windowContainer.js` lisait `--ubuntu-dock-width` en repli | Décalage fenêtres cross-vendor |
| Héritage `linux-rocky` sans re-scope `body#fedora` | Règles Rocky/Ubuntu actives hors contexte |

**Correctifs** : dock masqué sur Fedora (`display:none`, `--fedora-dock-width:0`), inset dock mesuré par `body.id`, fonds d'écran cloisonnés par `body.id` (`gnome-wallpaper:fedora` + rejet URI Ubuntu), gate [`validate-skin-vendor-isolation.mjs`](../../usr/lib/capsuleos/tools/validate-skin-vendor-isolation.mjs).

**Avant chaque lot H6+ / patch skin** :

```bash
node usr/lib/capsuleos/tools/validate-skin-vendor-isolation.mjs
node usr/lib/capsuleos/tools/validate-toolkit-chrome-isolation.mjs
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-fedora-shell-visual.mjs
```

## P0 — Résolus (H5)

| Écart | Résolution |
|-------|------------|
| Fond F44 JXL | WebP `f44-01-day/night.webp` (transcodé depuis JXL VM) + `--fedora-bg` dans `gnome-workstation.css` |
| Dash favoris | Calculator remplace Terminal (aligné `favorite-apps` VM) |
| Catalogue Paramètres fonds | `CapsuleThemeStorage` — vendor `fedora`, tuile `f44-01` |
| Matrice assets Paramètres | `gnome-settings-assets-matrix-fedora.json` (4 entrées) |

## P1 — En cours / documentés

| Écart | Statut | Notes |
|-------|--------|-------|
| GNOME Shell 50.2 vs coque 49.x | P1 résolu (visuel) | overview.js `#fedora`, tokens Aperçu, smoke-fedora-shell-visual OK |
| Extensions VM (`window-list`, `places-menu`) | P2 | Non émulées — dash + dock Capsule suffisent P1 |
| Playbook Paramètres complet (V/G/Vc/Vp) | P1 résolu (P0) | 18/18 panneaux VM ; enquête visuelle P0 : 4/4 classés, smoke OK |
| Dock latéral Capsule | P1 résolu | Masqué sur Fedora/Alma/Rocky (GNOME pur) — dock Unity réservé à `linux-ubuntu` ; gate `validate-skin-vendor-isolation` |

## P2 — Assumés

| Écart | Raison |
|-------|--------|
| Ptyxis absent des favoris dash VM | VM n'inclut pas Ptyxis dans `favorite-apps` |
| JXL vs PNG en dépôt | Transcodage navigateur ; gate `transcodeFromVm` |

## Entrée utilisateur VM (lab)

| Outil | Rôle |
|-------|------|
| `xdotool` | Touches Super/Escape, clics souris (Xwayland) |
| `wmctrl` | Focus fenêtres (Nautilus, Firefox, …) |
| `virsh screenshot` | Capture framebuffer depuis l'hôte |

**Bootstrap VM** (une fois) :

```bash
ssh -i ~/.ssh/capsuleos-lab <lab-inventory:linux-lab> 'bash -s' < root/tools/lab/vm-fedora-lab-bootstrap.sh
bash root/tools/lab/vm-fedora-playbook-capture.sh --check-tools   # doit afficher OK
```

**Playbook → capture** (une scène ou séquence) :

```bash
bash root/tools/lab/vm-fedora-playbook-capture.sh overview-open
bash root/tools/lab/vm-fedora-playbook-capture.sh --sequence
node usr/lib/capsuleos/tools/lab/run-vm-deep-audit-phases.mjs --id linux-fedora --phases 2,3,4,5
```

Bibliothèque partagée : `root/tools/lab/vm-gnome-lab-input.sh` (sourcée par les scripts capture Fedora).

## Captures lab

```bash
bash root/tools/lab/vm-fedora-capture-host.sh
```

## Passe visuelle shell (juin 2026)

| Outil | Résultat |
|-------|----------|
| `vm-fedora-capture-host.sh` | 11 PNG VM (`fedora-vm/`) |
| `capture-capsule-fedora.mjs` | 14 PNG Capsule (`fedora-capsule/`) |
| `compare-fedora-visual-pass.mjs` | 9/9 paires — [`linux-fedora-comparaison-visuelle.md`](inventaires/linux-fedora-comparaison-visuelle.md) |
| `smoke-fedora-shell-visual.mjs` | overview, dash, CSD, fond F44 |
| `smoke-window-header-controls-visible` | fedora profile CSD OK |

**Correctif H5** : `overview.js` ciblait `#rocky` → Aperçu inactif sur Fedora.

## Playbook Paramètres GNOME (juin 2026)

| Étape | Commande | Résultat |
|-------|----------|----------|
| Matrice parité | `gnome-settings-parity-matrix-fedora.json` | 18 panneaux GNOME 50 |
| Collecte VM | `collect-vm-gnome-settings-playbook.mjs --id linux-fedora` | 18/18, 28 mappés, 0 drift |
| Smoke | `smoke-fedora-gnome-settings-playbook.mjs` | OK |
| Captures VM (V/G) | `vm-fedora-settings-playbook-capture.sh --sequence` | 5 PNG audit/ |

Inventaire : [`linux-fedora-gnome-settings-playbook.json`](inventaires/linux-fedora-gnome-settings-playbook.json)

## Enquête visuelle Paramètres (juin 2026)

| Étape | Commande | Résultat |
|-------|----------|----------|
| Matrice | `gnome-settings-visual-investigation-matrix-fedora.json` | 15 investigations (4 P0 · 10 P1 · 1 P2) |
| Collecte VM (V) | `collect-vm-gnome-settings-visual-investigation.mjs --filter P0` / `P1` / `P2` | **15/15** documentées |
| Passe gsettings (G) | `enrich-visual-investigation-gsettings-pass.mjs --id linux-fedora` | P0 enrichis, drift 0 |
| Captures Capsule (Vc) | `collect-capsule-visual-investigation.mjs --filter P0` + `P1` + `P2` | P0=7 · P1=9 · P2=3 PNG |
| Parité visuelle (Vp) | `enrich-visual-investigation-capsule-parity.mjs --id linux-fedora` | P0=4 · P1=8 · P2=3 classés `partial` |
| Smoke | `smoke-fedora-gnome-settings-visual.mjs` | P0 doc=4 Vc=4 Vp=4 |
| H6 | `close-h6-gnome-settings.mjs --id linux-fedora` | **clôturé** 2026-06-07 |

Contrôles P0 : `theme`, `night-light`, `dynamic-workspaces`, `dnd`.

Contrôles P1 : `accent`, `wallpaper`, `display-scale`, `hot-corner`, `contrast`, `font-scale`, `power-mode`, `search-files`.

Contrôles P2 : `notifications`, `power-dim`, `wifi`.

Inventaire : [`linux-fedora-gnome-settings-visual-investigation.json`](inventaires/linux-fedora-gnome-settings-visual-investigation.json)

Clôture H6 : [`linux-fedora-gnome-settings-h6-closure.json`](inventaires/linux-fedora-gnome-settings-h6-closure.json) — PbΣ · V · G · Vc · Vp · `validate-all` OK

Captures : `captures/linux-fedora/gnome-settings-visual/` (VM) · `gnome-settings-visual-capsule/` (Capsule)

## Validation

```bash
node usr/lib/capsuleos/tools/linux/sync-gnome-toolkit-pack.mjs
node usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-assets.mjs --id linux-fedora
node usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-playbook.mjs --id linux-fedora
node usr/lib/capsuleos/tools/lab/smoke-fedora-gnome-settings-playbook.mjs
node usr/lib/capsuleos/tools/lab/collect-vm-gnome-settings-visual-investigation.mjs --id linux-fedora --filter P0
node usr/lib/capsuleos/tools/lab/enrich-visual-investigation-gsettings-pass.mjs --id linux-fedora
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/collect-capsule-visual-investigation.mjs --id linux-fedora --filter P0
node usr/lib/capsuleos/tools/lab/enrich-visual-investigation-capsule-parity.mjs --id linux-fedora
node usr/lib/capsuleos/tools/lab/smoke-fedora-gnome-settings-visual.mjs
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/close-h6-gnome-settings.mjs --id linux-fedora
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-fedora-shell-visual.mjs
node usr/lib/capsuleos/tools/validate-gnome-toolkit-pack.mjs
```
