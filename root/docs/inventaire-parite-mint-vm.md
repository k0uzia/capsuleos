# Inventaire parité — Linux Mint VM → CapsuleOS

Procédure : [`procedure-clonage-os-depuis-vm.md`](procedure-clonage-os-depuis-vm.md) · Statut clone : [`inventaires/linux-mint-clone-status.md`](inventaires/linux-mint-clone-status.md)

Collecte : `2026-06-04T09:11:48Z` · Registre : `linux-mint` · JSON : [`inventaires/linux-mint-vm.json`](inventaires/linux-mint-vm.json)

## Versions

| Composant | VM réelle | CapsuleOS | Action |
|-----------|-----------|-----------|--------|
| Distribution | Mint 22.3 zena | 22.3 "Zena" | **aligné** — OK |
| Cinnamon | Cinnamon 6.6.7 | profil + brief | **P2** — `Cinnamon 6.6.7` dans brief / À propos |
| Nemo | nemo 6.6.3 | template nemo | OK |
| Firefox | Mozilla Firefox 151.0.1 | embed | OK |

## Panel

| Aspect | VM | CapsuleOS |
|--------|-----|-----------|
| Hauteur | ['1:40'] | ~40px (CSS footer) |
| Lanceurs | menu + **grouped-window-list** | Icônes fixes (nemo, ff, term, …) |
| Liste fenêtres | applet grouped-window-list | `#taskbar-window-list` |

### Lanceurs panel (checklist P0)

| Slot CapsuleOS | VM | Statut |
|------------------|-----|--------|
| mainMenu | Menu Mint | OK |
| nemo | Nemo / Fichiers | OK (system-file-manager) |
| firefox | Firefox | OK (firefox) |
| terminal | Terminal | OK (org.gnome.Terminal) |
| themes | Thèmes / Paramètres | P2 — slot Paramètres (favori bureau VM) |
| librewriter | LibreOffice Writer (panel) | CapsuleOS (pédagogie) |
| checklist | Missions (pédagogie) | CapsuleOS (pédagogie) |

## Zone tray

| CapsuleOS | VM (applets) |
|-----------|----------------|
| Mises à jour | oui |
| Statut XApp | oui |
| Imprimantes | oui |
| Supports amovibles | oui |
| Clavier | oui |
| Réseau | oui |
| Volume | oui |
| Alimentation | oui |
| Coin bureau | oui |
| Horloge / calendrier | oui |

Applets VM : systray, xapp-status, notifications, printers, removable-drives, keyboard, favorites, network, sound, power, calendar, cornerbar

## Thèmes & assets

| Élément | VM | CapsuleOS |
|---------|-----|-----------|
| Thème Cinnamon | Mint-Y-Dark-Aqua | Mint-Y (CSS) |
| GTK | Mint-Y-Aqua | variables skin |
| Icônes | Mint-Y-Sand | Mint-Y / cinnamon icons |
| Fond | file:///usr/share/backgrounds/linuxmint/default_background.j… | `default_background.jpg` | OK |

## Applications et favoris bureau

| Favori VM (.desktop) | CapsuleOS | Statut |
|----------------------|-----------|--------|
| org.gnome.Calculator.desktop | Bureau → menu → terminal | P1 simulation |
| org.gnome.Calendar.desktop | Bureau → popover horloge | OK |
| org.x.editor.desktop (xed) | Bureau + `text_editor` | P2 clone |
| mintinstall.desktop | Bureau + `update_manager` | OK |
| cinnamon-settings.desktop | Bureau → `themes` | OK |

| Panel CapsuleOS | VM panel | Statut |
|-----------------|------------|--------|
| librewriter | absent | CapsuleOnly pédagogie |
| checklist | absent | CapsuleOnly |

## Système de fichiers simulé

| Chemin | VM (référence) | CapsuleOS | Statut |
|--------|------------------|-----------|--------|
| Documents | XDG Documents | Nemo sidebar + `CAPSULE_CONTENT_ROOT` | P0 comparateur étape 5 |
| Téléchargements | XDG Downloads | Nemo sidebar | OK |
| Bureau | XDG Desktop | Explorateur + raccourcis `#desktop` | OK |

## Backlog par priorité

### P0 — fidélité bloquante
- Panel : running-link / active-link / minimize (`taskbar-launcher-state.js`)
- Nemo sidebar Documents (`compare-os-parity` étape 5)
- Checklist panel CapsuleOS 6/6 (`run-capsule-panel-browser.mjs`)

### P1 — assumé
- Lanceurs fixes vs `grouped-window-list` (pédagogie)
- Calculatrice → terminal / menu (pas GNOME Calculator)
- Lab VM : étape Firefox focus fragile (multi-fenêtres)

### P2 — livré ou en cours
- Fond `default_background.jpg`, icônes `vendors/mint/panel/`
- Tray : xapp-status, cornerbar, printers, keyboard, power
- Favoris bureau + xed (`text_editor`)
- Effets fenêtre Cinnamon (`cinnamon-window-effects.js`)
- Versions composants dans profil / brief

### P3 — hors scope
- `button-layout` Muffin, multi-écrans, workspaces
- Applet grouped-window-list natif

### CapsuleOnly
- checklist, librewriter panel, retour accueil

## Commandes

```bash
node usr/lib/capsuleos/tools/lab/collect-mint-inventory.mjs
node usr/lib/capsuleos/tools/lab/collect-mint-inventory.mjs --write-doc
```
