---
name: capsuleos-ui-state-effects-replication
description: Audits and replicates GNOME UI states, visual effects, menus and popovers using propositional logic predicates Ve, Vx, Vm, Vμ, VΣ. Use when cataloging transitions, shadows, gradients, window open/close, context menus, submenus, or achieving 100% visual fidelity per user action and context.
---

# Réplication états UI & effets (VΣ)

## Quand invoquer

- Utilisateur demande **100 % fidélité** menus, popovers, transitions, ombres, dégradés
- Après `visual-parity-lab` (shell P0) — approfondir **états** et **effets**
- Mots-clés : état système, transition, context-menu, sous-menu, apparition fenêtre, contraste

## Prédicats (obligatoires)

| Symbole | Contenu |
|---------|---------|
| **Ve** | Matrice transitions P0 documentée |
| **Vx** | Durée, easing, propriétés CSS mesurées |
| **Vm** | Items menu/popover énumérés |
| **Vμ** | Capsule : computed styles + capture miroir |
| **VΣ** | **Ve ∧ Vx ∧ Vm ∧ Vμ** |

Contrat : `etc/capsuleos/contracts/ui-state-effects.json`  
Procédure : `root/docs/procedure-audit-etats-ui-effets.md`

## Commande unique

```bash
node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --id <registryId>
```

L'agent exécute **sans demander** les scripts intermédiaires.

## Séquence interne

1. `run-visual-parity-pass.mjs` — baseline shell (**Vp**)
2. `collect-ui-state-effects.mjs --write` — playbooks VM + burst PNG
3. `collect-ui-state-effects.mjs --capsule` — `getComputedStyle` Playwright
4. `smoke-ui-state-effects.mjs` — gate **VΣ**

## Matrice & inventaire

- Matrice GNOME : `root/tools/lab/ui-state-effects-matrix-gnome.json`
- Inventaire : `root/docs/inventaires/<id>-ui-state-effects.json`
- Captures burst VM : `inventory/<vendor>-ui-effects-vm/<transitionId>/`

## Règles agent (R-VΣ)

```
¬Ve  →  collect --write
Ve ∧ ¬Vm  →  compléter énumération menus (playbook expectedMenu)
Vm ∧ ¬Vμ  →  patch CSS/JS + --capsule
VΣ  →  smoke vert
```

## P0 — checklist effet

Pour chaque transition P0, vérifier :

- [ ] `box-shadow` (couches)
- [ ] `backdrop-filter` / blur popover
- [ ] `opacity` + `transform` animation
- [ ] `transition-duration` / `timing-function`
- [ ] Items menu (ordre, séparateurs, sous-menus)
- [ ] Capture before / during / after

## Pairing

`visual-parity-lab` · `os-clone-from-vm` · `gnome-hig-replication` · `vanilla-js-interactivity`

## Ne pas

- Implémenter un menu sans entrée `menuCatalog` / `menusDetected`
- Classer `visualMatch: match` sans `computedStyles` rempli
- Sauter les burst `during-*ms` sur transitions P0
