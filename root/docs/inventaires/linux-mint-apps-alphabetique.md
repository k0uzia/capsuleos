# Catalogue applications — Linux Mint (ordre alphabétique)

Ground truth : VM Mint 22.3 Zena (`collect-mint-inventory.mjs`) · Registre `linux-mint`

Généré : `2026-06-08T14:07:18.472Z` · 101 entrées menu VM visibles · 0 entrées MENU_APPS

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
| Adaptateurs Bluetooth | Bluetooth Adapters | blueman-adapters.desktop | themes | ✅ | — | csPanel bluetooth |
| Administration du système | System Administration | mintsysadm.desktop | themes | ✅ | — | csPanel system-info |
| Affichage | Display | cinnamon-display-panel.desktop | themes | ✅ | — | csPanel display |
| Agenda | Calendar | org.gnome.Calendar.desktop | calendar | ✅ | F | Popover horloge |
| Analyseur d'espace disque | Disk Usage Analyzer | org.gnome.baobab.desktop | baobab | ✅ | — |  |
| Applets | Applets | cinnamon-settings-applets.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Applications Web | Web Apps | webapp-manager.desktop | webapp_manager | ✅ | — |  |
| Backgrounds | Backgrounds | cinnamon-settings-backgrounds.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Bibliothèque | Library | thingy.desktop | thingy | ✅ | M |  |
| Calculatrice | Calculator | org.gnome.Calculator.desktop | calculator | ✅ | M,F | VM GNOME Calc — actuellement raccourci terminal |
| Capture d'écran | Screenshot | org.gnome.Screenshot.desktop | screenshot | ✅ | M |  |
| Clavier visuel | Virtual keyboard | cinnamon-onscreen-keyboard.desktop | themes | ✅ | — | csPanel accessibility |
| Comptes en ligne | Online Accounts | gnome-online-accounts-gtk.desktop | themes | ✅ | — | csPanel online-accounts |
| Configuration réseau avancée | Advanced Network Configuration | nm-connection-editor.desktop | themes | ✅ | — | csPanel network |
| Couleur | Color | cinnamon-color-panel.desktop | themes | ✅ | — | csPanel color |
| Créateur de clé USB | USB Image Writer | mintstick-kde.desktop | mintstick | ✅ | — |  |
| Créateur de clé USB | USB Image Writer | mintstick.desktop | mintstick | ✅ | M |  |
| Date & Time | Date & Time | cinnamon-settings-calendar.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Desklets | Desklets | cinnamon-settings-desklets.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Desktop | Desktop | cinnamon-settings-desktop.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Dessin | Drawing | com.github.maoschanz.drawing.desktop | drawing | ✅ | M |  |
| Disques | Disks | org.gnome.DiskUtility.desktop | gnome_disks | ✅ | M |  |
| Écran d'accueil Mint | Welcome Screen | mintwelcome.desktop | mintwelcome | ✅ | — |  |
| Éditeur de texte | Text Editor | org.x.editor.desktop | text_editor | ✅ | M,F |  |
| Effects | Effects | cinnamon-settings-effects.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Empreintes digitales | Fingerprints | fingwit.desktop | themes | ✅ | — | csPanel fingerprints |
| Extensions | Extensions | cinnamon-settings-extensions.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Fenêtre de connexion | Login Window | lightdm-settings.desktop | themes | ✅ | — | csPanel login-window |
| Fichiers | Files | nemo.desktop | nemo | ✅ | M,P |  |
| Firefox | Firefox Web Browser | firefox.desktop | firefox | ✅ | M,P |  |
| Font Selection | Font Selection | cinnamon-settings-fonts.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Formateur de clé USB | USB Stick Formatter | mintstick-format-kde.desktop | mintstick_format | ✅ | — |  |
| Formateur de clé USB | USB Stick Formatter | mintstick-format.desktop | mintstick_format | ✅ | M |  |
| General | General | cinnamon-settings-general.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Gestionnaire Bluetooth | Bluetooth Manager | blueman-manager.desktop | themes | ✅ | — | csPanel bluetooth |
| Gestionnaire d'archives | Archive Manager | org.gnome.FileRoller.desktop | file_roller | ✅ | M |  |
| Gestionnaire de mises à jour | Update Manager | mintupdate-kde.desktop | update_manager | ✅ | — |  |
| Gestionnaire de mises à jour | Update Manager | mintupdate.desktop | update_manager | ✅ | T |  |
| Gestionnaire de pilotes | Driver Manager | mintdrivers.desktop | mintdrivers | ✅ | — |  |
| Gestures | Gestures | cinnamon-settings-gestures.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Hot Corners | Hot Corners | cinnamon-settings-hotcorner.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Hypnotix | Hypnotix | hypnotix.desktop | hypnotix | ✅ | — |  |
| Imprimantes | Printers | system-config-printer.desktop | themes | ✅ | — | csPanel printers |
| Informations système | System Information | mintreport.desktop | themes | ✅ | — | csPanel system-info |
| Keyboard | Keyboard | cinnamon-settings-keyboard.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Langues | Languages | mintlocale.desktop | themes | ✅ | — | csPanel languages |
| Lecteur vidéo | Celluloid | io.github.celluloid_player.Celluloid.desktop | lecteur_multimedia | ✅ | M |  |
| LibreOffice | LibreOffice | libreoffice-startcenter.desktop | libreoffice_startcenter | ✅ | M |  |
| LibreOffice Calc | LibreOffice Calc | libreoffice-calc.desktop | librecalc | ✅ | M |  |
| LibreOffice Draw | LibreOffice Draw | libreoffice-draw.desktop | libreoffice_draw | ✅ | M |  |
| LibreOffice Impress | LibreOffice Impress | libreoffice-impress.desktop | libreoffice_impress | ✅ | M |  |
| LibreOffice Writer | LibreOffice Writer | libreoffice-writer.desktop | librewriter | ✅ | M,P |  |
| Logithèque | Software Manager | mintinstall-kde.desktop | mintinstall | ✅ | — |  |
| Logithèque | Software Manager | mintinstall.desktop | mintinstall | ✅ | M,F |  |
| Méthode de saisie | Input method | mintlocale-im.desktop | themes | ✅ | — | csPanel input-method |
| Moniteur système | GNOME System Monitor | gnome-system-monitor-kde.desktop | system_monitor | ✅ | — | Alias KDE desktop |
| Moniteur système | System Monitor | org.gnome.SystemMonitor.desktop | system_monitor | ✅ | — |  |
| Mots de passe et clés | Passwords and Keys | org.gnome.seahorse.Application.desktop | themes | ✅ | — | csPanel passwords |
| Mouse and Touchpad | Mouse and Touchpad | cinnamon-settings-mouse.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Night Light | Night Light | cinnamon-settings-nightlight.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Notes | Notes | sticky.desktop | sticky | ✅ | — |  |
| Notifications | Notifications | cinnamon-settings-notifications.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Numérisation de documents | Document Scanner | simple-scan.desktop | simple_scan | ✅ | M |  |
| Onboard | Onboard | onboard.desktop | themes | ✅ | — | csPanel accessibility |
| Outil de sauvegarde | Backup Tool | mintbackup.desktop | mintbackup | ✅ | — |  |
| Panel | Panel | cinnamon-settings-panel.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Paramètres du système | System Settings | cinnamon-settings.desktop | themes | ✅ | M,F | Sous-panneau Paramètres système |
| Pare-feu | Firewall Configuration | gufw.desktop | themes | ✅ | — | csPanel firewall |
| Pix | Pix | pix.desktop | visionneur_images | ✅ | — |  |
| Polices | Fonts | org.gnome.font-viewer.desktop | font_viewer | ✅ | M |  |
| Power Management | Power Management | cinnamon-settings-power.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Préférences IBus | IBus Preferences | org.freedesktop.IBus.Setup.desktop | themes | ✅ | — | csPanel input-method |
| Preferred Applications | Preferred Applications | cinnamon-settings-default.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Privacy | Privacy | cinnamon-settings-privacy.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Renommer fichiers | File Renamer | bulky.desktop | bulky | ✅ | — |  |
| Réseau | Network | cinnamon-network-panel.desktop | themes | ✅ | — | csPanel network |
| Rhythmbox | Rhythmbox | org.gnome.Rhythmbox3.desktop | rhythmbox | ✅ | M |  |
| Screensaver | Screensaver | cinnamon-settings-screensaver.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Sélecteur de couleur | Color selection dialog | mate-color-select.desktop | mate_color_select | ✅ | — |  |
| Sound | Sound | cinnamon-settings-sound.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Sources de logiciels | Software Sources | mintsources.desktop | themes | ✅ | — | csPanel software-sources |
| Startup Applications | Startup Applications | cinnamon-settings-startup.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Statistiques d'alimentation | Power Statistics | org.gnome.PowerStats.desktop | power_stats | ✅ | — |  |
| Table des caractères | Character Map | gucharmap.desktop | gucharmap | ✅ | M |  |
| Tablette graphique | Graphics Tablet | cinnamon-wacom-panel.desktop | themes | ✅ | — | csPanel wacom |
| Terminal | Terminal | org.gnome.Terminal.desktop | terminal | ✅ | M,P |  |
| Thèmes | Themes | cinnamon-settings-themes.desktop | themes | ✅ | M,P | Sous-panneau Paramètres système |
| Thunderbird | Thunderbird Mail | thunderbird.desktop | thunderbird | ✅ | — |  |
| Thunderbolt | Thunderbolt | cinnamon-settings-thunderbolt.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Timeshift | Timeshift | timeshift-gtk.desktop | timeshift | ✅ | — |  |
| Transmission | Transmission | transmission-gtk.desktop | transmission | ✅ | — |  |
| Users and Groups | Users and Groups | cinnamon-settings-users.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Vim | Vim | vim.desktop | text_editor | ✅ | M | Alias éditeur terminal |
| Visionneur d'images | Image Viewer | xviewer.desktop | visionneur_images | ✅ | M |  |
| Visionneur de documents | Document Viewer | xreader.desktop | visionneur_pdf | ✅ | M |  |
| Warpinator | Warpinator | org.x.Warpinator.desktop | warpinator | ✅ | — |  |
| Windows | Windows | cinnamon-settings-windows.desktop | themes | ✅ | — | Sous-panneau Paramètres système |
| Workspaces | Workspaces | cinnamon-settings-workspaces.desktop | themes | ✅ | — | Sous-panneau Paramètres système |

## Slots CapsuleOS actuels (`index.html`)

- `baobab` — ✅
- `bulky` — ✅
- `calculator` — ✅
- `drawing` — ✅
- `file_roller` — ✅
- `firefox` — ✅
- `font_viewer` — ✅
- `gnome_disks` — ✅
- `gucharmap` — ✅
- `hypnotix` — ✅
- `lecteur_multimedia` — ✅
- `librecalc` — ✅
- `libreoffice_draw` — ✅
- `libreoffice_impress` — ✅
- `libreoffice_startcenter` — ✅
- `librewriter` — ✅
- `mainMenu` — 🔶
- `mate_color_select` — ✅
- `mintbackup` — ✅
- `mintdrivers` — ✅
- `mintinstall` — ✅
- `mintstick` — ✅
- `mintstick_format` — ✅
- `mintwelcome` — ✅
- `nemo` — ✅
- `power_stats` — ✅
- `profile` — ✅
- `rhythmbox` — ✅
- `screenshot` — ✅
- `simple_scan` — ✅
- `sticky` — ✅
- `system_monitor` — ✅
- `terminal` — ✅
- `text_editor` — ✅
- `themes` — ✅
- `thingy` — ✅
- `thunderbird` — ✅
- `timeshift` — ✅
- `transmission` — ✅
- `update_manager` — ✅
- `visionneur_images` — ✅
- `visionneur_pdf` — ✅
- `warpinator` — ✅
- `webapp_manager` — ✅

## Références

- [`linux-mint-vm.json`](linux-mint-vm.json)
- [`linux-mint-apps-catalog.json`](linux-mint-apps-catalog.json)
- [`inventaire-parite-mint-vm.md`](../inventaire-parite-mint-vm.md)
- [`apps-linux-par-distro.md`](../apps-linux-par-distro.md)
