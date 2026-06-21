# Parité Ubuntu — VM lab vs CapsuleOS

> VM : `<lab-inventory:linux-lab>` · **Ubuntu 26.04 LTS** (Resolute Raccoon)  
> Branche : **Debian → Ubuntu** (`home/Debian/Ubuntu/`, `OS/linux/families/debian/ubuntu/`)  
> Inventaire : [`linux-ubuntu-vm.json`](inventaires/linux-ubuntu-vm.json) · Terminal **Ti** : [`linux-ubuntu-terminal-vm.json`](inventaires/linux-ubuntu-terminal-vm.json)

## Synthèse

| Zone | VM (ground truth) | Capsule | Écart |
|------|-------------------|---------|-------|
| Version | 26.04 LTS | 26.04 LTS | OK |
| Thème | Yaru-dark, accent orange `#ff7800` | tokens Ubuntu (`--menu-accent`) | OK |
| Fond bureau | gsettings `adwaita-*.jxl` (fichiers absents VM) ; défaut réel = Resolute Dimmed | catalogue `racoon` + `adwaita` ; `--ubuntu-bg` thème clair/sombre | OK |
| Dock permanent | Latéral `ubuntu-dock@ubuntu.com` | `#tableau.fedora-dock` latéral | **OK** (décision produit) |
| Favoris dock | 8 apps VM | 8 slots (profile, Evolution grisé) | OK |
| Terminal | Ptyxis 50.1, apt/dpkg | profil `debian`, **TΣ** (Ts+Tr+chrome) | OK |
| Icônes Yaru | thème VM | `icons/gnome/yaru/` + Nautilus runtime | OK (9 MIME, 11 places) |
| Overview | dash + grille | `CapsuleGnomeOverview` + dash aligné VM | OK (captures distinctes workspace/apps) |
| Nautilus interactions | sidebar, menus, rename | smoke interactions OK | OK |

## Hiérarchie branche

```
kernel:linux
  └── branch:debian (famille OS/linux/families/debian/)
        └── branch:ubuntu (vendor ubuntu — skin home/Debian/Ubuntu/)
```

Réplication toolkit GNOME : `upstreamId: linux-rocky` (gabarit Ptyxis/Nautilus), distinct de la branche Debian.

## Favoris VM

Voir `dashFavoritesVm` dans l'inventaire — ordre Capsule dock : Firefox, Fichiers, Rhythmbox, Writer, Snap Store, Aide.

## Captures visuelles

**Orchestrateur autonome** (skill `visual-parity-lab`) :

```bash
node usr/lib/capsuleos/tools/lab/run-visual-parity-pass.mjs --id linux-ubuntu
# Repli SSH si virsh indisponible :
node usr/lib/capsuleos/tools/lab/run-visual-parity-pass.mjs --id linux-ubuntu --force-remote-vm
```

Scripts unitaires (débogage) : `capture-capsule-ubuntu.mjs` · `vm-ubuntu-capture-host.sh` · `compare-ubuntu-visual-pass.mjs`

Rapports : [`linux-ubuntu-comparaison-visuelle.md`](inventaires/linux-ubuntu-comparaison-visuelle.md) · journal `linux-ubuntu-visual-parity-events.json`

## États UI & effets (VΣ)

Approfondissement propositionnel — menus, transitions, ombres, popovers :

```bash
node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --id linux-ubuntu
```

Extension auto apps VM (**Va**) : `extend-ui-state-effects-matrix.mjs --ensure-apps` lit `*-apps-catalog.json` et ajoute les transitions `app.<slot>.open`.

Skill : `ui-state-effects-replication` · Contrat : `etc/capsuleos/contracts/ui-state-effects.json` · Recette : [convention-reproduction-os.md](convention-reproduction-os.md) §4 étapes 7a–7c

## États UI (VΣ) — clôture P1

Dernière passe `--capsule-only` : **16/16 P0** en `partial` · `smoke-ui-state-effects --require-capsule` OK.

Prérequis découvert : `sync-linux-skin-closure.mjs` avant `--capsule-only` (sonde sur façade `OS/linux/families/debian/ubuntu/`).

## Prochaines étapes

1. ~~Hooks P1 VΣ~~ — menu bureau, `CapsuleGnomeOverview`, calculatrice Aperçu, favoris dock
2. ~~Icône Evolution~~ — `evolution.png` (Yaru VM) · slot `*-unavailable`
3. ~~**Vp compare VM**~~ — **9/9** (`run-visual-parity-pass.mjs` · virsh direct, sans `lab-capture-session` si le domaine tourne)
4. ~~Polish Aperçu VM~~ — `OverviewActive` D-Bus (GNOME ≥ 41) · captures overview distinctes du bureau
5. ~~Catalogue apps Aperçu / recherche~~ — P0 grille + recherche alignés · `smoke-ubuntu-gnome-apps` OK
6. ~~**`validate-all.mjs`**~~ — **H₂ OK** (baseline globale après correctifs cross-vendor + sync façades)

## Validation

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
node usr/lib/capsuleos/tools/lab/smoke-ubuntu-gnome-apps.mjs
node usr/lib/capsuleos/tools/lab/smoke-apps-catalog.mjs --id linux-ubuntu
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs --id linux-ubuntu
node usr/lib/capsuleos/tools/linux/sync-gnome-workstation-skin.mjs
bash root/tools/lab/pull-vm-assets.sh --id linux-ubuntu
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-gnome-nautilus-interactions.mjs --profile=linux-ubuntu
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-fs-terminal-explorer-sync.mjs --profile=linux-ubuntu
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-terminal-debian-output.mjs --profile=linux-ubuntu
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-terminal-ptyxis-chrome.mjs --profile=linux-ubuntu
```
