---
name: capsuleos-window-side-effects
description: >-
  Prévient les effets de bord du système de fenêtres CapsuleOS (object#desktop,
  position absolute, profils CAPSULE_WINDOW_CONTEXT, double panel). Use when
  drag/resize/max behave oddly, windows clip under overflow, or after changing
  window kernel or Mint/Cinnamon layout.
---

# Effets de bord — fenêtres

## Symptômes typiques

- Fenêtre qui **descend** ou disparaît dans l’overflow au drag
- Zone de travail trop petite (panel soustrait deux fois)
- `CAPSULE_WINDOW_CONTEXT` ignoré sur la **façade** (profil embed obsolète)
- Clic toolbar Nemo déplace la fenêtre

## Checklist avant merge

```bash
node usr/lib/capsuleos/tools/validate-window-side-effects.mjs
node usr/lib/capsuleos/tools/validate-window-chrome-contexts.mjs
node usr/lib/capsuleos/tools/validate-desktop-window-boot.mjs
node usr/lib/capsuleos/tools/build-skin-profiles.mjs   # si profil modifié
node usr/lib/capsuleos/tools/build-capsule-window.mjs  # si noyau window/
```

## Règles CapsuleOS

| Sujet | Règle |
|-------|--------|
| Bureau `object#desktop` | `position: absolute` sur `.windowElement`, pas `fixed` seul — voir `positioning.js` |
| Bornes | `subtractFooter: false` si `#desktop` CSS exclut déjà `#tableau` (Mint) |
| Profil | Source `etc/capsuleos/profiles/*.json` → regen `capsule-skin-profiles.js` |
| Chemins contenu | `CapsuleUserHome.resolveRelative()` dans les façades (pas `fromRepoDepth(3)`) |
| Drag Nemo | Poignée = `#windowHeader` sur Mint ; pas de drag depuis toolbar/grille |
| Regen | Après `window/` ou profil : rebuild bundle + recharger la page |

## Fichiers sensibles

- `usr/lib/capsuleos/common/window/positioning.js`, `drag.js`
- `etc/capsuleos/profiles/linux-mint.json`
- `home/Debian/Mint/style/style.css`, `nemo.skin.css`
- `usr/share/capsuleos/linux/apps/style/nemo.base.css`

## Skills liés

- `capsuleos-window-desktop` — boot scripts
- `capsuleos-css-selectors-contract` — IDs chrome/Nemo
- `capsuleos-vanilla-js-interactivity` — init JS post-inject

## Doc

- [convention-contexte-fenetres.md](../../docs/convention-contexte-fenetres.md)
- [window-chrome-contexts.md](../../docs/window-chrome-contexts.md)
- [mint-fenetres-muffin.md](../../docs/mint-fenetres-muffin.md)
- [contrats-ui-bureau.md](../../docs/contrats-ui-bureau.md)
