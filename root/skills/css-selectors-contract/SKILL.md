---
name: capsuleos-css-selectors-contract
description: >-
  Valide la cohérence des IDs et classes CSS entre gabarits HTML (Nemo, chrome),
  feuilles de style et querySelector/getElementById en JS. Use when JS cannot
  find elements, menus break after inject, or renaming #windowHeader / #nemo.
---

# Contrat sélecteurs CSS / DOM

## Gate

```bash
node usr/lib/capsuleos/tools/validate-css-selectors-contract.mjs
```

Contrat machine : `etc/capsuleos/contracts/desktop-selectors.json`

## IDs critiques (ne pas renommer sans mise à jour JS)

**Chrome WM :** `windowHeader`, `windowTitle`, `minimizeBtn`, `resizeBtn`, `closeBtn`

**Slot bureau :** `nemo` (dans `index.html` skin/façade, pas le gabarit injecté)

**Nemo (gabarit) :** `gestionnaire`, `nemoHeaderContainer`, `nemoMainContainer`, `voletnemo`, `voletContainer`, `nemoFooterContainer`, `precedent`, `suivant`, `parent`, `home`, `zoom`

## Workflow modification

1. Modifier le gabarit `usr/share/capsuleos/linux/apps/nemo.html` (ou variant explorateur sous `usr/share/capsuleos/linux/explorers/`)
2. Aligner `usr/lib/capsuleos/shells/linux/fileExplorer/*.js` et `common/window/chrome.js`
3. Mettre à jour `desktop-selectors.json` si nouvel ID contractuel
4. Lancer le validateur + `build-embeds-all.mjs` si gabarit embarqué

## Pièges

- `contentLoader` remplace le HTML du slot : les IDs doivent rester dans le template injecté
- Mint masque `.nemo-app__menubar` en CSS : ne pas binder le premier `.menuOutils` générique
- `#windowHeader` est **injecté** : absent du template Nemo initial

## Skills liés

- `capsuleos-window-side-effects`
- `capsuleos-vanilla-js-interactivity`
