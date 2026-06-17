# Catalogue applications — linux-anduinos

> Généré : `2026-06-17T16:13:40.477Z` · Toolkit : **gnome** · Procédure : [procedure-apps-catalog.md](../procedure-apps-catalog.md)

```bash
node usr/lib/capsuleos/tools/lab/collect-vm-apps-inventory.mjs --id linux-anduinos --write
node usr/lib/capsuleos/tools/lab/generate-apps-catalog.mjs --id linux-anduinos --write
node usr/lib/capsuleos/tools/lab/smoke-apps-catalog.mjs --id linux-anduinos
```

## Prédicats

| Symbole | Valeur |
|---------|--------|
| **AppV** | ✓ inventaire VM |
| **AppC** | ✓ catalogue |
| **AppP0** | ✓ |
| **AppΣ** | ✓ |

## Applications VM installées

| App (FR) | VM ID | Priorité | Slot | Statut | Dash | Overview | Spécificités |
|----------|-------|----------|------|--------|------|----------|--------------|
| Additional Drivers | software-properties-drivers | P2 | — | 🔷 decorative |  | ✓ | — |
| Aide Ubuntu | org.gnome.Yelp | P1 | — | 🔶 partiel | ✓ | ✓ | — |
| Calculatrice | org.gnome.Calculator | P0 | calculator | ✅ ok |  | ✓ | libadwaita-gnome · full |
| Caméra | org.gnome.Snapshot | P2 | — | 🔷 decorative |  | ✓ | — |
| Characters | org.gnome.Characters | P2 | — | 🔷 decorative |  | ✓ | — |
| Clocks | org.gnome.clocks | P2 | — | 🔷 decorative |  | ✓ | — |
| Disk Usage Analyzer | org.gnome.baobab | P2 | — | 🔷 decorative |  | ✓ | — |
| Disks | org.gnome.DiskUtility | P2 | — | 🔷 decorative |  | ✓ | — |
| Document Viewer | org.gnome.Papers | P2 | — | 🔷 decorative |  | ✓ | — |
| Éditeur de texte | org.gnome.TextEditor | P0 | text_editor | ✅ ok |  | ✓ | libadwaita-gnome · full |
| Enregistreur de son | org.gnome.SoundRecorder | P2 | — | 🔷 decorative |  | ✓ | — |
| Evolution | org.gnome.Evolution | P1 | — | ⬜ absent | ✓ |  | Favori VM — slot à créer |
| Extensions | org.gnome.Extensions | P2 | — | 🔷 decorative |  | ✓ | — |
| Fichiers | org.gnome.Nautilus | P0 | nemo | ✅ ok | ✓ | ✓ | nemo-gnome · full |
| File Roller | org.gnome.FileRoller | P2 | — | 🔷 decorative |  | ✓ | — |
| Firefox | firefox | P0 | firefox | ✅ ok | ✓ | ✓ | firefox-gnome · partial |
| Fonts | org.gnome.font-viewer | P2 | — | 🔷 decorative |  | ✓ | — |
| Image Viewer | org.gnome.Loupe | P2 | — | 🔷 decorative |  | ✓ | — |
| Jeu d’échecs | org.gnome.Chess | P2 | — | 🔷 decorative |  | ✓ | — |
| Language Support | gnome-language-selector | P2 | — | 🔷 decorative |  | ✓ | — |
| Logiciels | org.gnome.Software | P0 | update_manager | ✅ ok | ✓ | ✓ | libadwaita-gnome · full |
| Logs | org.gnome.Logs | P2 | — | 🔷 decorative |  | ✓ | — |
| Météo | org.gnome.Weather | P2 | — | 🔷 decorative |  | ✓ | — |
| Musique | org.gnome.Music | P2 | — | 🔷 decorative |  | ✓ | — |
| Paramètres | org.gnome.Settings | P0 | themes | ✅ ok |  | ✓ | libadwaita-gnome · full |
| Passwords and Keys | org.gnome.seahorse.Application | P2 | — | 🔷 decorative |  | ✓ | — |
| Printers | system-config-printer | P2 | — | 🔷 decorative |  | ✓ | — |
| Remmina | org.remmina.Remmina | P2 | — | 🔷 decorative |  | ✓ | — |
| Resources | net.nokyan.Resources | P2 | — | 🔷 decorative |  | ✓ | — |
| Software & Updates | software-properties-gtk | P2 | — | 🔷 decorative |  | ✓ | — |
| Startup Disk Creator | usb-creator-gtk | P2 | — | 🔷 decorative |  | ✓ | — |
| Statistiques de l’alimentation | org.gnome.PowerStats | P2 | — | 🔷 decorative |  | ✓ | — |
| Terminal | org.gnome.Ptyxis | P0 | terminal | ✅ ok |  | ✓ | terminal-gnome · full |
| Transmission | transmission-gtk | P2 | — | 🔷 decorative |  | ✓ | — |
| Video Player | org.gnome.Showtime | P2 | — | 🔷 decorative |  | ✓ | — |

## CapsuleOnly / hors VM

- ✅ **À propos AnduinOS** — ok (CapsuleOnly)
- ✅ **Agenda** — ok (Extension magasin — linux-anduinos)
- ✅ **Capture d'écran** — ok (CapsuleOnly)
- ✅ **Dessin** — ok (Extension magasin — linux-anduinos)
- ✅ **Gestionnaire d'archives** — ok (Extension magasin — linux-anduinos)
- ✅ **Lecteur vidéo** — ok (Extension magasin — linux-anduinos)
- ✅ **LibreOffice** — ok (Extension magasin — linux-anduinos)
- ✅ **LibreOffice Writer** — ok (Flatpak/deb optionnel — absent VM lab ; simulé CapsuleOS)
- 🎓 **Missions CapsuleOS** — capsuleOnly (CapsuleOnly)
- ✅ **Numérisation** — ok (Extension magasin — linux-anduinos)
- ✅ **Rhythmbox** — ok (Référence Ubuntu retail — absent VM lab actuelle ; simulé CapsuleOS)
- ✅ **Rhythmbox** — ok (Extension magasin — linux-anduinos)
- — **Snap Store** — notOnVm (Retail Ubuntu — CapsuleOS utilise org.gnome.Software (GS50))
- ✅ **Thunderbird** — ok (Extension magasin — linux-anduinos)
- ✅ **Timeshift** — ok (Extension magasin — linux-anduinos)
- ✅ **Transmission** — ok (Extension magasin — linux-anduinos)
- ✅ **Warpinator** — ok (Extension magasin — linux-anduinos)

