# Compatibilité navigateurs — CapsuleOS

Matrice moteurs pour le noyau central (`CapsuleBrowserCapabilities`).

## Moteurs supportés (développement et CI cible)

| Moteur | Détection | Statut |
|--------|-----------|--------|
| Chromium / Blink | Chrome, Edge Chromium | Référence lab Playwright |
| Gecko | Firefox | Supporté — tests probes noyau |
| WebKit | Safari | Supporté — préfixes `-webkit-` |

## Hors périmètre

| Moteur | Raison |
|--------|--------|
| Trident (IE ≤ 10) | ES6 strict, pas de maintenance |
| EdgeHTML (Edge legacy) | Idem |

Le module `usr/lib/capsuleos/engines/legacy-mshtml.js` affiche un avertissement explicite.

## Capacités exposées

- `clipboard` — presse-papiers async
- `serviceWorker` — mode hors ligne HTTP
- `customEvent` — bus `capsule:*`
- `maskImage` / `backdropFilter` — chrome et icônes
- `fileProtocolEmbed` — gabarits inline en `file://`

## Mode lab

Pick-os : 12 entrées (waves 1–5). Skins archivés : `?devSkin=<registryId>` sur le portail.

## Fichiers

- `usr/lib/capsuleos/core/browser-capabilities.js`
- `usr/lib/capsuleos/engines/*.js`
- Gate : `validate-browser-capabilities.mjs`
