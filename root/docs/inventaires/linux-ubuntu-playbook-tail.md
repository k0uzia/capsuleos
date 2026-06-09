# Playbook bout de chaîne (τ) — Ubuntu 26.04 LTS

Généré : 2026-06-08T23:12:28.232Z

## Spécificités environnement

- Registry : `linux-ubuntu`
- Vendor : ubuntu · Toolkit : gnome · Branche : ubuntu

## Documentation officielle à confronter

- [GNOME Help](https://help.gnome.org/users/gnome-help/stable/) — comportement utilisateur
- [GNOME HIG](https://developer.gnome.org/hig/) — patterns UI
- [gsettings-desktop-schemas](https://gitlab.gnome.org/GNOME/gsettings-desktop-schemas) — sémantique clés

## Écarts issus enquête / VM

- **theme** (P0) : H5 : cross-fade thème 300 ms + fond réappliqué (picture-uri-dark via gsettings).
- **night-light** (P0) : H5 : filtre 1000 ms ease-in-out ; top bar exclue (filter:none).
- **dynamic-workspaces** (P0) : H5 : spring 350 ms mini-workspaces ; count 2↔4 via reconfigure.
- **dnd** (P0) : H5 : syncDndChrome QS + Paramètres + calendrier (capsule:dnd-changed).

## H5 appliqués

- ✓ theme
- ✓ night-light
- ✓ dynamic-workspaces
- ✓ dnd

## Prochaines actions H5 (restantes)

- Aucune — prêt H6

**h6Ready** : oui

