# Catalogue applications — linux-ubuntu

> Généré : `2026-06-17T14:20:01.149Z` · Toolkit : **gnome** · Procédure : [procedure-apps-catalog.md](../procedure-apps-catalog.md)

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
| Caractères | org.gnome.Characters | P2 | characters | ✅ ok |  | ✓ | libadwaita-gnome · partial |
| Centre d'applications | snap-store | P0 | update_manager | ✅ ok | ✓ | ✓ | libadwaita-gnome · full |
| Centre de sécurité | desktop-security-center | P2 | — | 🔷 decorative |  | ✓ | — |
| Disks | org.gnome.DiskUtility | P2 | — | 🔷 decorative |  | ✓ | — |
| Éditeur de texte | org.gnome.TextEditor | P0 | text_editor | ✅ ok |  | ✓ | libadwaita-gnome · full |
| Evolution | org.gnome.Evolution | P1 | — | ⬜ absent | ✓ |  | Favori VM — slot à créer |
| Fichiers | org.gnome.Nautilus | P0 | nemo | ✅ ok | ✓ | ✓ | nemo-gnome · full |
| Firefox | firefox | P0 | firefox | ✅ ok | ✓ | ✓ | firefox-gnome · partial |
| Fonts | org.gnome.font-viewer | P2 | — | 🔷 decorative |  | ✓ | — |
| Horloges | org.gnome.clocks | P1 | clocks | ✅ ok |  | ✓ | libadwaita-gnome · partial |
| Language Support | gnome-language-selector | P2 | — | 🔷 decorative |  | ✓ | — |
| Logs | org.gnome.Logs | P2 | — | 🔷 decorative |  | ✓ | — |
| Loupe | org.gnome.Loupe | P1 | visionneur_images | ✅ ok |  | ✓ | libadwaita-gnome · partial |
| Paramètres | org.gnome.Settings | P0 | themes | ✅ ok |  | ✓ | libadwaita-gnome · full |
| Passwords and Keys | org.gnome.seahorse.Application | P2 | — | 🔷 decorative |  | ✓ | — |
| Resources | net.nokyan.Resources | P2 | — | 🔷 decorative |  | ✓ | — |
| Software Updater | update-manager | P2 | — | 🔷 decorative |  | ✓ | — |
| Sysprof | org.gnome.Sysprof | P2 | — | 🔷 decorative |  | ✓ | — |
| Terminal | org.gnome.Ptyxis | P0 | terminal | ✅ ok |  | ✓ | terminal-gnome · full |
| Utilisation des disques | org.gnome.baobab | P2 | baobab | ✅ ok |  | ✓ | libadwaita-gnome · partial |
| Visionneur de documents | org.gnome.Papers | P1 | visionneur_pdf | ✅ ok |  | ✓ | libadwaita-gnome · partial |

## CapsuleOnly / hors VM

- ✅ **À propos Ubuntu** — ok (CapsuleOnly)
- ✅ **Agenda** — ok (Absent VM lab — slot GNOME mutualisé)
- ✅ **Gestionnaire d'archives** — ok (Absent VM lab — slot GNOME mutualisé)
- ✅ **LibreOffice Writer** — ok (Flatpak/deb optionnel — absent VM lab ; simulé CapsuleOS)
- 🎓 **Missions CapsuleOS** — capsuleOnly (CapsuleOnly)
- ✅ **Moniteur système** — ok (VM utilise net.nokyan.Resources — slot GNOME mutualisé)
- ✅ **Rhythmbox** — ok (Référence Ubuntu retail — absent VM lab actuelle ; simulé CapsuleOS)
- ✅ **Snapshot** — ok (Absent VM lab Ubuntu 26.04 — slot GNOME mutualisé)
- ✅ **Visite guidée** — ok (Absent VM lab Ubuntu 26.04 — slot GNOME mutualisé)

