# Catalogue applications — linux-alma

> Généré : `2026-06-10T11:15:00.654Z` · Toolkit : **gnome** · Procédure : [procedure-apps-catalog.md](../procedure-apps-catalog.md)

```bash
node usr/lib/capsuleos/tools/lab/collect-vm-apps-inventory.mjs --id linux-alma --write
node usr/lib/capsuleos/tools/lab/generate-apps-catalog.mjs --id linux-alma --write
node usr/lib/capsuleos/tools/lab/smoke-apps-catalog.mjs --id linux-alma
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
| Calculatrice | org.gnome.Calculator | P0 | calculator | ✅ ok | ✓ | ✓ | libadwaita-gnome · full |
| Caractères | org.gnome.Characters | P2 | characters | ✅ ok |  | ✓ | libadwaita-gnome · partial |
| Disques | org.gnome.DiskUtility | P2 | — | 🔷 decorative |  | ✓ | — |
| Éditeur de texte | org.gnome.TextEditor | P0 | text_editor | ✅ ok | ✓ | ✓ | libadwaita-gnome · full |
| Fichiers | org.gnome.Nautilus | P0 | nemo | ✅ ok | ✓ | ✓ | nemo-gnome · full |
| Firefox | firefox | P0 | firefox | ✅ ok | ✓ | ✓ | firefox-gnome · partial |
| Horloges | org.gnome.clocks | P1 | clocks | ✅ ok |  | ✓ | libadwaita-gnome · partial |
| Journal SELinux | setroubleshoot | P2 | — | 🔷 decorative |  | ✓ | — |
| Logiciels | org.gnome.Software | P0 | update_manager | ✅ ok | ✓ | ✓ | libadwaita-gnome · partial |
| Loupe | org.gnome.Loupe | P1 | visionneur_images | ✅ ok |  | ✓ | libadwaita-gnome · partial |
| Moniteur système | org.gnome.SystemMonitor | P2 | system_monitor | ✅ ok |  | ✓ | libadwaita-gnome · partial |
| Papers | org.gnome.Papers | P1 | visionneur_pdf | ✅ ok |  | ✓ | libadwaita-gnome · partial |
| Paramètres | org.gnome.Settings | P0 | themes | ✅ ok |  | ✓ | libadwaita-gnome · full |
| Polices | org.gnome.font-viewer | P2 | — | 🔷 decorative |  | ✓ | — |
| Snapshot | org.gnome.Snapshot | P1 | snapshot | ✅ ok |  | ✓ | libadwaita-gnome · partial |
| Terminal | org.gnome.Ptyxis | P0 | terminal | ✅ ok | ✓ | ✓ | terminal-gnome · full |
| Utilisation des disques | org.gnome.baobab | P2 | baobab | ✅ ok |  | ✓ | libadwaita-gnome · partial |
| Visite guidée | org.gnome.Tour | P2 | tour | ✅ ok |  | ✓ | libadwaita-gnome · partial |

## CapsuleOnly / hors VM

- ✅ **À propos AlmaLinux** — ok (CapsuleOnly)
- ✅ **Capture d'écran** — ok (CapsuleOnly)
- 🎓 **Missions CapsuleOS** — capsuleOnly (CapsuleOnly)

