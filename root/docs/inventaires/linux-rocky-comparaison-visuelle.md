# Passe comparaison visuelle — Rocky Linux (VM ↔ CapsuleOS)

Généré : 2026-06-07T10:10:27.776Z

Référence slots : [`linux-gnome-capsule-slots.md`](linux-gnome-capsule-slots.md) (Nautilus ≠ Nemo).

## Assets PNG

| Scène | VM | octets | Capsule | octets | Contexte |
|-------|-----|--------|---------|--------|----------|
| Bureau sombre | ✓ | 146865 | ✓ | 176266 | GNOME Shell + dock ; thème VM default → Capsule sombre |
| Bureau sombre (Firefox ouvert) | ✓ | 108847 | ✓ | 82419 | Parité contexte : fenêtre Navigator ouverte sur le bureau |
| Fichiers sombre (Nautilus VM / slot nemo Capsule) | ✓ | 108847 | ✓ | 130479 | VM : org.gnome.Nautilus · Capsule : gabarit nemo, titre « Fichiers » |
| Firefox sombre | ✓ | 108847 | ✓ | 83046 | Navigator.firefox · slot firefox |
| Terminal sombre (Ptyxis VM / slot terminal Capsule) | ✓ | 109277 | ✓ | 134873 | VM : Ptyxis · Capsule : chrome terminal profil linux:redhat |
| Bureau clair | ✓ | 107032 | ✓ | 177231 | color-scheme prefer-light ↔ data-theme=light |
| Fichiers clair | ✓ | 108211 | ✓ | 129977 | Nautilus VM · nemo Capsule, thème clair |
| Firefox clair | ✓ | 107032 | ✓ | 82683 | Firefox · firefox |
| Aperçu bureau (workspace) | ✓ | 491362 | ✓ | 213655 | GNOME Shell Overview · dash + carte bureau |
| Aperçu bureau (vignettes + peek) | ✓ | 491362 | ✓ | 108225 | Capsule : Firefox + vignette + peek workspace-next · VM : overview structurel (audit sans fenêtres) |
| Grille applications Aperçu | ✓ | 492421 | ✓ | 140055 | Overview mode apps · grille RL10 alignée |
| Quick Settings | ✓ | 201704 | ✓ | 185710 | Tray cluster · volume-popover |
| Loupe (Papers VM = Papers RL10) | ✓ | 190561 | ✓ | 118870 | VM : référence fenêtre ouverte · Capsule : slot visionneur_images |
| Papers (PDF RL10) | ✓ | 190561 | ✓ | 118771 | VM : pas de capture Papers dédiée · Capsule : slot visionneur_pdf |

## Assets PNG — Capsule seul (Paramètres GNOME)

| Scène | Capsule | octets | Contexte |
|-------|---------|--------|----------|
| Paramètres — Apparence (sombre) | ✓ | 151097 | Slot `themes` · panneau `appearance` · schéma clair/sombre fonctionnel |
| Paramètres — Écrans (sombre) | ✓ | 143384 | Slot `themes` · panneau `displays` · doc SUSE §3.9 |
| Paramètres — Apparence (clair) | ✓ | 151632 | Slot `themes` · thème clair Capsule · tokens `--gnome-settings-*` |

## Checklist panel (état logique)

Export Capsule : `run-capsule-panel-browser.mjs` OK.

```
# Checklist panel — linux-rocky

| Étape | VM | Capsule | Note |
|-------|-----|---------|------|
| 0 Fichiers (Nautilus · slot nemo) seul, focus | ÉCART | OK | {"nemo":{"running":true,"active":false},"firefox":{"running":false,"active":false},"terminal":{"running":false,"active":false}} |
| 1 + Firefox, focus Firefox | ÉCART | OK | {"nemo":{"running":false,"active":false},"firefox":{"running":true,"active":false},"terminal":{"running":false,"active":false}} |
| 2 + Terminal (Ptyxis · slot terminal), focus | ÉCART | OK | {"nemo":{"running":false,"active":false},"firefox":{"running":true,"active":false},"terminal":{"running":false,"active":false}} |
| 3 Focus Fichiers (Nautilus · slot nemo) via lanceur | ÉCART | OK | {"nemo":{"running":false,"active":false},"firefox":{"running":true,"active":false},"terminal":{"running":false,"active":false}} |
| 4 Minimize Fichiers (Nautilus · slot nemo) | ÉCART | OK | P1 VM : running peut rester true |
| 5 Sidebar Fichiers (Nautilus · slot nemo) → Documents | ÉCART | OK | {"nemo":{"running":false,"active":false},"firefox":{"running":true,"active":false},"terminal":{"running":false,"active":false}} |
```

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
