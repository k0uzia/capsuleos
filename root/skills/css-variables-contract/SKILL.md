---
name: capsuleos-css-variables-contract
description: >-
  Vérifie que les var(--*) utilisées dans les CSS skins/themes sont définies
  dans variables.css / variables-linux.css. Use when layout breaks, unknown
  properties, or adding --win-* / --nemo-* tokens.
---

# Contrat variables CSS

## Gate

```bash
node usr/lib/capsuleos/tools/validate-css-variables-contract.mjs
```

Sources de définition : `etc/capsuleos/contracts/css-variable-sources.json`

Norme complète : [convention-css-variables-tokens.md](../../docs/convention-css-variables-tokens.md) — N0 tokens (hex autorisés) vs N1/N2 (`var(--*)` prioritaire). La gate vérifie **uniquement** les `var(--*)` orphelines, pas l’absence de littéraux.

## Chaîne obligatoire (skins Linux)

```css
@import variables.css;
@import variables-linux.css;
@import variables-linux-computed.css;
```

Puis `window-chrome.base.css`, `windows.css`, `*.skin.css`.

## Règles

| Action | Où |
|--------|-----|
| Nouvelle variable globale | `usr/share/capsuleos/themes/linux/variables-linux.css` ou `variables-linux-computed.css` |
| Variable par app (`--win-nemo-*`) | `variables-linux.css` section fenêtres |
| Variable vendor | `home/<Distro>/style/` ou skin dédié, pas de hardcode px si token existe |
| Alias sémantiques (`--f`, `--n`) | Déjà dans `variables.css` — ne pas redéfinir |

## Ne pas

- Introduire `var(--foo)` sans définir `--foo` dans la chaîne import
- Dupliquer `--head` avec une autre échelle (une seule source `--head`)

## Skills liés

- `capsuleos-lang-css`
- `role-web-designer`
