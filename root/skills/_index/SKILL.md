---
name: capsuleos-skills-index
description: Index hiérarchie skills CapsuleOS — vendors, distributions, versions, langages. Use when choosing which agent skill to load for a scoped task.
---

# Index — hiérarchie skills

**Paradigme** : [logique-formelle.md](../../docs/logique-formelle.md) — choisir skills selon prédicats ¬**A**, **I**, domaine OS, rôle.

## Niveaux

| Niveau | Chemin | Exemple |
|--------|--------|---------|
| Vendor | `vendors/<vendor>/` | `vendors/mint/` |
| Distribution | `distributions/<registry-id>/` | `distributions/linux-mint/` |
| Version | `versions/<slug>/` | `versions/windows-11/` |
| Langage | `languages/<id>/` | `languages/javascript/` |

Skills **famille** (transverses) : `os-linux`, `os-windows`, … — inchangés à la racine de `root/skills/`.

## Clone OS (VM → skin)

- [vm-distribution-manifest](vm-distribution-manifest/SKILL.md) — manifeste `proc/` multi-vendor (ManV→ManΣ), catalogue toolkits/vendors
- [os-clone-from-vm](os-clone-from-vm/SKILL.md) — convention reproduction, workflow inventaire → home/
- [visual-parity-lab](visual-parity-lab/SKILL.md) — passe visuelle autonome VM ↔ Capsule (captures PNG + journal événements)
- [ui-state-effects-replication](ui-state-effects-replication/SKILL.md) — états UI, effets, menus/popovers (prédicats Ve–VΣ)

## GNOME / HIG

- [gnome-hig-replication](gnome-hig-replication/SKILL.md) — HIG officiel, palette, patterns, outils design (distros toolkit gnome)
- [design-shell-layout](design-shell-layout/SKILL.md) — templating, espacements `--head`, alignements top bar / Aperçu GNOME

## KDE / HIG

- [kde-hig-replication](kde-hig-replication/SKILL.md) — HIG officiel, Breeze, patterns Kirigami (distros toolkit kde)
- Doc branche : [branche-plasma-kde.md](../../docs/branche-plasma-kde.md) — panel, Kickoff, Neon référence opérationnelle

## Contrats UI bureau (4)

- [window-side-effects](window-side-effects/SKILL.md) — effets de bord fenêtres
- [css-selectors-contract](css-selectors-contract/SKILL.md) — IDs/classes DOM
- [css-variables-contract](css-variables-contract/SKILL.md) — variables CSS
- [vanilla-js-interactivity](vanilla-js-interactivity/SKILL.md) — init slots vanilla JS

Gate : `validate-ui-contracts-all.mjs` · [contrats-ui-bureau.md](../docs/contrats-ui-bureau.md)

## Vendors (33)

- [alma](vendors/alma/SKILL.md)
- [anduin](vendors/anduin/SKILL.md)
- [apple](vendors/apple/SKILL.md)
- [arch](vendors/arch/SKILL.md)
- [debian](vendors/debian/SKILL.md)
- [elementary](vendors/elementary/SKILL.md)
- [fedora](vendors/fedora/SKILL.md)
- [freebsd](vendors/freebsd/SKILL.md)
- [generic](vendors/generic/SKILL.md)
- [gentoo](vendors/gentoo/SKILL.md)
- [ghostbsd](vendors/ghostbsd/SKILL.md)
- [google](vendors/google/SKILL.md)
- [haiku](vendors/haiku/SKILL.md)
- [huawei](vendors/huawei/SKILL.md)
- [kali](vendors/kali/SKILL.md)
- [lineage](vendors/lineage/SKILL.md)
- [manjaro](vendors/manjaro/SKILL.md)
- [microsoft](vendors/microsoft/SKILL.md)
- [mint](vendors/mint/SKILL.md)
- [mx](vendors/mx/SKILL.md)
- [neon](vendors/neon/SKILL.md)
- [netbsd](vendors/netbsd/SKILL.md)
- [nixos](vendors/nixos/SKILL.md)
- [openbsd](vendors/openbsd/SKILL.md)
- [opensuse](vendors/opensuse/SKILL.md)
- [oracle](vendors/oracle/SKILL.md)
- [popos](vendors/popos/SKILL.md)
- [reactos](vendors/reactos/SKILL.md)
- [rocky](vendors/rocky/SKILL.md)
- [slackware](vendors/slackware/SKILL.md)
- [ubuntu](vendors/ubuntu/SKILL.md)
- [valve](vendors/valve/SKILL.md)
- [zorin](vendors/zorin/SKILL.md)

## Distributions actives (24)

- [linux-mint](distributions/linux-mint/SKILL.md) — Linux Mint (Cinnamon)
- [linux-ubuntu](distributions/linux-ubuntu/SKILL.md) — Ubuntu 25.10
- [linux-fedora](distributions/linux-fedora/SKILL.md) — Fedora Workstation
- [linux-mx-kde](distributions/linux-mx-kde/SKILL.md) — MX Linux KDE
- [linux-debian-kde](distributions/linux-debian-kde/SKILL.md) — Debian KDE (Plasma)
- [linux-kde-neon](distributions/linux-kde-neon/SKILL.md) — KDE neon User Edition
- [linux-opensuse](distributions/linux-opensuse/SKILL.md) — openSUSE Tumbleweed
- [linux-popos](distributions/linux-popos/SKILL.md) — Pop!_OS
- [linux-anduinos](distributions/linux-anduinos/SKILL.md) — AnduinOS
- [linux-rocky](distributions/linux-rocky/SKILL.md) — Rocky Linux (GNOME)
- [windows-95](distributions/windows-95/SKILL.md) — Windows 95
- [windows-98](distributions/windows-98/SKILL.md) — Windows 98
- [windows-me](distributions/windows-me/SKILL.md) — Windows ME
- [windows-2000](distributions/windows-2000/SKILL.md) — Windows 2000
- [windows-xp](distributions/windows-xp/SKILL.md) — Windows XP
- [windows-vista](distributions/windows-vista/SKILL.md) — Windows Vista
- [windows-7](distributions/windows-7/SKILL.md) — Windows 7
- [windows-8](distributions/windows-8/SKILL.md) — Windows 8
- [windows-8.1](distributions/windows-8.1/SKILL.md) — Windows 8.1
- [windows-10](distributions/windows-10/SKILL.md) — Windows 10
- [windows-11](distributions/windows-11/SKILL.md) — Windows 11
- [macos-sonoma](distributions/macos-sonoma/SKILL.md) — macOS Sonoma
- [android-vanilla](distributions/android-vanilla/SKILL.md) — Android (Vanilla Ice Cream)
- [ios-15](distributions/ios-15/SKILL.md) — iOS 15

## Langages (6)

- [JavaScript vanilla ES6](languages/javascript/SKILL.md)
- [JSON canonique](languages/json/SKILL.md)
- [CSS skins & toolkits](languages/css/SKILL.md)
- [HTML façades & apps](languages/html/SKILL.md)
- [Markdown documentation](languages/markdown/SKILL.md)
- [Outils Node (.mjs)](languages/node-mjs/SKILL.md)

## Génération

```bash
node usr/lib/capsuleos/tools/seed-agent-skills.mjs --write
node usr/lib/capsuleos/tools/validate-agent-skills.mjs
```

Voir [skills-hierarchie.md](../docs/skills-hierarchie.md).

