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
window.CAPSULE_CONTENT_ROOT = CapsuleUserHome.fromRepoDepth(3);
window.CAPSULE_EXPLORER_TEMPLATE = 'nemo';
window.CAPSULE_EMBED_SKIN_KEY = 'mint';
```

## Build après changement

```bash
node usr/lib/capsuleos/tools/generate-public-manifest.mjs
node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs
```

## Rôles fréquents

`role-integrator`, `role-developer`, `role-web-designer`.
