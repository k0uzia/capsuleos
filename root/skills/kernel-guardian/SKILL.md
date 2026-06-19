---
name: capsuleos-kernel-guardian
description: Guards CapsuleOS kernel JS integrity — CapsuleWindow, contentLoader, CapsuleResource, embed regen, and P0 Mint regression gates. Use when editing usr/lib/capsuleos/common/, usr/lib/capsuleos/shells/linux/, or after asset routing changes that affect hydration.
---

# Gardien noyau CapsuleOS

## Objectif

Empêcher les régressions sur le **comportement** du noyau (fenêtres, slots, résolution URLs) pendant les migrations assets. Pair obligatoire de `asset-pipeline` dès qu’un script noyau ou un embed est touché.

## Périmètre fichiers

- `usr/lib/capsuleos/common/` (`capsule-window.js`, `user-home.js`, …)
- `usr/lib/capsuleos/shells/linux/` (slots, terminal, fileExplorer, …)
- `var/lib/capsuleos/generated/` (sortie embed — ne pas éditer à la main)

## Gates P0 (Mint)

Avant de valider une PR noyau ou post-migration :

1. Ouvrir Mint en HTTP : explorateur, fenêtre, checklist
2. Répéter en `file://` (offline SW)
3. Console : aucune 404 sur `./assets/` ou icônes KDE/Cinnamon résolues

**Échec Mint → stop** ; seul le gardien corrige avant reprise migration.

## Après changement routing / assets

```bash
node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs
```

Vérifier :

- `rewriteCapsuleResourceUrlsInText` appliqué aux templates injectés
- Pas de fork `site/window*.js` ni copie legacy sous `OS/linux/kernel/`

## Hydratation (rappel)

| Phase | Module |
|-------|--------|
| H2 | `capsule-resource.js` |
| H3 | `contentLoader.js` |
| H4 | `CapsuleWindow` |
| H5 | `SLOT_INIT_HANDLERS` |

Idempotence : `data-*-init` avant re-bind.

## Anti-patterns

- Modifier `capsule-app-embed.js` à la main
- `@import` dans CSS injecté dynamiquement
- Hydratation destructive du chrome fenêtre (header hors `innerHTML` apps)
- Nouveaux `CAPSULE_*_BASE` non enregistrés dans `assets/manifest.json`

## Escalade

→ `kernel-supervisor` si régression touche plusieurs familles ou validate-asset-zones.

## Références

- [manifeste-noyau.md](../../docs/manifeste-noyau.md)
- [usr/lib/capsuleos/common/window/README.md](../../../usr/lib/capsuleos/common/window/README.md)
- [usr/lib/capsuleos/common/README.md](../../../usr/lib/capsuleos/common/README.md)
