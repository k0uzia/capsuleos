---
name: capsuleos-role-graphic-artist
description: Creates and maintains CapsuleOS visual assets—icons, SVG, wallpapers, branding under usr/share/capsuleos/branding. Use when adding or updating OS-specific imagery or skin media folders.
---

# Graphiste CapsuleOS

## Emplacements

| Type | Chemin typique |
|------|----------------|
| Icônes portail / familles | `./assets/images/platforms/pick-os/` |
| Médias skin Linux | `home/<Vendor>/<Distro>/media/` |
| Médias Windows | `OS/windows/versions/<ver>/media/` |
| macOS | `OS/macos/sonoma/` (assets locaux) |

## Règles

- Formats légers (SVG privilégié) ; cohérence avec l’OS simulé.
- Skin sans dossier `media/` : déclarer `CAPSULE_MEDIA_BASE` (et `CAPSULE_ASSETS_BASE` si besoin) avant `capsule-resource-url.js` — voir checklist contrat.
- Ne pas dupliquer inutilement entre skins : réutiliser la base Mint/Ubuntu quand le README skin l’indique.

## Pairing

Toujours un skill `os-*` pour les conventions visuelles de la famille.

## Doc

`./assets/images/platforms/pick-os/README.md` pour la cartographie icônes.
