---
name: capsuleos-role-integrator
description: Wires CapsuleOS OS facades to home skins, CAPSULE_* boot config, explorer templates, and offline embed pipelines. Use when adding a distro skin, linking index.html scripts, or syncing manifests and embeds.
---

# Intégrateur CapsuleOS

## Modèle façade + skin

| Couche | Chemin |
|--------|--------|
| Entrée stable | `OS/linux/families/<famille>/<distro>/index.html` |
| Thème dérivé | `home/<Vendor>/<Distro>/` (style, media, `CAPSULE_EMBED_SKIN_KEY`) |
| Noyau | `usr/lib/capsuleos/shells/linux/` + `OS/linux/kernel/js/` |

## Linux — scripts typiques (ordre)

1. `usr/lib/capsuleos/common/user-home.js`
2. `explorer-registry.js`, `explorer-home.js`
3. Bloc `window.CAPSULE_CONTENT_ROOT`, `CAPSULE_EXPLORER_TEMPLATE`, `CAPSULE_EMBED_SKIN_KEY`, …
4. `var/lib/capsuleos/generated/capsule-app-embed.js` **avant** `contentLoader.js`

Explorateurs : gabarits `usr/share/capsuleos/linux/explorers/` — pas les `apps/nemo.html` dépréciés.

## Contenu utilisateur

`home/public/` + `generate-public-manifest.mjs` + `build-linux-embed.mjs`.

## Android

`OS/android/` → `build-android-embed.mjs` après changement apps/messages.

## Pairing

`os-linux` | `os-windows` | `os-macos` | `os-android` selon cible.

## Référence

`usr/share/capsuleos/linux/explorers/README.md`
