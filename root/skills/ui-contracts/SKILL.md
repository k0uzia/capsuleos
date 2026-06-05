---
name: capsuleos-ui-contracts
description: >-
  Contrats UI bureau CapsuleOS — fenêtres (CAPSULE_WINDOW_CONTEXT), sélecteurs DOM,
  variables CSS et interactivité vanilla post-inject. Use when drag/resize breaks,
  Nemo IDs mismatch, var(--*) undefined, or clicks dead after contentLoader.
---

# Contrats UI — bureau

Skill **unique** pour les quatre gates UI (ex-skills `window-side-effects`, `css-selectors-contract`, `css-variables-contract`, `vanilla-js-interactivity`). Doc : [contrats-ui-bureau.md](../../docs/contrats-ui-bureau.md).

## Gate complète

```bash
node usr/lib/capsuleos/tools/validate-ui-contracts-all.mjs
# inclus dans validate-quality-all.mjs → validate-all.mjs
```

Gates ciblées : `validate-window-side-effects.mjs`, `validate-css-selectors-contract.mjs`, `validate-css-variables-contract.mjs`, `validate-vanilla-interactivity.mjs`.

Complément boot WM : skill `window-desktop` · `validate-desktop-window-boot.mjs`.

---

## 1. Effets de bord fenêtres

**Symptômes :** fenêtre qui descend dans l’overflow ; panel soustrait deux fois ; `CAPSULE_WINDOW_CONTEXT` ignoré ; drag depuis toolbar Nemo.

| Sujet | Règle |
|-------|--------|
| Bureau `object#desktop` | `position: absolute` sur `.windowElement` — `positioning.js` |
| Bornes | `subtractFooter: false` si `#desktop` exclut déjà `#tableau` (Mint) |
| Profil | `etc/capsuleos/profiles/*.json` → `build-skin-profiles.mjs` |
| Chemins | `CapsuleUserHome.resolveRelative()` dans les façades |
| Drag Nemo | Poignée = `#windowHeader` uniquement |

**Fichiers :** `common/window/positioning.js`, `drag.js`, profils Mint, `nemo.base.css`.

---

## 2. Sélecteurs DOM / CSS

Contrat : `etc/capsuleos/contracts/desktop-selectors.json`

**IDs critiques :** `windowHeader`, `windowTitle`, `minimizeBtn`, `resizeBtn`, `closeBtn` · slot `nemo` · Nemo : `gestionnaire`, `nemoHeaderContainer`, `nemoMainContainer`, `voletnemo`, `precedent`, `suivant`, `parent`, `home`, `zoom`.

**Workflow :** gabarit `OS/linux/shared/apps/nemo.html` → JS `fileExplorer/*.js`, `chrome.js` → mettre à jour le JSON contractuel → `build-embeds-all.mjs` si embed.

**Pièges :** `contentLoader` remplace le HTML du slot ; `#windowHeader` injecté après template Nemo.

---

## 3. Variables CSS

Contrat : `etc/capsuleos/contracts/css-variable-sources.json`

**Chaîne skins Linux :**

```css
@import variables.css;
@import variables-linux.css;
@import variables-linux-computed.css;
```

Nouvelle variable globale → `themes/linux/variables-linux.css` ; par app → section fenêtres ; pas de `var(--foo)` sans définition.

---

## 4. Interactivité vanilla JS

```bash
node usr/lib/capsuleos/tools/validate-vanilla-js.mjs
```

**Cycle Nemo :** inject → `SLOT_INIT_HANDLERS.nemo` → `ensureWindowChromeAfterSlotInject` → `capsule:window-opened`.

| Règle | Détail |
|-------|--------|
| Init une fois | `dataset.nemoInit` sur `#nemo` |
| Chemins | `resolveRelative()` / `CAPSULE_CONTENT_ROOT` |
| Menubar masquée | ne pas binder si `display: none` |
| Interdit | `fromRepoDepth(3)` sur façades `OS/linux/families/...` |

---

## Après noyau ou profil

```bash
node usr/lib/capsuleos/tools/build-capsule-window.mjs      # si window/
node usr/lib/capsuleos/tools/build-skin-profiles.mjs       # si profil modifié
node usr/lib/capsuleos/tools/validate-desktop-window-boot.mjs
```

## Références

- [convention-contexte-fenetres.md](../../docs/convention-contexte-fenetres.md)
- [mint-fenetres-muffin.md](../../docs/mint-fenetres-muffin.md)
- [architecture-globale.md](../../docs/architecture-globale.md)
