---
name: capsuleos-window-desktop
description: Fenêtres bureau CapsuleOS (réf. macOS Sonoma) — drag, resize, CAPSULE_WINDOW_CONTEXT, shells/common, validate-desktop-window-boot. Use when windows cannot move or resize on any vendor, or extending window shell.
---

# Bureau — interactions fenêtre

## Symptôme

Fenêtre visible mais **pas de déplacement / redimensionnement** (souvent Mint ou skin sans chaîne scripts complète).

## Diagnostic

```bash
node usr/lib/capsuleos/tools/validate-desktop-window-boot.mjs
```

Console : `[CapsuleOS] capsule-desktop-shell — manquant`.

## Correction

1. Ordre scripts (voir [convention-contexte-fenetres.md](../../docs/convention-contexte-fenetres.md)).
2. Charger `shells/common/capsule-window-context.js`, `capsule-window-shell.js`, `capsule-desktop-shell.js`, `capsule-window-header-buttons.js`.
3. `CAPSULE_WINDOW_FAMILY` ou `CAPSULE_WINDOW_CONTEXT` dans le profil skin.
4. Linux : attendre fin `contentLoader` (`CapsuleWindowContext.boot()`).

## Règle

Toute `.windowElement[data-link]` hors `skipSlots` → `data-capsule-window-managed="true"` après inject / ouverture.

Linux : drag depuis `#windowHeader` uniquement (`requireHeader: true`). Curseurs `grab` / `grabbing` : `interactions-window.base.css`.

## Ne pas

- Charger `capsule-window-shell.js` avant `windowContainer.js` vendor
- Charger `capsule-window.js` avant `capsule-window-shell.js`
- Attendre le drag depuis le CSS seul (comportement = JS noyau)
- Dupliquer la logique drag dans un skin (utiliser `CapsuleWindow` / contexte)

## Contrats UI (effets de bord)

Si drag, overflow ou toolbar Nemo posent problème après correction boot :

```bash
node usr/lib/capsuleos/tools/validate-ui-contracts-all.mjs
```

Skills : `window-side-effects`, `css-selectors-contract`, `css-variables-contract`, `vanilla-js-interactivity` — voir [contrats-ui-bureau.md](../../docs/contrats-ui-bureau.md).

## Références

- [convention-contexte-fenetres.md](../../docs/convention-contexte-fenetres.md)
- [contrats-ui-bureau.md](../../docs/contrats-ui-bureau.md)
- [common/window/README.md](../../../usr/lib/capsuleos/common/window/README.md)
