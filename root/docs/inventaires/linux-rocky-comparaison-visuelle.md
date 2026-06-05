# Passe comparaison visuelle — Rocky Linux (VM ↔ CapsuleOS)

Généré : 2026-06-05T22:05:12.697Z

Référence slots : [`linux-gnome-capsule-slots.md`](linux-gnome-capsule-slots.md) (Nautilus ≠ Nemo).

## Assets PNG

| Scène | VM | octets | Capsule | octets | Contexte |
|-------|-----|--------|---------|--------|----------|
| Bureau sombre | ✓ | 82243 | ✓ | 417169 | GNOME Shell + dock ; thème VM default → Capsule sombre |
| Fichiers sombre (Nautilus VM / slot nemo Capsule) | ✓ | 82204 | ✓ | 237643 | VM : org.gnome.Nautilus · Capsule : gabarit nemo, titre « Fichiers » |
| Firefox sombre | ✓ | 82204 | ✓ | 141574 | Navigator.firefox · slot firefox |
| Terminal sombre (Ptyxis VM / slot terminal Capsule) | ✓ | 80600 | ✓ | 293117 | VM : Ptyxis · Capsule : chrome terminal profil linux:redhat |
| Bureau clair | ✓ | 77181 | ✓ | 846226 | color-scheme prefer-light ↔ data-theme=light |
| Fichiers clair | ✓ | 81815 | ✓ | 418503 | Nautilus VM · nemo Capsule, thème clair |
| Firefox clair | ✓ | 77649 | ✓ | 209346 | Firefox · firefox |

## Checklist panel (état logique)

Export Capsule : `run-capsule-panel-browser.mjs` OK.

```
# Checklist panel — linux-rocky

| Étape | VM | Capsule | Note |
|-------|-----|---------|------|
| 0 Fichiers (Nautilus · slot nemo) seul, focus | ÉCART | OK | {"nemo":{"running":true,"active":false},"firefox":{"running":false,"active":false},"terminal":{"running":false,"active":false}} |
| 1 + Firefox, focus Firefox | ÉCART | OK | {"nemo":{"running":false,"active":false},"firefox":{"running":true,"active":true},"terminal":{"running":false,"active":false}} |
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
| Barre supérieure + horloge | GNOME 47, date longue | `fedora-top-bar` / `rocky-clock-date` | Comparer `rocky-*-desktop.png` |
| Dock | 8 favoris GNOME natifs | 6 apps + accueil (modèle Fedora) | P1 — ne pas dupliquer Software/Calculator sans spec |
| **Fichiers** | **Nautilus** Adwaita, sidebar Places | Gabarit **`nemo`**, titre **Fichiers** | Tokens `nautilus.skin.css` / largeur fenêtre |
| Firefox | Navigator + barre RMZ | Slot `firefox` embed | Barre d’adresse / onglets |
| Terminal | **Ptyxis** | Slot **`terminal`**, profil `linux:redhat` | Prompt `capsule@rocky`, couleurs Ptyxis |
| Thème clair | `prefer-light` | `data-theme=light` + `html:has(#rocky)` | `tokens.css` section clair |

Tailles PNG distinctes sur cette passe VM = fenêtres réellement différentes (écran réveillé).
