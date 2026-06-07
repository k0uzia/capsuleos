# Passe comparaison visuelle — Rocky Linux (VM ↔ CapsuleOS)

Généré : 2026-06-07T09:51:54.939Z

Référence slots : [`linux-gnome-capsule-slots.md`](linux-gnome-capsule-slots.md) (Nautilus ≠ Nemo).

## Assets PNG

| Scène | VM | octets | Capsule | octets | Contexte |
|-------|-----|--------|---------|--------|----------|
| Bureau sombre | ✓ | 82243 | ✓ | 175875 | GNOME Shell + dock ; thème VM default → Capsule sombre |
| Bureau sombre (Firefox ouvert) | ✓ | 82204 | ✓ | 82047 | Parité contexte : fenêtre Navigator ouverte sur le bureau |
| Fichiers sombre (Nautilus VM / slot nemo Capsule) | ✓ | 82204 | ✓ | 130176 | VM : org.gnome.Nautilus · Capsule : gabarit nemo, titre « Fichiers » |
| Firefox sombre | ✓ | 82204 | ✓ | 82695 | Navigator.firefox · slot firefox |
| Terminal sombre (Ptyxis VM / slot terminal Capsule) | ✓ | 80600 | ✓ | 134517 | VM : Ptyxis · Capsule : chrome terminal profil linux:redhat |
| Bureau clair | ✓ | 77181 | ✓ | 177080 | color-scheme prefer-light ↔ data-theme=light |
| Fichiers clair | ✓ | 81815 | ✓ | 129915 | Nautilus VM · nemo Capsule, thème clair |
| Firefox clair | ✓ | 77649 | ✓ | 82550 | Firefox · firefox |
| Aperçu bureau (workspace) | ✓ | 491362 | ✓ | 215458 | GNOME Shell Overview · dash + carte bureau |
| Aperçu bureau (vignettes + peek) | ✓ | 491362 | ✓ | 105037 | Capsule : Firefox + vignette + peek workspace-next · VM : overview structurel (audit sans fenêtres) |
| Grille applications Aperçu | ✓ | 492421 | ✓ | 136742 | Overview mode apps · grille RL10 alignée |
| Quick Settings | ✓ | 201704 | ✓ | 185342 | Tray cluster · volume-popover |
| Loupe (Papers VM = Papers RL10) | ✓ | 190561 | ✓ | 118696 | VM : référence fenêtre ouverte · Capsule : slot visionneur_images |
| Papers (PDF RL10) | ✓ | 190561 | ✓ | 118597 | VM : pas de capture Papers dédiée · Capsule : slot visionneur_pdf |

## Assets PNG — Capsule seul (Paramètres GNOME)

| Scène | Capsule | octets | Contexte |
|-------|---------|--------|----------|
| Paramètres — Apparence (sombre) | ✓ | 150918 | Slot `themes` · panneau `appearance` · schéma clair/sombre fonctionnel |
| Paramètres — Écrans (sombre) | ✓ | 143220 | Slot `themes` · panneau `displays` · doc SUSE §3.9 |
| Paramètres — Apparence (clair) | ✓ | 151490 | Slot `themes` · thème clair Capsule · tokens `--gnome-settings-*` |

## Checklist panel (état logique)

Export Capsule : `run-capsule-panel-browser.mjs` OK.

> Checklist VM ignorée — lab Rocky injoignable (SSH). Relancer quand la VM est up.

## Rappels fidélité visuelle (GNOME)

- **Fichiers** : ne pas appeler l’app VM « Nemo » — c’est **Nautilus** ; le slot **`nemo`** est l’identifiant gabarit CapsuleOS partagé.
- **Terminal** : VM **Ptyxis** ; Capsule **`terminal`** (invite `capsule@rocky` / profil Red Hat).
- **Dock** : favoris VM (8 icônes GNOME) vs dock Capsule (6 + accueil, modèle Fedora) — écart P1 documenté.
- **Thèmes** : `gsettings color-scheme` `default`/`prefer-light` ↔ `data-theme` dark/light + `gnome-theme` localStorage.

## Lecture visuelle (passe manuelle)

| Zone | VM (ground truth) | CapsuleOS | Verdict / action |
|------|-------------------|-----------|----------------|
| Barre supérieure + horloge | GNOME 47, `6 juin 00:33` (ligne) | `fedora-top-bar__center` absolu + `date.js` | Comparer `rocky-*-desktop.png` |
| Dock | 8 favoris GNOME natifs | 6 apps + accueil (modèle Fedora) | P1 — ne pas dupliquer Software/Calculator sans spec |
| **Fichiers** | **Nautilus** Adwaita, sidebar Places | Gabarit **`nemo`**, titre **Fichiers** | Tokens `nautilus.skin.css` / largeur fenêtre |
| Firefox | Navigator + barre RMZ | Slot `firefox` embed | Barre d’adresse / onglets |
| Terminal | **Ptyxis** | Slot **`terminal`**, profil `linux:redhat` | Prompt `capsule@rocky`, couleurs Ptyxis |
| Thème clair | `prefer-light` | `data-theme=light` + `html:has(#rocky)` | `tokens.css` section clair |

Tailles PNG distinctes sur cette passe VM = fenêtres réellement différentes (écran réveillé).
