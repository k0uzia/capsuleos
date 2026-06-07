# Parité Ubuntu — VM lab vs CapsuleOS

> VM : `capsule@192.168.122.141` · **Ubuntu 26.04 LTS** (Resolute Raccoon)  
> Branche : **Debian → Ubuntu** (`home/Debian/Ubuntu/`, `OS/linux/families/debian/ubuntu/`)  
> Inventaire : [`linux-ubuntu-vm.json`](inventaires/linux-ubuntu-vm.json) · Terminal **Ti** : [`linux-ubuntu-terminal-vm.json`](inventaires/linux-ubuntu-terminal-vm.json)

## Synthèse

| Zone | VM (ground truth) | Capsule | Écart |
|------|-------------------|---------|-------|
| Version | 26.04 LTS | 26.04 LTS | OK |
| Thème | Yaru-dark, accent orange `#ff7800` | tokens Ubuntu | P1 polish |
| Fond bureau | gsettings `adwaita-*.jxl` (fichiers absents VM) ; défaut réel = Resolute Dimmed | catalogue `racoon` + `adwaita` ; `--ubuntu-bg` thème clair/sombre | OK |
| Dock permanent | Latéral `ubuntu-dock@ubuntu.com` | `#tableau.fedora-dock` latéral | **OK** (décision produit) |
| Favoris dock | 8 apps VM | 6 slots mappables | P1 (bootstrap, Evolution absents) |
| Terminal | Ptyxis 50.1, apt/dpkg | profil `debian`, **TΣ** (Ts+Tr+chrome) | OK |
| Icônes Yaru | thème VM | `icons/gnome/yaru/` + Nautilus runtime | OK (9 MIME, 11 places) |
| Overview | dash + grille | dash Aperçu + `overview.js` `#ubuntu` | P1 |
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

## Prochaines étapes

1. ~~`application-x-generic` Yaru (fallback MIME)~~ — `text-x-generic` (pull + runtime)
2. Polish Aperçu / favoris bootstrap+Evolution
3. ~~Captures visuelles comparatives VM ↔ Capsule~~ — scripts lab ci-dessus

## Validation

```bash
node usr/lib/capsuleos/tools/linux/sync-gnome-workstation-skin.mjs
bash root/tools/lab/pull-vm-assets.sh --id linux-ubuntu
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-gnome-nautilus-interactions.mjs --profile=linux-ubuntu
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-fs-terminal-explorer-sync.mjs --profile=linux-ubuntu
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-terminal-debian-output.mjs --profile=linux-ubuntu
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-terminal-ptyxis-chrome.mjs --profile=linux-ubuntu
```
