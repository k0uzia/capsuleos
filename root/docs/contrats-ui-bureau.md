# Contrats UI — bureau, fenêtres, interactivité

Cinq validateurs et skills transverses garantissent la cohérence du **système de fenêtres central** et de l’**interactivité vanilla** sur les ressources distribuées (skins `home/`, façades `OS/`).

## Skills

| Skill | Gate | Rôle |
|-------|------|------|
| [`window-side-effects`](../skills/window-side-effects/SKILL.md) | `validate-window-side-effects.mjs` | Profils `CAPSULE_WINDOW_CONTEXT`, ancrage `object#desktop`, chemins façade |
| [`css-selectors-contract`](../skills/css-selectors-contract/SKILL.md) | `validate-css-selectors-contract.mjs` | IDs/classes chrome + Nemo vs JS |
| [`css-variables-contract`](../skills/css-variables-contract/SKILL.md) | `validate-css-variables-contract.mjs` | `var(--*)` définies dans la chaîne thème |
| [`vanilla-js-interactivity`](../skills/vanilla-js-interactivity/SKILL.md) | `validate-vanilla-interactivity.mjs` | Init slots, `resolveRelative`, handlers explorateur |
| — | `validate-interactions-contract.mjs` | Hover / active / focus / grab CSS + `requireHeader` Linux |

Complément : [`window-desktop`](../skills/window-desktop/SKILL.md) (boot scripts WM).

## Contrats machine

- `etc/capsuleos/contracts/desktop-selectors.json` — IDs DOM contractuels
- `etc/capsuleos/contracts/css-variable-sources.json` — fichiers sources de variables

Bibliothèque partagée : `usr/lib/capsuleos/tools/lib/ui-contract-lib.mjs`

## Validation

```bash
# Orchestrateur (5 validateurs)
node usr/lib/capsuleos/tools/validate-ui-contracts-all.mjs

# Inclus dans validate-quality-all.mjs → validate-all.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Interactions (clic, hover, focus, drag)

Fichier partagé : `usr/share/capsuleos/themes/global/interactions-window.base.css` (importé via `window-chrome.base.css` et façades Windows 11 / macOS Sonoma).

| État | CSS / JS |
|------|----------|
| Survol boutons chrome | `:hover` dans `window-chrome.base.css` ou shell vendor |
| Clic enfoncé | `:active` sur `#windowHeader > nav > button` |
| Focus clavier | `:focus-visible` + fichiers `a11y-*.css` par skin (`body#…`) |
| Fenêtre active | `.windowElementActive` — `capsule-window-shell.js` / `stack.js` |
| Déplacement | `pointerdown` + `setPointerCapture` — `window/drag.js` ; **Linux** : `requireHeader: true` dans `capsule-window-context.js` |
| Poignée drag | `data-window-drag-handle` sur `#windowHeader` — `window/chrome.js` (sauf Firefox onglets, Nemo GNOME avec handle interne) |
| Curseur drag | `cursor: grab` / `grabbing` sur `#windowHeader` |

## Règles transverses

1. **Façades Linux P0** : `CAPSULE_CONTENT_ROOT = CapsuleUserHome.resolveRelative()` (pas `fromRepoDepth(3)`).
2. **Bureau Mint / Cinnamon** : `mainSelector` / `desktopSelector` = `object#desktop` ; `subtractFooter: false` si le CSS exclut déjà le panel.
3. **Nemo** : layout flex dans `nemo.base.css` ; drag depuis `#windowHeader` uniquement.
4. **Après noyau `window/`** : `node usr/lib/capsuleos/tools/build-capsule-window.mjs`.
5. **Après profil skin** : `node usr/lib/capsuleos/tools/build-skin-profiles.mjs`.

## Références

- [convention-contexte-fenetres.md](convention-contexte-fenetres.md)
- [mint-fenetres-muffin.md](mint-fenetres-muffin.md)
- [skills-hierarchie.md](skills-hierarchie.md)
