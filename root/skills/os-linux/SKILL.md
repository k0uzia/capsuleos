---
name: capsuleos-os-linux
description: Expert on CapsuleOS simulated Linux desktops—Debian, Red Hat, SUSE families, kernel, explorers, home/public, embeds. Use for Mint, Ubuntu, Fedora, openSUSE, KDE/Cinnamon/GNOME skins, or Linux kernel JS under OS/linux and usr/lib/capsuleos/shells/linux.
---

# OS Linux (CapsuleOS)

## Arborescence

| Zone | Chemin |
|------|--------|
| Façades | `OS/linux/families/debian|redhat|suse/<distro>/` |
| Noyau JS/CSS | `OS/linux/kernel/` |
| Skins | `home/Debian/`, `home/RedHat/`, `home/SUSE/` |
| Apps partagées | `usr/share/capsuleos/linux/apps/` |
| Explorateurs | `usr/share/capsuleos/linux/explorers/` |
| Shell logic | `usr/lib/capsuleos/shells/linux/` |
| FS utilisateur | `home/public/` + `.capsule-manifest.json` |
| Embed offline | `var/lib/capsuleos/generated/capsule-app-embed.js` |

## Familles (writing.md)

- **Debian** : mint, ubuntu, popos, debian-kde, mx-kde, anduinos, …
- **Red Hat** : fedora
- **SUSE** : opensuse
- **Arch / Slackware** : prévus sous `OS/linux/families/` — suivre le pattern existant

## Explorateurs

Templates : `nemo`, `dolphin`, `nautilus`, `nemo-gnome`, `nemo-cosmic`, `nautilus-cosmic`. Registre : `usr/lib/capsuleos/shells/linux/explorers/explorer-registry.js`. Doc : `usr/share/capsuleos/linux/explorers/README.md`.

## Variables skin (exemple)

```html
window.CAPSULE_CONTENT_ROOT = CapsuleUserHome.resolveRelative();
window.CAPSULE_EXPLORER_TEMPLATE = 'nemo';
window.CAPSULE_EMBED_SKIN_KEY = 'mint';
```

Contrats UI bureau : [contrats-ui-bureau.md](../../docs/contrats-ui-bureau.md) · gate `validate-ui-contracts-all.mjs`.

## Build après changement

```bash
node usr/lib/capsuleos/tools/generate-public-manifest.mjs
node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs
```

## Fenêtres (drag / resize)

Skill **`window-desktop`** + [convention-contexte-fenetres.md](../../docs/convention-contexte-fenetres.md). Gate : `validate-linux-window-boot.mjs`.

## Toolkits graphiques (GTK, Qt, Cinnamon, COSMIC)

Avant toute passe CSS/UX sur un skin Linux : [contrib.md § toolkits](../../../contrib.md#bibliotheques-graphiques-linux-toolkits-gui) (tableau skin ↔ toolkit, tokens, pièges embed).

## Toolkit GNOME (GTK 4 + libadwaita)

Distros `toolkit: gnome` : charger **`gnome-hig-replication`** + [gnome-hig-ressources.md](../../docs/gnome-hig-ressources.md). Inventaire crawl : `root/docs/inventaires/gnome-hig-resources.json`.

## Toolkit KDE (Plasma + Qt/Kirigami)

Distros `toolkit: kde` : charger **`kde-hig-replication`** + [kde-hig-ressources.md](../../docs/kde-hig-ressources.md). Inventaire crawl : `root/docs/inventaires/kde-hig-resources.json`. Branche : [branche-plasma-kde.md](../../docs/branche-plasma-kde.md).

## Manifeste distribution (tous vendors Linux)

Avant import assets massif : skill **`vm-distribution-manifest`** → `run-manifest-replication-chain.mjs --id <registryId>`.  
Sorties : `proc/<id>/distribution-manifest.json`, playbook, staging → `usr/share/capsuleos/assets/` via `manifest.media.iconPack`.

## Ajouter une distro / version / vendor

Avant toute création : skill `onboarding` → [ajouter-os-scalable.md](../../docs/ajouter-os-scalable.md).  
Scaffold catalogue : `ensure-vm-manifest-vendor.mjs --write`. Gate : `validate-all.mjs`.

## Rôles fréquents

`role-integrator`, `role-developer`, `role-web-designer`.
