# Catalogue applications — linux-kde-neon

> Généré : `2026-06-13T21:06:00.981Z` · Toolkit : **kde** · Procédure : [procedure-apps-catalog.md](../procedure-apps-catalog.md)

```bash
node usr/lib/capsuleos/tools/lab/collect-vm-apps-inventory.mjs --id linux-kde-neon --write
node usr/lib/capsuleos/tools/lab/generate-apps-catalog.mjs --id linux-kde-neon --write
node usr/lib/capsuleos/tools/lab/smoke-apps-catalog.mjs --id linux-kde-neon
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
| Afficheur de processus plantés | org.kde.drkonqi.coredump.gui | P2 | — | 🔷 decorative |  | ✓ | — |
| Anthy Dictionary editor | kasumi | P2 | — | 🔷 decorative |  | ✓ | — |
| Ark | org.kde.ark | P2 | — | 🔷 decorative |  | ✓ | — |
| Centre d'accueil | org.kde.plasma-welcome | P2 | — | 🔷 decorative |  | ✓ | — |
| Centre d'aide | org.kde.khelpcenter | P2 | — | 🔷 decorative |  | ✓ | — |
| Centre d'informations | org.kde.kinfocenter | P2 | — | 🔷 decorative |  | ✓ | — |
| Configuration du système | systemsettings | P0 | themes | ✅ ok |  |  | default · partial |
| Console de retours des utilisateurs | org.kde.kuserfeedback-console | P2 | — | 🔷 decorative |  | ✓ | — |
| Discover | org.kde.discover | P0 | update_manager | ✅ ok |  |  | default · partial |
| Dolphin | org.kde.dolphin | P0 | nemo | ✅ ok |  |  | default · full |
| Éditeur de menus | org.kde.kmenuedit | P2 | — | 🔷 decorative |  | ✓ | — |
| Firefox | firefox | P0 | firefox | ✅ ok |  |  | default · partial |
| Gestionnaire de partitions de KDE | org.kde.partitionmanager | P2 | — | 🔷 decorative |  | ✓ | — |
| Gwenview | org.kde.gwenview | P2 | — | 🔷 decorative |  | ✓ | — |
| Informations système | kinfocenter | P1 | kinfocenter | ✅ ok |  |  | default · partial |
| Kate | org.kde.kate | P0 | text_editor | ✅ ok |  |  | default · partial |
| KDEConnect | org.kde.kdeconnect.app | P2 | — | 🔷 decorative |  | ✓ | — |
| KeepSecret | org.kde.keepsecret | P2 | — | 🔷 decorative |  | ✓ | — |
| Konsole | org.kde.konsole | P0 | terminal | ✅ ok |  |  | default · full |
| KWalletManager | org.kde.kwalletmanager | P2 | — | 🔷 decorative |  | ✓ | — |
| Lecteur vidéo | vlc | P0 | lecteur_multimedia | ✅ ok |  |  | default · partial |
| LibreOffice Writer | libreoffice-writer | P1 | librewriter | ✅ ok |  |  | default · full |
| Moniteur système | system_monitor | P1 | system_monitor | ✅ ok |  |  | default · partial |
| Okular | org.kde.okular | P2 | — | 🔷 decorative |  | ✓ | — |
| Sélecteur d'émoticônes | org.kde.plasma.emojier | P2 | — | 🔷 decorative |  | ✓ | — |
| SMS par KDEConnect | org.kde.kdeconnect.sms | P2 | — | 🔷 decorative |  | ✓ | — |
| Spectacle | org.kde.spectacle | P2 | — | 🔷 decorative |  | ✓ | — |
| Spectacle | spectacle | P1 | spectacle | ✅ ok |  |  | default · partial |
| Surveillance du système | org.kde.plasma-systemmonitor | P2 | — | 🔷 decorative |  | ✓ | — |
| visionneur_images | visionneur_images | P1 | visionneur_images | 🔶 partiel |  |  | default · partial |
| visionneur_pdf | visionneur_pdf | P1 | visionneur_pdf | 🔶 partiel |  |  | default · partial |

## CapsuleOnly / hors VM

- ✅ **À propos KDE neon User Edition** — ok (CapsuleOnly)
- 🎓 **Missions CapsuleOS** — capsuleOnly (CapsuleOnly)

