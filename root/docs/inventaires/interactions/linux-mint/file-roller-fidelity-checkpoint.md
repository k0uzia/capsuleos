# Checkpoint fidélité File Roller (App P1) — pré-push

**Date** : 2026-06-09  
**Slot** : `file_roller`  
**URL recette** : `http://127.0.0.1:5501/OS/linux/families/debian/mint/index.html`

## Verdict : **GO**

9/9 scénarios P0/P1 verts · 0 échec P0 · campagne `--write` OK · non-régression Nemo/context-menus OK.

## Gates exécutées

| Gate | Commande | Résultat |
|------|----------|----------|
| H₂ | `node usr/lib/capsuleos/tools/validate-all.mjs` | ✅ exit 0 |
| Campagne App P1 | `smoke-mint-file-roller-fidelity.mjs` | ✅ 9/9 · p0Fail 0 · p1Fail 0 |
| Smoke legacy | `smoke-mint-file-roller.mjs` | ✅ exit 0 |
| Nemo (non-régression) | `smoke-mint-context-menus.mjs` | ✅ exit 0 |
| Nemo campagne | `smoke-mint-nemo.mjs` | ✅ exit 0 |
| Checklist | `print-mint-app-p1-checklist.mjs file_roller` | ✅ 9 scénarios |

## Prédicats cibles

| Symbole | Signification | État |
|---------|---------------|------|
| **AppP1_FR** | Scénarios P0/P1 file_roller verts | ✅ |
| **Rv₁** | Vue cohérente après action (titre, liste, vide) | ✅ (open-demo, close, search, extract) |
| **RecF** | Matrice `file-roller-scenarios.json` + procédure recette | ✅ |
| **RecA** | Dernier run campagne exit 0 | ✅ `file-roller-campaign-capsule.json` |

## Corrections campagne (2026-06-09)

- Ouverture menu : `openMintSlot('file_roller')` — la recherche « Gestionnaire » matche 4 apps (Bluetooth en premier).
- Géométrie mesurée **avant** `window.drag` — le drag vers le bord gauche maximise la fenêtre (1280×760).

## VM ground truth

- JSON : `linux-mint-file-roller-vm.json`
- Doc : `linux-mint-file-roller-vm.md`
- Package : file-roller 43.0+mint1+wilma · géométrie 652×579 · headerbar 46 px

## Procédure reproductible

Voir § checkpoint App P1 dans `recette-clone-mint-integral.md` et `ground-truth-cinnamon.md`.
