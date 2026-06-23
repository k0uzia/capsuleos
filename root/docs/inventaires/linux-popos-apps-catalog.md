# Catalogue applications — linux-popos

> Généré : `2026-06-19T13:07:19.421Z` · Toolkit : **cosmic** · Procédure : [procedure-apps-catalog.md](../procedure-apps-catalog.md)

```bash
node usr/lib/capsuleos/tools/lab/collect-vm-apps-inventory.mjs --id linux-popos --write
node usr/lib/capsuleos/tools/lab/generate-apps-catalog.mjs --id linux-popos --write
node usr/lib/capsuleos/tools/lab/smoke-apps-catalog.mjs --id linux-popos
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
| COSMIC Screenshot | com.system76.CosmicScreenshot | P2 | — | 🔷 decorative |  | ✓ | — |
| Disk Usage Analyzer | org.gnome.baobab | P2 | — | 🔷 decorative |  | ✓ | — |
| Disks | org.gnome.DiskUtility | P2 | — | 🔷 decorative |  | ✓ | — |
| Document Viewer | org.gnome.Evince | P2 | — | 🔷 decorative |  | ✓ | — |
| drawing | drawing | P1 | drawing | 🔶 partiel |  |  | libadwaita-gnome · partial |
| Éditeur de texte | com.system76.CosmicEdit | P0 | text_editor | ✅ ok | ✓ | ✓ | cosmic · full |
| Fichiers | com.system76.CosmicFiles | P0 | nemo | ✅ ok | ✓ | ✓ | cosmic · full |
| File Roller | org.gnome.FileRoller | P2 | — | 🔷 decorative |  | ✓ | — |
| file_roller | file_roller | P1 | file_roller | 🔶 partiel |  |  | libadwaita-gnome · partial |
| Firefox | firefox | P0 | firefox | ✅ ok | ✓ | ✓ | firefox-gnome · partial |
| Flasheur USB Popsicle | com.system76.Popsicle | P2 | — | 🔷 decorative |  | ✓ | — |
| Fonts | org.gnome.font-viewer | P2 | — | 🔷 decorative |  | ✓ | — |
| IBus Preferences | org.freedesktop.IBus.Setup | P2 | — | 🔷 decorative |  | ✓ | — |
| Image Viewer | org.gnome.eog | P2 | — | 🔷 decorative |  | ✓ | — |
| Language Support | gnome-language-selector | P2 | — | 🔷 decorative |  | ✓ | — |
| Lecteur multimédia | com.system76.CosmicPlayer | P0 | lecteur_multimedia | ✅ ok |  | ✓ | libadwaita-gnome · decorative |
| LibreOffice | libreoffice-startcenter | P2 | — | 🔷 decorative |  | ✓ | — |
| LibreOffice Calc | libreoffice-calc | P2 | — | 🔷 decorative |  | ✓ | — |
| LibreOffice Draw | libreoffice-draw | P2 | — | 🔷 decorative |  | ✓ | — |
| LibreOffice Impress | libreoffice-impress | P2 | — | 🔷 decorative |  | ✓ | — |
| LibreOffice Math | libreoffice-math | P2 | — | 🔷 decorative |  | ✓ | — |
| LibreOffice Writer | libreoffice-writer | P1 | librewriter | ✅ ok |  |  | libadwaita-gnome · full |
| Paramètres | com.system76.CosmicSettings | P0 | themes | ✅ ok | ✓ | ✓ | cosmic · full |
| Paramètres de Qt5 | qt5ct | P2 | — | 🔷 decorative |  | ✓ | — |
| Paramètres de Qt6 | qt6ct | P2 | — | 🔷 decorative |  | ✓ | — |
| Passwords and Keys | org.gnome.seahorse.Application | P2 | — | 🔷 decorative |  | ✓ | — |
| Pop Shop | pop-shop | P0 | update_manager | ✅ ok | ✓ | ✓ | cosmic · full |
| Printers | system-config-printer | P2 | — | 🔷 decorative |  | ✓ | — |
| Repoman | repoman | P2 | — | 🔷 decorative |  | ✓ | — |
| Screenshot | org.gnome.Screenshot | P2 | — | 🔷 decorative |  | ✓ | — |
| simple_scan | simple_scan | P1 | simple_scan | 🔶 partiel |  |  | libadwaita-gnome · partial |
| Store COSMIC | com.system76.CosmicStore | P2 | — | 🔷 decorative |  | ✓ | — |
| System Monitor | org.gnome.SystemMonitor | P2 | — | 🔷 decorative |  | ✓ | — |
| Table de caractères | gucharmap | P2 | — | 🔷 decorative |  | ✓ | — |
| Terminal | com.system76.CosmicTerm | P0 | terminal | ✅ ok | ✓ | ✓ | cosmic · full |
| transmission | transmission | P1 | transmission | 🔶 partiel |  |  | libadwaita-gnome · partial |
| visionneur_images | visionneur_images | P1 | visionneur_images | ✅ ok |  |  | libadwaita-gnome · partial |
| visionneur_pdf | visionneur_pdf | P1 | visionneur_pdf | ✅ ok |  |  | libadwaita-gnome · partial |
| warpinator | warpinator | P1 | warpinator | 🔶 partiel |  |  | libadwaita-gnome · partial |

## CapsuleOnly / hors VM

- ✅ **À propos Pop!_OS** — ok (CapsuleOnly)
- ✅ **Agenda** — ok
- ✅ **Capture d'écran** — ok (CapsuleOnly)
- ✅ **Dessin** — ok (Extension magasin — linux-popos)
- ✅ **Gestionnaire d'archives** — ok (Extension magasin — linux-popos)
- ✅ **Lecteur vidéo** — ok (Extension magasin — linux-popos)
- ✅ **LibreOffice** — ok (Extension magasin — linux-popos)
- 🎓 **Missions CapsuleOS** — capsuleOnly (CapsuleOnly)
- ✅ **Numérisation** — ok (Extension magasin — linux-popos)
- 🔶 **rhythmbox** — partiel
- 🔶 **thunderbird** — partiel
- 🔶 **timeshift** — partiel
- ✅ **Transmission** — ok (Extension magasin — linux-popos)
- ✅ **Warpinator** — ok (Extension magasin — linux-popos)

