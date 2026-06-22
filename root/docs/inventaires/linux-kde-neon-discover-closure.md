# Clôture Discover — KDE neon User Edition

> **Statut** : ✅ clôturé Capsule + VM session lab (2026-06-20) — baselines KdVp regénérées · sidebar Breeze pullée · `run-kde-neon-pass` 17/17 · VM pivot session exceptionnelle (IP via `lab-inventory.json` gitignoré) · clôture initiale 2026-06-06 · Registre `linux-kde-neon`  
> Parité globale skin : [`inventaire-parite-neon.md`](../inventaire-parite-neon.md)  
> Checklist réparation : [`linux-kde-neon-repair-checklist.md`](linux-kde-neon-repair-checklist.md)

Discover 6.6.5 (Plasma) est implémenté comme override du slot `update_manager`, avec navigation multi-vues, données VM et captures automatisées CapsuleOS.

## Fichiers source

| Rôle | Chemin |
|------|--------|
| Template HTML | `usr/share/capsuleos/linux/apps/update_manager_kde_neon.html` |
| CSS skin | `home/Debian/KDE-Neon/style/apps/update_manager.skin.css` |
| Logique JS | `home/Debian/KDE-Neon/js/discover-neon.js` |
| Catalogue (données) | `home/Debian/KDE-Neon/content/discover-catalog.json` |
| Icônes VM | `usr/share/capsuleos/assets/images/vendors/neon/discover/` (37 fichiers) |
| Override profil | `CAPSULE_TEMPLATE_OVERRIDES.update_manager` dans `skin.profile.json` |
| Captures Playwright | `root/tools/lab/capture-capsule-kde-neon.mjs` |

## Vues implémentées

| Onglet | Référence QML VM | Contenu CapsuleOS | Interactions |
|--------|------------------|-------------------|--------------|
| **Accueil** | HomePage | 2 sections × grille 2 col., 9 apps (VLC, GIMP, Wine, Steam, Kdenlive, KolourPaint, Kate, Krita, KPatience) | Navigation sidebar ✅ · recherche UI seulement |
| **Installé(s)** | InstalledPage | 14 apps triées (Ark → VLC), cartes Kirigami compactes 32 px | Navigation ✅ |
| **Mises à jour** | UpdatesPage | 1 MAJ `nano` 7.2-2ubuntu0.1 → 7.2-2ubuntu0.2, 836 Kio, badge sidebar « 1 » | « Tout mettre à jour » vide la liste + badge ✅ |
| **Configuration** | SourcesPage | Ubuntu (4 dépôts noble/neon), Flatpak (Flathub + Ajouter…), Snap Store | Affichage ✅ · toggles décoratifs |
| **À propos** | FormCard.AboutPage | v6.6.5, GPL, liens (don, contribuer, bogue), bibliothèques, auteurs | Affichage ✅ |

Catégories sidebar (Accessibilité, Bureautique, …) : présentes visuellement et **actives** (filtre accueil, parité VM via inventaire catégories).

## Captures CapsuleOS (ground truth visuel)

Répertoire : `home/public/Images/screen_KDE-Neon/`

| Fichier | Scène |
|---------|--------|
| `capsule-discover.png` | Accueil, maximisé |
| `capsule-discover-installed.png` / `-windowed.png` | Installé(s) |
| `capsule-discover-updates.png` / `-windowed.png` | Mises à jour |
| `capsule-discover-about.png` / `-windowed.png` | À propos |
| `capsule-discover-config.png` / `-windowed.png` | Configuration |

Regénération :

```bash
python3 -m http.server 5500   # depuis la racine du dépôt
node root/tools/lab/capture-capsule-kde-neon.mjs
```

## Captures VM (référence)

| Fichier | Scène | Note |
|---------|--------|------|
| `vm-discover.png` | Discover ouvert (accueil) | virsh screenshot |
| `vm-discover-installed.png` | Installé(s) (liste) | capture stable (recette G6 / recursive) |
| `vm-discover-installed-detail-*.png` | Fiches Installé(s) (14 apps) | `--discover-installed-details` · ouverture `plasma-discover --application <componentId>` · saisie virsh/QEMU ou ydotool (sans `wtype`) |

Captures VM par onglet : **réalisées** (G6 + fiche VLC catalogue + fiches Installé(s)).

## Gates (2026-06-20 — VM session lab exceptionnelle)

```bash
export KDE_NEON_SSH=capsule@<ip-lab>   # etc/capsuleos/lab-inventory.json (gitignoré)
python3 -m http.server 5500
node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --id linux-kde-neon --write-baseline --compare
bash root/tools/lab/vm-kde-neon-capture-host.sh --discover-vm-100
bash root/tools/lab/vm-kde-neon-capture-host.sh --discover-installed-details   # Kde_NEON_SUDO_PASSWORD si ydotool
node usr/lib/capsuleos/tools/lab/smoke-discover-vm-parity.mjs
CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/run-kde-neon-pass.mjs --write   # passOk 17/17
```

## Gates (2026-06-19)

```bash
python3 -m http.server 5500
CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/run-kde-neon-pass.mjs --skip-runtime   # OK
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-discover.mjs                                                  # OK
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs                                                # OK
node usr/lib/capsuleos/tools/validate-all.mjs                                                                 # OK
```

## Gates (2026-06-06)

```bash
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs   # OK
node usr/lib/capsuleos/tools/validate-all.mjs                    # OK
node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs         # après edits template/catalogue
```

## Écarts assumés (hors clôture Discover)

| Écart | Priorité | Note |
|-------|----------|------|
| Recherche Discover | ✅ | Filtre accueil + installé (juin 2026) |
| Captures VM fiches Installé(s) | ✅ | Contournement Wayland : `systemd-run plasma-discover --application …` + virsh send-key / ydotool · `smoke-discover-vm-parity` (14 paires) |
| Tokens CSS `--opensuse-*` hérités | ✅ | Renommé `--kde-neon-*` (`debian-desktop.css`, `footer.css`) |

## Prochaine étape skin (post-Discover)

1. **P2 polish** — Firefox nouvel onglet (raccourcis VM Google), tray popovers contenu détaillé
2. **Kickoff / Dolphin / Panel** — clôturés (voir docs dédiées) · profil `status: active`
