# Catalogue applications — linux-fedora

> Généré : `2026-06-17T14:21:26.752Z` · Toolkit : **gnome** · Procédure : [procedure-apps-catalog.md](../procedure-apps-catalog.md)

```bash
node usr/lib/capsuleos/tools/lab/collect-vm-apps-inventory.mjs --id linux-fedora --write
node usr/lib/capsuleos/tools/lab/generate-apps-catalog.mjs --id linux-fedora --write
node usr/lib/capsuleos/tools/lab/smoke-apps-catalog.mjs --id linux-fedora
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
| Agenda | org.gnome.Calendar | P1 | calendar | ✅ ok | ✓ | ✓ | libadwaita-gnome · partial |
| Aide | org.gnome.Yelp | P1 | — | 🔶 partiel |  | ✓ | — |
| Calculatrice | org.gnome.Calculator | P0 | calculator | ✅ ok | ✓ | ✓ | libadwaita-gnome · full |
| Caméra | org.gnome.Snapshot | P1 | snapshot | ✅ ok |  | ✓ | libadwaita-gnome · partial |
| Caractères | org.gnome.Characters | P2 | characters | ✅ ok |  | ✓ | libadwaita-gnome · partial |
| Cartes | org.gnome.Maps | P2 | — | 🔷 decorative |  | ✓ | — |
| Connexions | org.gnome.Connections | P2 | — | 🔷 decorative |  | ✓ | — |
| Contacts | org.gnome.Contacts | P2 | — | 🔷 decorative |  | ✓ | — |
| Contrôles parentaux | org.freedesktop.MalcontentControl | P2 | — | 🔷 decorative |  | ✓ | — |
| Disques | org.gnome.DiskUtility | P2 | — | 🔷 decorative |  | ✓ | — |
| Éditeur de texte | org.gnome.TextEditor | P0 | text_editor | ✅ ok | ✓ | ✓ | libadwaita-gnome · full |
| Fedora Media Writer | org.fedoraproject.MediaWriter | P2 | — | 🔷 decorative |  | ✓ | — |
| Fichiers | org.gnome.Nautilus | P0 | nemo | ✅ ok | ✓ | ✓ | nemo-gnome · full |
| Firefox | firefox | P0 | firefox | ✅ ok | ✓ | ✓ | firefox-gnome · partial |
| Horloges | org.gnome.clocks | P1 | clocks | ✅ ok |  | ✓ | libadwaita-gnome · partial |
| Journaux | org.gnome.Logs | P2 | — | 🔷 decorative |  | ✓ | — |
| Lecteur audio | org.gnome.Decibels | P2 | — | 🔷 decorative |  | ✓ | — |
| Lecteur vidéo | org.gnome.Showtime | P2 | — | 🔷 decorative |  | ✓ | — |
| LibreOffice Writer | libreoffice-writer | P2 | librewriter | 🔶 partiel |  | ✓ | libadwaita-gnome · full |
| Logiciels | org.gnome.Software | P0 | update_manager | ✅ ok | ✓ | ✓ | libadwaita-gnome · full |
| Loupe | org.gnome.Loupe | P1 | visionneur_images | ✅ ok |  | ✓ | libadwaita-gnome · partial |
| Machines | org.gnome.Boxes | P2 | — | 🔷 decorative |  | ✓ | — |
| Météo | org.gnome.Weather | P2 | — | 🔷 decorative |  | ✓ | — |
| Moniteur système | org.gnome.SystemMonitor | P2 | system_monitor | ✅ ok |  | ✓ | libadwaita-gnome · partial |
| Numériseur de documents | org.gnome.SimpleScan | P2 | — | 🔷 decorative |  | ✓ | — |
| Papers | org.gnome.Papers | P1 | visionneur_pdf | ✅ ok |  | ✓ | libadwaita-gnome · partial |
| Paramètres | org.gnome.Settings | P0 | themes | ✅ ok |  | ✓ | libadwaita-gnome · full |
| Polices | org.gnome.font-viewer | P2 | — | 🔷 decorative |  | ✓ | — |
| Terminal | org.gnome.Ptyxis | P0 | terminal | ✅ ok | ✓ | ✓ | terminal-gnome · full |
| Utilisation des disques | org.gnome.baobab | P2 | baobab | ✅ ok |  | ✓ | libadwaita-gnome · partial |
| Visite guidée | org.gnome.Tour | P2 | tour | ✅ ok |  | ✓ | libadwaita-gnome · partial |

## CapsuleOnly / hors VM

- ✅ **À propos Fedora** — ok (CapsuleOnly)
- ✅ **LibreOffice** — ok (Flatpak suite — déverrouille Writer/Calc/Impress/Draw (S6))
- ✅ **LibreOffice Calc** — ok (Module suite LO — épinglage post-install)
- ✅ **LibreOffice Draw** — ok (Module suite LO — épinglage post-install)
- ✅ **LibreOffice Impress** — ok (Module suite LO — épinglage post-install)
- 🎓 **Missions CapsuleOS** — capsuleOnly (CapsuleOnly)

