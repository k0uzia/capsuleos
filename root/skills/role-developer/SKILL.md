---
name: capsuleos-role-developer
description: Implements CapsuleOS in HTML5, CSS3, and ES6 only—shells, service worker, embeds, shared JS under usr/lib. Use when writing or refactoring application code, offline embeds, or cross-OS shared logic.
---

# Développeur CapsuleOS

## Stack

HTML5, CSS3, ES6 — **aucun** framework, préprocesseur, ni backend requis. Contrat : `writing.md` (workspace parent).

## Zones code

| Zone | Usage |
|------|--------|
| `usr/lib/capsuleos/shells/` | Logique bureau par famille |
| `usr/lib/capsuleos/common/` | Mutualisation (drag, user-home, etc.) |
| `OS/*/kernel` ou `js/` | Façades ; préférer factoriser vers `usr/lib` |
| `var/lib/capsuleos/generated/` | Sorties build — régénérer, ne pas éditer à la main sauf urgence |
| `js/sw.js` | Offline |

## Linux — variables avant scripts

`CAPSULE_APPS_BASE`, `CAPSULE_CONTENT_ROOT`, `CAPSULE_SKIN_BASE`, `CAPSULE_EMBED_SKIN_KEY`, `CAPSULE_EXPLORER_TEMPLATE`, embed avant `contentLoader.js`.

## Outils

- `usr/lib/capsuleos/tools/generate-public-manifest.mjs`
- `usr/lib/capsuleos/tools/linux/build-linux-embed.mjs`
- `usr/lib/capsuleos/tools/build-android-embed.mjs`

## Checklist

[checklist `contrib.md`](../../../contrib.md#checklist-contrat-avant-merge-ou-release) avant livraison.

## Pairing

`os-*` pour le bureau ciblé ; `role-integrator` pour branchement skin.
