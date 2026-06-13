# Playbook bout de chaîne (τ) — Fedora Workstation

Généré : 2026-06-13T18:33:25.527Z

## Spécificités environnement

- Registry : `linux-fedora`
- Vendor : fedora · Toolkit : gnome · Branche : fedora

## Documentation officielle à confronter

- [GNOME Help](https://help.gnome.org/users/gnome-help/stable/) — comportement utilisateur
- [GNOME HIG](https://developer.gnome.org/hig/) — patterns UI
- [gsettings-desktop-schemas](https://gitlab.gnome.org/GNOME/gsettings-desktop-schemas) — sémantique clés
- [Fedora Workstation Documentation](https://docs.fedoraproject.org/en-US/fedora/latest/) — composants Workstation
- [Fedora 44 Release Notes](https://docs.fedoraproject.org/en-US/fedora/f44/release-notes/) — version courante

## Écarts issus enquête / VM

- **theme** (P0) : H5 : cross-fade thème 300 ms + fond réappliqué (picture-uri-dark via gsettings).
- **night-light** (P0) : H5 : filtre 1000 ms ease-in-out ; top bar exclue (filter:none).
- **dynamic-workspaces** (P0) : H5 : spring 350 ms mini-workspaces ; count 2↔4 via reconfigure.
- **dnd** (P0) : H5 : syncDndChrome QS + Paramètres + calendrier (capsule:dnd-changed).
- **accent** (P1) : H5 : --gcc-accent + dataset gnomeAccent ; switches adw liés à la couleur VM.
- **wallpaper** (P1) : H5 : transition fond 200 ms + picture-uri-dark synchronisé au thème.
- **display-scale** (P1) : H5 : zoom .fedora-main-row via --gnome-display-scale + dataset displayScale.
- **hot-corner** (P1) : H5 : zone coin actif + data-hot-corners ; désactivation overview au survol.
- **contrast** (P1) : H5 : data-contrast-mode high + bordures shell/top-bar renforcées.
- **font-scale** (P1) : H5 : --a11y-font-scale-factor + dataset fontScale sur panneau Accessibilité.
- **power-mode** (P1) : H5 : data-power-mode + teinte tuile QS performance (transition 150 ms).
- **search-files** (P1) : H5 : filterSearchCatalog + dataset searchFiles ; provider Nautilus désactivable.
- **notifications** (P2) : P2 : dataset notificationsEnabled + show-banners miroir.
- **power-dim** (P2) : P2 : timeout extinction écran (dataset powerDimScreen) — pas d’effet visuel immédiat.
- **wifi** (P2) : P2 : dataset wifiEnabled + liste réseaux simulée.

## H5 appliqués

- ✓ theme
- ✓ night-light
- ✓ dynamic-workspaces
- ✓ dnd
- ✓ accent
- ✓ wallpaper
- ✓ display-scale
- ✓ hot-corner
- ✓ contrast
- ✓ font-scale
- ✓ power-mode
- ✓ search-files
- ✓ notifications
- ✓ power-dim
- ✓ wifi

## Prochaines actions H5 (restantes)

- Aucune — prêt H6

**h6Ready** : oui

