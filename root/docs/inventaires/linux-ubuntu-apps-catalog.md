# Catalogue applications — linux-ubuntu

> Généré : `2026-06-08T21:04:56.719Z` · Toolkit : **gnome** · Procédure : [procedure-apps-catalog.md](../procedure-apps-catalog.md)

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
| Actualiseur de micrologiciel | firmware-updater | P2 | — | 🔷 decorative |  | ✓ | — |
| Aide Ubuntu | org.gnome.Yelp | P1 | — | 🔶 partiel | ✓ | ✓ | — |
| Calculatrice | org.gnome.Calculator | P0 | calculator | ✅ ok |  | ✓ | libadwaita-gnome · full |
| Centre de sécurité | desktop-security-center | P2 | — | 🔷 decorative |  | ✓ | — |
| Characters | org.gnome.Characters | P2 | — | 🔷 decorative |  | ✓ | — |
| Clocks | org.gnome.clocks | P2 | — | 🔷 decorative |  | ✓ | — |
| Disk Usage Analyzer | org.gnome.baobab | P2 | — | 🔷 decorative |  | ✓ | — |
| Disks | org.gnome.DiskUtility | P2 | — | 🔷 decorative |  | ✓ | — |
| Document Viewer | org.gnome.Papers | P2 | — | 🔷 decorative |  | ✓ | — |
| Éditeur de texte | org.gnome.TextEditor | P0 | text_editor | ✅ ok |  | ✓ | libadwaita-gnome · full |
| Evolution | org.gnome.Evolution | P1 | — | ⬜ absent | ✓ |  | Favori VM — slot à créer |
| Fichiers | org.gnome.Nautilus | P0 | nemo | ✅ ok | ✓ | ✓ | nemo-gnome · full |
| Firefox | firefox | P0 | firefox | ✅ ok | ✓ | ✓ | firefox-gnome · partial |
| Fonts | org.gnome.font-viewer | P2 | — | 🔷 decorative |  | ✓ | — |
| Image Viewer | org.gnome.Loupe | P2 | — | 🔷 decorative |  | ✓ | — |
| Language Support | gnome-language-selector | P2 | — | 🔷 decorative |  | ✓ | — |
| Logs | org.gnome.Logs | P2 | — | 🔷 decorative |  | ✓ | — |
| Paramètres | org.gnome.Settings | P0 | themes | ✅ ok |  | ✓ | libadwaita-gnome · full |
| Passwords and Keys | org.gnome.seahorse.Application | P2 | — | 🔷 decorative |  | ✓ | — |
| Resources | net.nokyan.Resources | P2 | — | 🔷 decorative |  | ✓ | — |
| Snap Store | snap-store | P0 | update_manager | ✅ ok | ✓ | ✓ | libadwaita-gnome · partial |
| Software Updater | update-manager | P2 | — | 🔷 decorative |  | ✓ | — |
| Sysprof | org.gnome.Sysprof | P2 | — | 🔷 decorative |  | ✓ | — |
| Terminal | org.gnome.Ptyxis | P0 | terminal | ✅ ok |  | ✓ | terminal-gnome · full |

## CapsuleOnly / hors VM

- ✅ **À propos Ubuntu** — ok (CapsuleOnly)
- ✅ **LibreOffice Writer** — ok (Flatpak/deb optionnel — absent VM lab ; simulé CapsuleOS)
- 🎓 **Missions CapsuleOS** — capsuleOnly (CapsuleOnly)
- ✅ **Rhythmbox** — ok (Référence Ubuntu retail — absent VM lab actuelle ; simulé CapsuleOS)

