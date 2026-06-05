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

1. Lire [convention-reproduction-os.md](../../docs/convention-reproduction-os.md) (§2 concepts, §4 workflow).
2. Lire [procedure-audit-vm-profonde.md](../../docs/procedure-audit-vm-profonde.md) — **audit interactif complet** (clics, menus, bureaux, animations, raccourcis, assets).
3. `node usr/lib/capsuleos/tools/validate-all.mjs` — baseline.
4. `node usr/lib/capsuleos/tools/print-agent-brief.mjs <registryId>`.
5. Vérifier `etc/capsuleos/lab-inventory.json` (gitignoré) — SSH + sonde VM.
6. Inventaire : `root/docs/inventaires/<registryId>-vm.json` + **`<registryId>-deep-audit.json`** (phases static → keyboard).
7. Coder sous **`home/<Vendor>/<Distro>/`** uniquement.
8. Assets : `bash root/tools/lab/pull-vm-assets.sh --id <registryId>` — jamais emprunter un autre vendor.
9. Clôture : `node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs`.
10. `validate-all.mjs` + captures VM/Capsule si campagne parité.

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

`onboarding` · `os-linux` · `capsuleos-distro-<id>` · `capsuleos-vendor-<vendor>` · `role-integrator` · `asset-pipeline` · `kernel-supervisor` (si gate assets)

## Références

- [procedure-audit-vm-profonde.md](../../docs/procedure-audit-vm-profonde.md) — **procédure maître audit VM**
- [procedure-clonage-os-depuis-vm.md](../../docs/procedure-clonage-os-depuis-vm.md)
- [procedure-lab-linux-rocky-gnome.md](../../docs/procedure-lab-linux-rocky-gnome.md)
- [lab-vm-rhel-wayland.md](../../docs/lab-vm-rhel-wayland.md) (Rocky / Alma / RHEL)
- [convention-assets-depuis-vm.md](../../docs/convention-assets-depuis-vm.md)
- Template : [inventaires/_template-vm-deep-audit.json](../../docs/inventaires/_template-vm-deep-audit.json)
