# Catalogue applications — linux-ubuntu

> Généré : `2026-06-07T20:07:25.436Z` · Toolkit : **gnome** · Procédure : [procedure-apps-catalog.md](../procedure-apps-catalog.md)

```bash
node usr/lib/capsuleos/tools/lab/collect-vm-apps-inventory.mjs --id linux-ubuntu --write
node usr/lib/capsuleos/tools/lab/generate-apps-catalog.mjs --id linux-ubuntu --write
node usr/lib/capsuleos/tools/lab/smoke-apps-catalog.mjs --id linux-ubuntu
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
| Aide Ubuntu | org.gnome.Yelp | P1 | — | 🔶 partiel | ✓ | ✓ | — |
| Calculatrice | org.gnome.Calculator | P0 | calculator | ✅ ok |  | ✓ | libadwaita-gnome · full |
| Characters | org.gnome.Characters | P2 | — | 🔷 decorative |  | ✓ | — |
| Clocks | org.gnome.clocks | P2 | — | 🔷 decorative |  | ✓ | — |
| Disk Usage Analyzer | org.gnome.baobab | P2 | — | 🔷 decorative |  | ✓ | — |
| Disks | org.gnome.DiskUtility | P2 | — | 🔷 decorative |  | ✓ | — |
| Document Viewer | org.gnome.Papers | P2 | — | 🔷 decorative |  | ✓ | — |
| Éditeur de texte | org.gnome.TextEditor | P0 | text_editor | ✅ ok |  | ✓ | libadwaita-gnome · full |
| Events and Tasks Reminders | org.gnome.Evolution-alarm-notify | P2 | — | 🔷 decorative |  | ✓ | — |
| Evolution | org.gnome.Evolution | P1 | — | ⬜ absent | ✓ |  | Favori VM — slot à créer |
| Evolution Data Server OAuth2 Handler | org.gnome.evolution-data-server.OAuth2-handler | P2 | — | 🔷 decorative |  | ✓ | — |
| Extensions | org.gnome.Shell.Extensions | P2 | — | 🔷 decorative |  | ✓ | — |
| Fichiers | org.gnome.Nautilus | P0 | nemo | ✅ ok | ✓ | ✓ | nemo-gnome · full |
| Firefox | firefox | P0 | firefox | ✅ ok | ✓ |  | firefox-gnome · partial |
| Fonts | org.gnome.font-viewer | P2 | — | 🔷 decorative |  | ✓ | — |
| GNOME OAuth2 Handler | org.gnome.OnlineAccounts.OAuth2 | P2 | — | 🔷 decorative |  | ✓ | — |
| Image Viewer | org.gnome.Loupe | P2 | — | 🔷 decorative |  | ✓ | — |
| LibreOffice Writer | libreoffice-writer | P0 | librewriter | ✅ ok | ✓ |  | libadwaita-gnome · partial |
| Logs | org.gnome.Logs | P2 | — | 🔷 decorative |  | ✓ | — |
| Online Accounts | org.gnome.goa-daemon | P2 | — | 🔷 decorative |  | ✓ | — |
| Paramètres | org.gnome.Settings | P0 | themes | ✅ ok |  | ✓ | libadwaita-gnome · full |
| Passwords and Keys | org.gnome.seahorse.Application | P2 | — | 🔷 decorative |  | ✓ | — |
| Print Preview | org.gnome.Papers-previewer | P2 | — | 🔷 decorative |  | ✓ | — |
| Rhythmbox | org.gnome.Rhythmbox3 | P0 | lecteur_multimedia | ✅ ok | ✓ |  | libadwaita-gnome · decorative |
| Snap Store | snap-store | P0 | update_manager | ✅ ok | ✓ |  | libadwaita-gnome · partial |
| Sysprof | org.gnome.Sysprof | P2 | — | 🔷 decorative |  | ✓ | — |
| Tecla | org.gnome.Tecla | P2 | — | 🔷 decorative |  | ✓ | — |
| Terminal | org.gnome.Ptyxis | P0 | terminal | ✅ ok |  | ✓ | terminal-gnome · full |
| Zenity | org.gnome.Zenity | P2 | — | 🔷 decorative |  | ✓ | — |

## CapsuleOnly / hors VM

- ✅ **À propos Ubuntu** — ok (CapsuleOnly)
- 🎓 **Missions CapsuleOS** — capsuleOnly (CapsuleOnly)

