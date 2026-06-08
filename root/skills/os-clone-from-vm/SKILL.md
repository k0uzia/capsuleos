---
name: capsuleos-os-clone-from-vm
description: Reproduces a real desktop OS from a VM into CapsuleOS following the canonical clone convention — inventory first, home/ skin only, assets from VM, sync facades, validate-all. Use when cloning Rocky, Mint, KDE Neon, or any registry entry from lab VM ground truth.
---

# Clone OS depuis VM

## Quand invoquer

- Parité VM ↔ skin CapsuleOS (nouveau vendor ou rattrapage)
- Utilisateur cite « reproduction », « clone », « ground truth », « inventaire VM »
- **Avant** tout patch massif CSS/JS d’un skin Linux

## Séquence (imposée)

1. Lire [logique-formelle.md](../../docs/logique-formelle.md) — **R-INV1**, **A**, **S**, **M**.
2. Lire [convention-reproduction-os.md](../../docs/convention-reproduction-os.md) (§2 concepts, §4 workflow).
3. Lire [procedure-audit-vm-profonde.md](../../docs/procedure-audit-vm-profonde.md) — **audit interactif complet** (clics, menus, bureaux, animations, raccourcis, assets).
4. `node usr/lib/capsuleos/tools/validate-all.mjs` — **H₂** baseline.
5. `node usr/lib/capsuleos/tools/print-agent-brief.mjs <registryId>`.
6. Vérifier `etc/capsuleos/lab-inventory.json` (gitignoré) — **M** SSH + sonde VM.
7. Manifeste distribution : `run-manifest-replication-chain.mjs` — **ManV→ManΣ** (skill `vm-distribution-manifest`) ; scaffold vendor si absent (`ensure-vm-manifest-vendor.mjs --write`).
8. Inventaire : `root/docs/inventaires/<registryId>-vm.json` + **`<registryId>-deep-audit.json`** — **I** / **I⁺**.
9. Coder sous **`home/<Vendor>/<Distro>/`** uniquement (interdit si ¬**I**).
10. Assets : playbook manifeste (`import-manifest-staging.mjs`) puis compléments `pull-vm-assets.sh` — **A**, **S**, **T** ; jamais emprunter un autre vendor.
11. Clôture : `node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs`.
12. `validate-all.mjs` — **H₆** + captures VM/Capsule si campagne parité :
    - `visual-parity-lab` → `run-visual-parity-pass.mjs` (**Vp**)
    - `ui-state-effects-replication` → `run-ui-state-effects-pass.mjs` (**Va → VΣ**, apps détectées auto)
13. **Cycles clone** — orchestrateur campagne : `run-clone-cycle.mjs --id <registryId> --status` puis `--run-next` / `--auto` ; doc [moteur-clonage-experience.md](../../docs/moteur-clonage-experience.md). **11 cycles** typiques vers Π=100.
14. **Cross-régression** — après tout touch `fileExplorer/`, `contentLoader.js`, `mainMenu.js` : `run-cross-regression-gates.mjs --kernel-touch` (Mint Nemo + Rocky Nautilus).

## Ubuntu GNOME (refonte depuis VM)

```bash
# Procédure : root/docs/procedure-lab-linux-ubuntu-gnome.md
virsh -c qemu:///system domifaddr ubuntu25.10

# Bootstrap SSH dans la VM si besoin
bash root/tools/lab/vm-ubuntu-lab-bootstrap.sh

node usr/lib/capsuleos/tools/lab/lab-ssh.mjs --id linux-ubuntu
node usr/lib/capsuleos/tools/lab/collect-gnome-vm-inventory.mjs --id linux-ubuntu --write --write-doc
bash root/tools/lab/pull-vm-assets.sh --id linux-ubuntu
```

Singularités : **dock permanent** (`body#ubuntu`), **Yaru**, terminal **`debian`** (`apt`). Cloisonnement : `validate-skin-vendor-isolation.mjs`.

## Rocky GNOME (raccourci)

```bash
# Audit profond static (raccourcis, polices, favoris, workspaces)
node usr/lib/capsuleos/tools/lab/collect-vm-deep-audit.mjs --id linux-rocky --phase static --write-doc

# VM : lab-vm-rhel-wayland.md — DISPLAY + XAUTHORITY Mutter
ssh -i ~/.ssh/capsuleos-lab capsule@<IP> '$HOME/capsuleos-lab/os-probe-gnome.sh state'

# Après modifs Nautilus / skin Rocky
./root/tools/lab/update-rocky-nautilus.sh
```

## Contrats à respecter

| Domaine | Skill / gate |
|---------|----------------|
| CSS variables + calc | `css-variables-contract` · `validate-css-variables-contract.mjs` |
| Chrome fenêtre | `window-chrome-contexts.md` · `validate-window-chrome-contexts.mjs` |
| ES6 / init slots | `vanilla-js-interactivity` · `validate-vanilla-js.mjs` |
| Façades pick-os | `validate-linux-facades.mjs` (via sync-linux-skin-closure) |

## Ne pas

- Éditer `OS/linux/families/.../index.html` à la main (façade générée)
- Mettre des icônes système sous `home/*/assets/` (zone `usr/share/capsuleos/assets/`)
- Dupliquer une logique noyau déjà centralisée (explorateur, drag, chrome)
- Classer un écart P0 sans le documenter dans le rapport de parité

## Pairing

`vm-distribution-manifest` · `onboarding` · `os-linux` · `capsuleos-distro-<id>` · `capsuleos-vendor-<vendor>` · `role-integrator` · `asset-pipeline` · `kernel-supervisor` (si gate assets)

## Références

- [procedure-audit-vm-profonde.md](../../docs/procedure-audit-vm-profonde.md) — **procédure maître audit VM**
- [procedure-clonage-os-depuis-vm.md](../../docs/procedure-clonage-os-depuis-vm.md)
- [procedure-lab-linux-rocky-gnome.md](../../docs/procedure-lab-linux-rocky-gnome.md)
- [lab-vm-rhel-wayland.md](../../docs/lab-vm-rhel-wayland.md) (Rocky / Alma / RHEL)
- [convention-manifest-vm.md](../../docs/convention-manifest-vm.md)
- [procedure-manifest-playbook.md](../../docs/procedure-manifest-playbook.md)
- [convention-assets-depuis-vm.md](../../docs/convention-assets-depuis-vm.md)
- Template : [inventaires/_template-vm-deep-audit.json](../../docs/inventaires/_template-vm-deep-audit.json)
