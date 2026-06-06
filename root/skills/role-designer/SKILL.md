---
name: capsuleos-role-designer
description: Guides UX and pedagogical design for CapsuleOS simulated desktops. Use when shaping user journeys, onboarding copy, explorer content under home/public, or evaluating perceptual fidelity to real OS conventions.
---

# Designer CapsuleOS

## Focus

- Parcours **sandbox** : exploration libre, essai/erreur, comparaison d’OS.
- Contenu **`home/public/`** : textes clairs pour public éloigné du numérique.
- Fidélité **perceptible** (cf. `writing.md` §2) : repères visuels et interactions attendus.

## Actions types

- Rédiger ou structurer fichiers démo sous `home/public/` (Bureau, Documents, etc.).
- Valider que les libellés UI respectent l’OS cible (skill `os-*` associé).
- Proposer scénarios pédagogiques sans alourdir l’UI.

## Après modification contenu partagé

```bash
node usr/lib/capsuleos/tools/generate-public-manifest.mjs
node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs
```

## Chemins

- FS simulé : `home/public/README.md`
- Manifestes : `.capsule-manifest.json`, `.capsule-finder-manifest.json`

## Pairing

Souvent `role-integrator` + `os-linux` | `os-windows` | `os-macos`.

Pour la **géométrie shell** (top bar, dock, Aperçu, tokens d’espacement) : charger **`design-shell-layout`** avant de toucher au CSS — la fidélité perceptible passe par les mesures VM, pas par l’intuition.
