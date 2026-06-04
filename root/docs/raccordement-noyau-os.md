# Raccordement des OS au noyau CapsuleOS

## Vue d’ensemble

| Famille | Entrée HTML | JS noyau | Thèmes / tokens CSS | Assets images |
|---------|-------------|----------|---------------------|---------------|
| **Linux** (8 skins) | `home/…/index.html` ou façade `OS/linux/families/…` + `<base href>` → skin | `usr/lib/capsuleos/shells/linux/*`, `common/capsule-window.js` | `home/…/style/imports.css` → `usr/share/capsuleos/themes/linux/` + apps `Dossier personnel.base.css` | `./assets/…` + `capsule-resource.js` |
| **Windows** (11 versions) | `OS/windows/versions/<ver>/index.html` | `OS/windows/kernel/js/*`, `common/capsule-window.js` | `versions/<ver>/style/imports.css` → `themes/global` + `kernel/style/` | chemins physiques `usr/share/capsuleos/assets/…` |
| **Android** | `OS/android/index.html` | `OS/android/js/*` | `OS/android/style/` (local) | physiques |
| **iOS** | `OS/ios/15/index.html` | `OS/ios/15/js/*` | `OS/ios/15/style/` | physiques |
| **macOS Sonoma** | `OS/macos/sonoma/index.html` | scripts locaux + fenêtres | `OS/macos/sonoma/style/` | physiques |

Registre canonique : `etc/capsuleos/os-registry.json` · génération portail : `build-pick-os.mjs`.

## Linux — double URL (façade + skin)

- Le portail ouvre la **façade** (`OS/linux/families/…/index.html`).
- `<base href="../../../../../home/…/Skin/">` réécrit les liens vers le **skin** sous `home/`.
- Scripts noyau : `../../../usr/lib/capsuleos/shells/linux/…` (résolus via la base → racine du dépôt).
- Boot assets : `capsule-assets-manifest.js` → `capsule-resource.js` → `capsule-skin-boot.js`.

## Windows — noyau `OS/windows/kernel/`

- Pas de `<base>` : chemins relatifs depuis `versions/<ver>/`.
- `@import` dans `style/imports.css` : **5×** `../` jusqu’à la racine, puis `usr/share/capsuleos/themes/…` (profondeur `versions/<ver>/style/`).
- Kernel chrome : `../../../kernel/style/` → `OS/windows/kernel/style/`.

## Piège corrigé (juin 2026)

Les `@import` vers `usr/share/capsuleos/themes/` utilisaient souvent **4×** `../` alors que le fichier CSS est à **5 ou 6 niveaux** de profondeur → `reset.css` / `variables-linux.css` introuvables, page sans mise en forme.

Gate : `node usr/lib/capsuleos/tools/fix-theme-import-depths.mjs` puis `validate-css-asset-urls.mjs`.
