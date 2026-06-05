# Smoke — intégrité des liens (22 OS + hubs)

Gate automatisé :

```bash
node usr/lib/capsuleos/tools/validate-links-all.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
```

Détail : `validate-static-html-assets.mjs`, `validate-link-integrity.mjs`, `audit-data-links.mjs`, `validate-css-asset-urls.mjs`.  
Correction HTML statique : `fix-static-html-asset-urls.mjs` (voir [routage-donnees-medias.md](routage-donnees-medias.md)).

Si les icônes CSS sont cassées après migration : `node usr/lib/capsuleos/tools/rewrite-css-asset-urls.mjs` puis `normalize-css-kernel-urls.mjs`.

## Hubs portail

| Page | Vérifier |
|------|----------|
| `index.html` | Logo, cartes OS, modal pick-os → façade |
| `home/Debian/index.html` | 8 icônes `pick-os/linux/`, liens skins |
| `OS/windows/index.html` | 11 versions, icônes `pick-os/windows/` |
| `OS/linux/index.html` | Redirection hub Debian |

## Linux (8)

Pour chaque entrée via pick-os ou hub : logo, panel, explorateur (`nemo`), Firefox, retour accueil.

| Skin | Façade pick-os |
|------|----------------|
| Mint | `OS/linux/families/debian/mint/` |
| Ubuntu | `.../ubuntu/` |
| Fedora | `.../redhat/fedora/` |
| … | voir `etc/capsuleos/os-registry.json` |

## Windows (11)

`OS/windows/versions/<ver>/` : icônes barre, menu Démarrer, fenêtre iframe.

## macOS / Android / iOS

| OS | Entrée |
|----|--------|
| macOS Sonoma | `OS/macos/sonoma/` — menu + pages stub |
| Android | `OS/android/` |
| iOS 15 | `OS/ios/15/` |

Tester en **HTTP local** et **`file://`** pour Mint (référence P0).
