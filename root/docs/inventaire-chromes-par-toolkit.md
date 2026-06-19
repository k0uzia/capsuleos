# Inventaire chromes — application × environnement de bureau

> Contrat runtime : [`window-chrome-contexts.json`](../../etc/capsuleos/contracts/window-chrome-contexts.json)  
> Référence GNOME : [reference-gnome-expert.md](reference-gnome-expert.md)  
> Hubs CSS : `usr/share/capsuleos/themes/clusters/toolkit-*/chrome.css`  
> Gate : `node usr/lib/capsuleos/tools/validate-toolkit-chrome-isolation.mjs`

## Principe

| Couche | Rôle | Emplacement |
|--------|------|-------------|
| **Noyau partagé** | Drag, resize, menu contextuel, `#windowHeader` template | `themes/global/interactions-window.base.css`, `chrome.js` |
| **Hub toolkit** | Point d'entrée chrome par DE — **obligatoire** dans `imports.css` | `clusters/toolkit-{gnome,cinnamon,cosmic,kde}/chrome.css` |
| **Surcharge vendor** | Tokens couleur, barre titre WM (Muffin, Breeze, COSMIC…) | `home/*/style/gnome-shell/windows-chrome.css`, `cinnamon-window-chrome.css`, `windows.css`, etc. |
| **Surcharge app** | CSD libadwaita, headerbar Nautilus, onglets Firefox/Ptyxis | `linux/apps/style/*.skin.css` + providers runtime |

Le pilote Cinnamon (`window-chrome.base.css`) ne doit être chargé **que** via `toolkit-cinnamon/chrome.css`.

## Hubs toolkit

| Toolkit | WM | Hub CSS | Base importée | Surcharge skin type |
|---------|-----|---------|---------------|---------------------|
| **cinnamon** | Muffin SSD | `toolkit-cinnamon/chrome.css` | `window-chrome.base.css` | `cinnamon-window-chrome.css` (Mint) |
| **gnome** | Mutter SSD + CSD | `toolkit-gnome/chrome.css` | `window-chrome.gnome.base.css` + `gnome-app-csd.base.css` | `gnome-shell/windows-chrome.css` |
| **cosmic** | COSMIC | `toolkit-cosmic/chrome.css` | `window-chrome.interactions.css` | `cosmic-shell/windows-chrome.css` |
| **kde** | Breeze | `toolkit-kde/chrome.css` | `window-chrome.interactions.css` | `style/windows.css` |

## Providers runtime par slot (GNOME — référence Rocky)

| Slot | App native VM | Chrome d'origine | Provider CapsuleOS | CSS app |
|------|---------------|------------------|-------------------|---------|
| `nemo` | Nautilus 47 | Headerbar CSD + contrôles droite | `nemo-gnome` | `nautilus*.skin.css` |
| `firefox` | Firefox ESR | Onglets intégrés (chrome GNOME) | `firefox-gnome` | `firefox*.skin.css` |
| `terminal` | Ptyxis | Onglets dans barre titre | `terminal-gnome` | `terminal*.skin.css` |
| `calculator` | GNOME Calc | libadwaita CSD | `libadwaita-gnome` | `calculator*.skin.css` |
| `text_editor` | Text Editor (xed) | libadwaita CSD | `libadwaita-gnome` | `text_editor*.skin.css` |
| `calendar` | GNOME Calendar | libadwaita CSD | `libadwaita-gnome` | `calendar*.skin.css` |
| `clocks` | GNOME Clocks | libadwaita CSD | `libadwaita-gnome` | `clocks*.skin.css` |
| `update_manager` | GNOME Software | libadwaita CSD | `libadwaita-gnome` | `update_manager*.skin.css` |
| `themes` | Paramètres GNOME | libadwaita CSD | `libadwaita-gnome` | `themes*.skin.css` |
| `profile` | — (CapsuleOS) | libadwaita CSD | `libadwaita-gnome` | `profile*.skin.css` |
| `checklist` | — | libadwaita CSD | `libadwaita-gnome` | `checklist*.skin.css` |
| `librewriter` | LibreOffice Writer | libadwaita CSD | `libadwaita-gnome` | `librewriter*.skin.css` |
| `visionneur_*` | Visionneurs | libadwaita CSD | `libadwaita-gnome` | `visionneur*.skin.css` |
| *autres* | — | Mutter SSD (barre capsule) | `default` | — |

## Cinnamon (Mint P0)

| Slot | App native | Chrome d'origine | Provider | Surcharge |
|------|------------|------------------|----------|-----------|
| `nemo` | Nemo | Barre Muffin unifiée | `nemo` | `nemo.skin.css` |
| `file_roller` | File Roller | GTK CSD (contrôles dans toolbar) | `file-roller-gtk` | — |
| *autres* | — | Barre Muffin SSD | `cinnamon` | `cinnamon-window-chrome.css` |

## KDE (openSUSE, MX, Debian-KDE, Neon)

| Slot | App native | Chrome d'origine | Provider | Surcharge |
|------|------------|------------------|----------|-----------|
| `dolphin` / `nemo` | Dolphin | Breeze titlebar | `dolphin` | `windows.css` |
| *autres* | — | Breeze SSD | `default` | `windows.css` |

## COSMIC (Pop!_OS)

| Slot | Chrome d'origine | Provider | Surcharge |
|------|------------------|----------|-----------|
| Explorateur | Headerbar COSMIC | `nemo-gnome` | `cosmic-shell/windows-chrome.css` |
| `terminal` | COSMIC terminal | `terminal-cosmic` | idem |
| *autres* | COSMIC frame | `default` | idem |

## Skins actifs → hub chrome

| Profil | Skin | Hub |
|--------|------|-----|
| `linux-mint` | `home/Debian/Mint` | `toolkit-cinnamon` |
| `linux-rocky` | `home/RedHat/Rocky` | `toolkit-gnome` |
| `linux-fedora` | `home/RedHat/Fedora` | `toolkit-gnome` |
| `linux-alma` | `home/RedHat/Alma` | `toolkit-gnome` |
| `linux-ubuntu` | `home/Debian/Ubuntu` | `toolkit-gnome` (`update_manager` → `libadwaita-gnome`, GS50) |
| `linux-anduinos` | `home/Debian/AnduinOS` | `toolkit-gnome` |
| `linux-popos` | `home/Debian/PopOS` | `toolkit-cosmic` |
| `linux-opensuse` | `home/SUSE/openSUSE` | `toolkit-kde` |
| `linux-mx-kde` | `home/Debian/MX-KDE` | `toolkit-kde` |
| `linux-debian-kde` | `home/Debian/Debian-KDE` | `toolkit-kde` |
| `linux-kde-neon` | `home/Debian/KDE-Neon` | `toolkit-kde` |

## Gates

```bash
node usr/lib/capsuleos/tools/validate-toolkit-chrome-isolation.mjs
node usr/lib/capsuleos/tools/validate-gnome-chrome-apps.mjs
node usr/lib/capsuleos/tools/validate-window-chrome-contexts.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
```
