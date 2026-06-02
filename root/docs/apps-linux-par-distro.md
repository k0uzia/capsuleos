# Applications Linux par distribution — référence CapsuleOS

Document de référence pour l’émulation des applications par défaut sur les huit bureaux Linux simulés.  
Les identifiants **`data-link`** / **`data-overview-link`** / **`data-cosmic-app-link`** sont la source de vérité côté code ; ce fichier décrit l’intention produit et les écarts restants.

Voir aussi la [roadmap](roadmap.md) pour le plan de livraison par phases, et [LINUX-GUI-TOOLKITS.md](../../LINUX-GUI-TOOLKITS.md) pour GTK/Qt, tokens shell, fichiers `*.skin.css` et checklist agents UX.

## Socle partagé (`usr/share/capsuleos/linux/apps/`)

| ID CapsuleOS | Rôle simulé | Gabarit |
|---|---|---|
| `nemo` | Explorateur (Nemo / Dolphin / Nautilus) | `CAPSULE_EXPLORER_TEMPLATE` |
| `firefox` | Navigateur Web | `firefox.html` |
| `terminal` | Terminal / Konsole / Console | `terminal.html` |
| `themes` | Paramètres système / apparence | `themes.html` |
| `update_manager` | Logithèque / Software / Discover / Pop!_Shop | `update_manager*.html` |
| `text_editor` | Éditeur de texte simple (GNOME / COSMIC / xed / Kate) | `text_editor.html` |
| `librewriter` | LibreOffice Writer | `librewriter.html` |
| `visionneur_images` | Visionneuse d’images | `visionneur_images.html` |
| `visionneur_pdf` | Visionneuse PDF | `visionneur_pdf.html` |
| `lecteur_multimedia` | Lecteur vidéo / audio | `lecteur_multimedia.html` |
| `mainMenu` | Menu applications | `mainMenu.html` / `mainMenu-gnome.html` |
| `profile` | À propos de la distro | `profile.html` |
| `checklist` | Missions pédagogiques CapsuleOS (hors OS réel) | `checklist.html` |

Variantes `update_manager` :

- **Mint / défaut** : `update_manager.html`
- **Ubuntu / GNOME Software** : `update_manager_ubuntu.html` (`CAPSULE_TEMPLATE_OVERRIDES`)
- **KDE Discover** : `update_manager_kde.html` (openSUSE, MX-KDE, Debian-KDE)

---

## Mappings corrigés (2026-06)

| Skin | Élément UI | Avant (erroné) | Après (correct) |
|---|---|---|---|
| **Fedora** | Dash — Logiciels | `themes` | `update_manager` |
| **Fedora** | Dash — Éditeur de texte | `librewriter` | `text_editor` |
| **Fedora** | Dash — Calendrier | `checklist` | décoratif (pas de lien) |
| **Pop!_OS** | Dock — Éditeur de texte | `checklist` | `text_editor` |
| **Pop!_OS** | Grille — Paramètres COSMIC | `profile` | `themes` |
| **Pop!_OS** | Grille — Store COSMIC | `themes` | `update_manager` |
| **Pop!_OS** | Grille — Éditeur de texte COSMIC | `checklist` | `text_editor` |
| **Debian-KDE** | Menu favori Discover | `checklist` | `update_manager` |
| **Debian-KDE** | Panel Discover | décoratif | `update_manager` |
| **AnduinOS** | Menu — Éditeur de texte | `null` | `text_editor` |

---

## Par distribution

### Linux Mint Cinnamon (`mint`)

| App réelle | ID CapsuleOS | Panel | Menu |
|---|---|---|---|
| Nemo | `nemo` | ✅ | ✅ |
| Firefox | `firefox` | ✅ | ✅ |
| Terminal | `terminal` | ✅ | ✅ |
| LibreOffice Writer | `librewriter` | ✅ | ✅ |
| Thèmes | `themes` | ✅ | ✅ |
| Gestionnaire de mises à jour | `update_manager` | tray | ✅ |
| Visionneur d’images | `visionneur_images` | 🔶 | ✅ |
| Visionneur PDF | `visionneur_pdf` | 🔶 | ✅ |
| Celluloid | `lecteur_multimedia` | 🔶 | ✅ |
| Éditeur de texte (xed) | `text_editor` | ⬜ | ⬜ |
| Logithèque | `update_manager` | ⬜ | ⬜ |
| Missions CapsuleOS | `checklist` | ✅ | — |

### Ubuntu 25.10 GNOME (`ubuntu`)

| App réelle | ID CapsuleOS | Dock | Overview |
|---|---|---|---|
| Firefox | `firefox` | ✅ | ⬜ |
| Fichiers | `nemo` | ✅ | ⬜ |
| Ubuntu Software | `update_manager` | ✅ | ⬜ |
| Terminal | `terminal` | ✅ | ⬜ |
| Paramètres | `themes` | 🔶 | ✅ |
| Éditeur de texte | `text_editor` | ⬜ | ⬜ |
| Missions | `checklist` | 🔶 | ⬜ |

### Fedora Workstation (`fedora`)

| App réelle | ID CapsuleOS | Dash | Dock |
|---|---|---|---|
| Firefox | `firefox` | ✅ | ✅ |
| Fichiers | `nemo` | ✅ | ✅ |
| GNOME Software | `update_manager` | ✅ | 🔶 |
| Éditeur de texte | `text_editor` | ✅ | 🔶 |
| Terminal | `terminal` | ✅ | ✅ |
| Paramètres | `themes` | overview | ✅ |
| LibreOffice Writer | `librewriter` | overview | ✅ |
| Calendrier | — | décoratif | — |
| Missions | `checklist` | — | ✅ |

### Pop!_OS COSMIC (`popos`)

| App réelle | ID CapsuleOS | Dock | Grille Apps |
|---|---|---|---|
| Firefox | `firefox` | ✅ | ✅ |
| Fichiers COSMIC | `nemo` | ✅ | ✅ |
| Éditeur de texte COSMIC | `text_editor` | ✅ | ✅ |
| Terminal COSMIC | `terminal` | ✅ | ✅ |
| Pop!_Shop | `update_manager` | ✅ | ✅ |
| Paramètres COSMIC | `themes` | ✅ | ✅ |
| Lecteur multimédia | `lecteur_multimedia` | 🔶 | ✅ |

### MX Linux KDE (`mxkde`)

| App réelle | ID CapsuleOS | Panel | Menu |
|---|---|---|---|
| Dolphin | `nemo` | ✅ | ✅ |
| Firefox | `firefox` | ✅ | ✅ |
| Konsole | `terminal` | ✅ | ✅ |
| Writer | `librewriter` | ✅ | ✅ |
| System Settings | `themes` | ✅ | ✅ |
| MX Tools / Missions | `checklist` | ✅ | ✅ |
| Discover / installateur | `update_manager` | ⬜ | ⬜ |

### Debian KDE (`debian-kde`)

| App réelle | ID CapsuleOS | Panel | Menu favoris |
|---|---|---|---|
| Dolphin | `nemo` | ✅ | ✅ |
| Firefox | `firefox` | ✅ | ✅ |
| Konsole | `terminal` | ✅ | ✅ |
| System Settings | `themes` | ✅ | ✅ |
| Discover | `update_manager` | ✅ | ✅ |
| Writer | `librewriter` | 🔶 | ✅ |
| Missions | `checklist` | 🔶 | ✅ (cat. Système) |

### openSUSE Tumbleweed (`opensuse`)

| App réelle | ID CapsuleOS | Panel | Menu |
|---|---|---|---|
| Dolphin | `nemo` | ✅ | ✅ |
| Firefox | `firefox` | ✅ | ✅ |
| Konsole | `terminal` | 🔶 | ✅ |
| Discover (tray) | `update_manager` | tray | 🔶 |
| Kate | `text_editor` | ⬜ | ⬜ (listé sans lien) |

### AnduinOS (`anduinos`)

| App réelle | ID CapsuleOS | Taskbar | Menu Démarrer |
|---|---|---|---|
| Firefox | `firefox` | ✅ | ✅ |
| Fichiers | `nemo` | ✅ | ✅ |
| Logiciels | `update_manager` | ✅ | ✅ |
| Éditeur de texte | `text_editor` | 🔶 | ✅ |
| Paramètres | `themes` | 🔶 | ✅ |
| Evince / Vidéos | `visionneur_pdf` / `lecteur_multimedia` | 🔶 | ✅ |
| Photos, Calculatrice, etc. | — | ⬜ | ⬜ |

---

## Légende

- **✅** branché et nommé correctement
- **🔶** slot moteur présent, pas épinglé au shell
- **⬜** listé décoratif ou absent — coquille ou app à créer

## Fichiers de configuration menu

| Skin | Fichier catalogue menu |
|---|---|
| Mint (défaut noyau) | `usr/lib/capsuleos/shells/linux/mainMenu-data.js` |
| MX-KDE | `home/Debian/MX-KDE/content/mainMenu-data.js` |
| Debian-KDE | `home/Debian/Debian-KDE/content/mainMenu-data.js` |
| openSUSE | `home/SUSE/openSUSE/content/mainMenu-data.js` |
| AnduinOS | `home/Debian/AnduinOS/content/mainMenu-data.js` (`ANDUIN_MENU_FAVORITES`) |
| Pop!_OS COSMIC | `home/Debian/PopOS/index.html` (grille `#cosmic-applications-grid`) |
| Fedora / Ubuntu | `index.html` (overview + dash / dock) |

## Prochaines extensions (priorité)

1. **`text_editor`** — skins GNOME / KDE / COSMIC / Cinnamon ; raccourcis Mint menu et Ubuntu overview
2. **`calculator`**, **`clocks`**, **`calendar`** — coquilles GNOME pour Fedora / Ubuntu / AnduinOS
3. **MX-KDE** — Discover → `update_manager_kde` (panel + menu)
4. **openSUSE** — Kate → `text_editor` ; Discover panel cliquable

## Build offline

Après modification d’un gabarit ou d’un skin :

```bash
node usr/lib/capsuleos/tools/generate-public-manifest.mjs
node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs
```
