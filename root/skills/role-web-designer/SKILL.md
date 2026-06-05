---
name: capsuleos-role-web-designer
description: Applies CapsuleOS CSS layout conventions—variables, property order, flex/grid shells, responsive portal themes. Use when styling simulated desktops, apps base/skin CSS, or global theme files.
---

# Web designer CapsuleOS

## Conventions CSS

Ordre des propriétés (contrat) : position → display → width → height → margin → padding → border → font → color → background → transform → animation → transition → overflow → z-index.

## Variables

- Global : `usr/share/capsuleos/themes/global/variables.css`
- Linux : `usr/share/capsuleos/themes/linux/variables-linux.css`, `variables-apps.css`
- Apps : `usr/share/capsuleos/linux/apps/style/*.base.css` + `home/.../style/apps/*.skin.css`

## Fichiers fréquents

- Portail : `usr/share/capsuleos/themes/portal/`
- Shell skin : `home/<Vendor>/<Distro>/style/imports.css`, `style.css`
- Windows : `OS/windows/versions/*/style/imports.css`

## Interdit

Nesting CSS non standard imposé par le contrat ; frameworks CSS.

## Pairing

`role-developer` pour branchement HTML ; `os-*` pour patron visuel de l’OS.
