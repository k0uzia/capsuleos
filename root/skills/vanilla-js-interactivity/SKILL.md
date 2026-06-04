---
name: capsuleos-vanilla-js-interactivity
description: >-
  Interactivité vanilla JS CapsuleOS — init par slot après contentLoader,
  délégation événements, chemins resolveRelative, pas de bind sur UI masquée.
  Use when clicks, navigation Nemo, toolbar or sidebar stop working after inject.
---

# Interactivité vanilla JS

## Gate

```bash
node usr/lib/capsuleos/tools/validate-vanilla-interactivity.mjs
node usr/lib/capsuleos/tools/validate-vanilla-js.mjs
```

## Cycle Nemo (référence)

1. `contentLoader` injecte HTML + CSS dans `div[data-link="nemo"]`
2. `SLOT_INIT_HANDLERS.nemo` : `initFileExplorerContainer` → `loadFileExplorerDirectory(resolveRelative())` → `initFileExplorerDnD`
3. `ensureWindowChromeAfterSlotInject` — chrome + drag/resize
4. `capsule:window-opened` — ancrage `positioning.js`

## Règles

| Règle | Détail |
|-------|--------|
| Init une fois | `dataset.nemoInit` / `dataset.fileExplorerInit` sur `#nemo` |
| Chemins | `CapsuleUserHome.resolveRelative()` ou `CAPSULE_CONTENT_ROOT` |
| Menubar masquée | `bindFileExplorerMenubar` uniquement si `display !== none` |
| Navigation | Préférer délégation sur `.nemo-app__toolbar` (`bindNemoNavigationControls`) |
| Pas de `fromRepoDepth(3)` | Façades `OS/linux/families/...` = profondeur variable |

## Débogage rapide

- Console : erreur fetch manifest → mauvais `CAPSULE_CONTENT_ROOT`
- Clic sidebar sans effet → `initFileExplorerContainer` non passé ou `folderMap` vide
- Toolbar morte → bind sur mauvais `.menuOutils` ou preventDefault parent

## Skills liés

- `capsuleos-window-side-effects`
- `capsuleos-css-selectors-contract`
- `capsuleos-distro-linux-mint` (Cinnamon)

## Doc

- [contrats-ui-bureau.md](../../docs/contrats-ui-bureau.md)
