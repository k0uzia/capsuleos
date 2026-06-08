# Catalogue applications — Linux Mint (ordre alphabétique)

Ground truth : VM Mint 22.3 Zena (`collect-mint-inventory.mjs`) · Registre `linux-mint`

Généré : `2026-06-08T09:35:01.530Z` · 101 entrées menu VM visibles · 0 entrées MENU_APPS

**Procédure de reproduction** : traiter **une application par passe**, dans l’ordre du tableau « File de reproduction » ci-dessous (tri alphabétique FR), puis mettre à jour la colonne Statut.

```bash
node usr/lib/capsuleos/tools/lab/collect-mint-inventory.mjs --write-doc
node usr/lib/capsuleos/tools/lab/generate-mint-apps-catalog.mjs --write
node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Légende

| Symbole | Statut |
|---------|--------|
| ✅ | Fidèle VM (comportement + UI utilisables)
| 🔶 | Partiel (slot existant, UI ou parcours incomplet)
| ⬜ | Absent (menu grisé ou sans slot)
| 🎓 | CapsuleOnly (hors VM)

## File de reproduction (P0 + P1, ordre alphabétique)

| # | Application (FR) | VM (.desktop) | Slot CapsuleOS | Statut | Priorité |
|---|------------------|---------------|----------------|--------|----------|
| 1 | Agenda | org.gnome.Calendar.desktop | calendar | ✅ | P0 |
| 2 | Calculatrice | org.gnome.Calculator.desktop | calculator | ✅ | P0 |
| 3 | Capture d'écran | org.gnome.Screenshot.desktop | screenshot | ✅ | P0 |
| 4 | Dessin | com.github.maoschanz.drawing.desktop | drawing | ✅ | P0 |
| 5 | Éditeur de texte | org.x.editor.desktop | text_editor | ✅ | P0 |
| 6 | Fichiers | nemo.desktop | nemo | ✅ | P0 |
| 7 | Firefox | firefox.desktop | firefox | ✅ | P0 |
| 8 | Gestionnaire d'archives | org.gnome.FileRoller.desktop | file_roller | ✅ | P1 |
| 9 | Gestionnaire de mises à jour | mintupdate-kde.desktop | update_manager | ✅ | P0 |
| 10 | Gestionnaire de pilotes | mintdrivers.desktop | mintdrivers | ✅ | P1 |
| 11 | Lecteur vidéo | io.github.celluloid_player.Celluloid.desktop | lecteur_multimedia | ✅ | P0 |
| 12 | LibreOffice Calc | libreoffice-calc.desktop | librecalc | ✅ | P1 |
| 13 | LibreOffice Writer | libreoffice-writer.desktop | librewriter | ✅ | P0 |
| 14 | Logithèque | mintinstall-kde.desktop | mintinstall | ✅ | P0 |
| 15 | Moniteur système | org.gnome.SystemMonitor.desktop | system_monitor | ✅ | P1 |
| 16 | Paramètres du système | cinnamon-settings.desktop | themes | ✅ | P0 |
| 17 | Terminal | org.gnome.Terminal.desktop | terminal | ✅ | P0 |
| 18 | Thèmes | cinnamon-settings-themes.desktop | themes | ✅ | P0 |
| 19 | Visionneur d'images | xviewer.desktop | visionneur_images | ✅ | P1 |
| 20 | Visionneur de documents | xreader.desktop | visionneur_pdf | ✅ | P1 |

## Composants shell (hors applications)

| Composant | Statut |
|-----------|--------|
| Menu Cinnamon | 🔶 |
| Panel + liste fenêtres | 🔶 |
| Zone notification (tray) | ✅ |
| Horloge / calendrier | ✅ |
| Bureau + favoris | 🔶 |
| Thème Mint-Y-Dark-Aqua | ✅ |

## Catalogue complet VM (ordre alphabétique FR)

| Application (FR) | Nom VM | .desktop | Slot | Statut | Menu | Favori | Panel | Note |
|------------------|--------|----------|------|--------|------|--------|-------|------|
| Accessibility | Accessibility | cinnamon-settings-universal-access.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Account details | Account details | cinnamon-settings-user.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Actions | Actions | cinnamon-settings-actions.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Advanced Network Configuration | Advanced Network Configuration | nm-connection-editor.desktop | — | ⬜ | — |  |
| Agenda | Calendar | org.gnome.Calendar.desktop | calendar | ✅ | F | Popover horloge |
| Analyseur d'espace disque | Disk Usage Analyzer | org.gnome.baobab.desktop | baobab | ✅ | — |  |
| Applets | Applets | cinnamon-settings-applets.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Applications Web | Web Apps | webapp-manager.desktop | webapp_manager | ⬜ | — |  |
| Backgrounds | Backgrounds | cinnamon-settings-backgrounds.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Bluetooth Adapters | Bluetooth Adapters | blueman-adapters.desktop | — | ⬜ | — |  |
| Bluetooth Manager | Bluetooth Manager | blueman-manager.desktop | — | ⬜ | — |  |
| Calculatrice | Calculator | org.gnome.Calculator.desktop | calculator | ✅ | M,F | VM GNOME Calc — actuellement raccourci terminal |
| Capture d'écran | Screenshot | org.gnome.Screenshot.desktop | screenshot | ✅ | M |  |
| Character Map | Character Map | gucharmap.desktop | — | ⬜ | — |  |
| Color | Color | cinnamon-color-panel.desktop | — | ⬜ | — |  |
| Color selection dialog | Color selection dialog | mate-color-select.desktop | — | ⬜ | — |  |
| Date & Time | Date & Time | cinnamon-settings-calendar.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Desklets | Desklets | cinnamon-settings-desklets.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Desktop | Desktop | cinnamon-settings-desktop.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Dessin | Drawing | com.github.maoschanz.drawing.desktop | drawing | ✅ | M |  |
| Disks | Disks | org.gnome.DiskUtility.desktop | — | ⬜ | — |  |
| Display | Display | cinnamon-display-panel.desktop | — | ⬜ | — |  |
| Document Scanner | Document Scanner | simple-scan.desktop | — | ⬜ | — |  |
| Écran d'accueil Mint | Welcome Screen | mintwelcome.desktop | mintwelcome | ⬜ | — |  |
| Éditeur de texte | Text Editor | org.x.editor.desktop | text_editor | ✅ | M,F |  |
| Effects | Effects | cinnamon-settings-effects.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Extensions | Extensions | cinnamon-settings-extensions.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Fichiers | Files | nemo.desktop | nemo | ✅ | M,P |  |
| Fingerprints | Fingerprints | fingwit.desktop | — | ⬜ | — |  |
| Firefox | Firefox Web Browser | firefox.desktop | firefox | ✅ | M,P |  |
| Firewall Configuration | Firewall Configuration | gufw.desktop | — | ⬜ | — |  |
| Font Selection | Font Selection | cinnamon-settings-fonts.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Fonts | Fonts | org.gnome.font-viewer.desktop | — | ⬜ | — |  |
| General | General | cinnamon-settings-general.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Gestionnaire d'archives | Archive Manager | org.gnome.FileRoller.desktop | file_roller | ✅ | M |  |
| Gestionnaire de mises à jour | Update Manager | mintupdate-kde.desktop | update_manager | ✅ | — |  |
| Gestionnaire de mises à jour | Update Manager | mintupdate.desktop | update_manager | ✅ | T |  |
| Gestionnaire de pilotes | Driver Manager | mintdrivers.desktop | mintdrivers | ✅ | — |  |
| Gestures | Gestures | cinnamon-settings-gestures.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| GNOME System Monitor | GNOME System Monitor | gnome-system-monitor-kde.desktop | — | ⬜ | — |  |
| Graphics Tablet | Graphics Tablet | cinnamon-wacom-panel.desktop | — | ⬜ | — |  |
| Hot Corners | Hot Corners | cinnamon-settings-hotcorner.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Hypnotix | Hypnotix | hypnotix.desktop | hypnotix | ⬜ | — |  |
| IBus Preferences | IBus Preferences | org.freedesktop.IBus.Setup.desktop | — | ⬜ | — |  |
| Input method | Input method | mintlocale-im.desktop | — | ⬜ | — |  |
| Keyboard | Keyboard | cinnamon-settings-keyboard.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Languages | Languages | mintlocale.desktop | — | ⬜ | — |  |
| Lecteur vidéo | Celluloid | io.github.celluloid_player.Celluloid.desktop | lecteur_multimedia | ✅ | M |  |
| Library | Library | thingy.desktop | — | ⬜ | — |  |
| LibreOffice | LibreOffice | libreoffice-startcenter.desktop | — | ⬜ | — |  |
| LibreOffice Calc | LibreOffice Calc | libreoffice-calc.desktop | librecalc | ✅ | M |  |
| LibreOffice Draw | LibreOffice Draw | libreoffice-draw.desktop | — | ⬜ | — |  |
| LibreOffice Impress | LibreOffice Impress | libreoffice-impress.desktop | — | ⬜ | — |  |
| LibreOffice Writer | LibreOffice Writer | libreoffice-writer.desktop | librewriter | ✅ | M,P |  |
| Login Window | Login Window | lightdm-settings.desktop | — | ⬜ | — |  |
| Logithèque | Software Manager | mintinstall-kde.desktop | mintinstall | ✅ | — |  |
| Logithèque | Software Manager | mintinstall.desktop | mintinstall | ✅ | M,F |  |
| Moniteur système | System Monitor | org.gnome.SystemMonitor.desktop | system_monitor | ✅ | — |  |
| Mouse and Touchpad | Mouse and Touchpad | cinnamon-settings-mouse.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Network | Network | cinnamon-network-panel.desktop | — | ⬜ | — |  |
| Night Light | Night Light | cinnamon-settings-nightlight.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Notes | Notes | sticky.desktop | sticky | ⬜ | — |  |
| Notifications | Notifications | cinnamon-settings-notifications.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Onboard | Onboard | onboard.desktop | — | ⬜ | — |  |
| Online Accounts | Online Accounts | gnome-online-accounts-gtk.desktop | — | ⬜ | — |  |
| Outil de sauvegarde | Backup Tool | mintbackup.desktop | mintbackup | ⬜ | — |  |
| Panel | Panel | cinnamon-settings-panel.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Paramètres du système | System Settings | cinnamon-settings.desktop | themes | ✅ | M,F | Sous-panneau Paramètres système |
| Passwords and Keys | Passwords and Keys | org.gnome.seahorse.Application.desktop | — | ⬜ | — |  |
| Pix | Pix | pix.desktop | visionneur_images | ✅ | — |  |
| Power Management | Power Management | cinnamon-settings-power.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Power Statistics | Power Statistics | org.gnome.PowerStats.desktop | — | ⬜ | — |  |
| Preferred Applications | Preferred Applications | cinnamon-settings-default.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Printers | Printers | system-config-printer.desktop | — | ⬜ | — |  |
| Privacy | Privacy | cinnamon-settings-privacy.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Renommer fichiers | File Renamer | bulky.desktop | bulky | ⬜ | — |  |
| Rhythmbox | Rhythmbox | org.gnome.Rhythmbox3.desktop | — | ⬜ | — |  |
| Screensaver | Screensaver | cinnamon-settings-screensaver.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Software Sources | Software Sources | mintsources.desktop | — | ⬜ | — |  |
| Sound | Sound | cinnamon-settings-sound.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Startup Applications | Startup Applications | cinnamon-settings-startup.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| System Administration | System Administration | mintsysadm.desktop | — | ⬜ | — |  |
| System Information | System Information | mintreport.desktop | — | ⬜ | — |  |
| Terminal | Terminal | org.gnome.Terminal.desktop | terminal | ✅ | M,P |  |
| Thèmes | Themes | cinnamon-settings-themes.desktop | themes | ✅ | M,P | Sous-panneau Paramètres système |
| Thunderbird | Thunderbird Mail | thunderbird.desktop | thunderbird | ⬜ | — |  |
| Thunderbolt | Thunderbolt | cinnamon-settings-thunderbolt.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Timeshift | Timeshift | timeshift-gtk.desktop | timeshift | ⬜ | — |  |
| Transmission | Transmission | transmission-gtk.desktop | transmission | ⬜ | — |  |
| USB Image Writer | USB Image Writer | mintstick-kde.desktop | — | ⬜ | — |  |
| USB Image Writer | USB Image Writer | mintstick.desktop | — | ⬜ | — |  |
| USB Stick Formatter | USB Stick Formatter | mintstick-format-kde.desktop | — | ⬜ | — |  |
| USB Stick Formatter | USB Stick Formatter | mintstick-format.desktop | — | ⬜ | — |  |
| Users and Groups | Users and Groups | cinnamon-settings-users.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Vim | Vim | vim.desktop | — | ⬜ | — |  |
| Virtual keyboard | Virtual keyboard | cinnamon-onscreen-keyboard.desktop | — | ⬜ | — |  |
| Visionneur d'images | Image Viewer | xviewer.desktop | visionneur_images | ✅ | M |  |
| Visionneur de documents | Document Viewer | xreader.desktop | visionneur_pdf | ✅ | M |  |
| Warpinator | Warpinator | org.x.Warpinator.desktop | warpinator | ⬜ | — |  |
| Windows | Windows | cinnamon-settings-windows.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Workspaces | Workspaces | cinnamon-settings-workspaces.desktop | themes | ✅ | — | Sous-panneau Paramètres système |

## Slots CapsuleOS actuels (`index.html`)

- `baobab` — ✅
- `calculator` — ✅
- `checklist` — 🎓
- `drawing` — ✅
- `file_roller` — ✅
- `firefox` — ✅
- `lecteur_multimedia` — ✅
- `librecalc` — ✅
- `librewriter` — ✅
- `mainMenu` — 🔶
- `mintdrivers` — ✅
- `mintinstall` — ✅
- `nemo` — ✅
- `profile` — ✅
- `screenshot` — ✅
- `system_monitor` — ✅
- `terminal` — ✅
- `text_editor` — ✅
- `themes` — ✅
- `update_manager` — ✅
- `visionneur_images` — ✅
- `visionneur_pdf` — ✅

## Références

- [`linux-mint-vm.json`](linux-mint-vm.json)
- [`linux-mint-apps-catalog.json`](linux-mint-apps-catalog.json)
- [`inventaire-parite-mint-vm.md`](../inventaire-parite-mint-vm.md)
- [`apps-linux-par-distro.md`](../apps-linux-par-distro.md)
