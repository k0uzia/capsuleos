# Clôture Discover — KDE neon User Edition

> **Statut** : 🔄 réouvert (2026-06-11) — sidebar icônes Breeze VM · clôture initiale 2026-06-06 · Registre `linux-kde-neon`  
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

Captures VM par onglet : **réalisées** (G6 + fiche VLC). Reste la passe **fiches Installé(s) en détail** (Wayland : nécessite `wtype` sur la VM lab).

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
| Captures VM fiches Installé(s) | P1 | Bloqué tant que `wtype` absent sur la VM lab (Wayland) |
| Tokens CSS `--opensuse-*` hérités | P2 | Renommage `--kde-neon-*` |

## Prochaine étape skin (post-Discover)

1. **Kickoff** — favoris VM, dimensions popup (phase B checklist)
2. **Dolphin** (`nemo`) — explorateur P0 apps panel
3. Passage `status: active` dans `etc/capsuleos/profiles/linux-kde-neon.json` après parité bureau P0 complète
