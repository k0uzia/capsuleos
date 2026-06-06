# Playbook bout de chaîne (τ) — Rocky Linux (GNOME)

Généré : 2026-06-06T15:20:37.644Z

## Spécificités environnement

- Registry : `linux-rocky`
- Vendor : rocky · Toolkit : gnome · Branche : rhel

## Documentation officielle à confronter

- [GNOME Help](https://help.gnome.org/users/gnome-help/stable/) — comportement utilisateur
- [GNOME HIG](https://developer.gnome.org/hig/) — patterns UI
- [gsettings-desktop-schemas](https://gitlab.gnome.org/GNOME/gsettings-desktop-schemas) — sémantique clés
- [Rocky Linux 10 Release Notes](https://docs.rockylinux.org/release_notes/10_0/) — composants EL10

## Écarts issus enquête / VM

- **theme** (P0) : H5 : cross-fade thème 300 ms + fond réappliqué (picture-uri-dark via gsettings).
- **accent** (P1) : H5 : --gcc-accent + dataset gnomeAccent ; switches adw liés à la couleur VM.
- **wallpaper** (P1) : H5 : transition fond 200 ms + picture-uri-dark synchronisé au thème.
- **night-light** (P0) : H5 : filtre 1000 ms ease-in-out ; top bar exclue (filter:none).
- **display-scale** (P1) : H5 : zoom .fedora-main-row via --gnome-display-scale + dataset displayScale.
- **dynamic-workspaces** (P0) : H5 : spring 350 ms mini-workspaces ; count 2↔4 via reconfigure.
- **hot-corner** (P1) : H5 : zone coin actif + data-hot-corners ; désactivation overview au survol.
- **dnd** (P0) : H5 : syncDndChrome QS + Paramètres + calendrier (capsule:dnd-changed).
- **notifications** (P2) : P2 : dataset notificationsEnabled + show-banners miroir.
- **contrast** (P1) : H5 : data-contrast-mode high + bordures shell/top-bar renforcées.
- **font-scale** (P1) : H5 : --a11y-font-scale-factor + dataset fontScale sur panneau Accessibilité.
- **power-mode** (P1) : H5 : data-power-mode + teinte tuile QS performance (transition 150 ms).
- **power-dim** (P2) : P2 : timeout extinction écran (dataset powerDimScreen) — pas d’effet visuel immédiat.
- **wifi** (P2) : P2 : dataset wifiEnabled + liste réseaux simulée.
- **search-files** (P1) : H5 : filterSearchCatalog + dataset searchFiles ; provider Nautilus désactivable.

## H5 appliqués

- ✓ theme
- ✓ accent
- ✓ wallpaper
- ✓ night-light
- ✓ display-scale
- ✓ dynamic-workspaces
- ✓ hot-corner
- ✓ dnd
- ✓ notifications
- ✓ contrast
- ✓ font-scale
- ✓ power-mode
- ✓ power-dim
- ✓ wifi
- ✓ search-files

## Prochaines actions H5 (restantes)

- Aucune — prêt H6

**h6Ready** : oui

