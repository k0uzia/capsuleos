---
name: capsuleos-os-android
description: Expert on CapsuleOS simulated Android under OS/android—apps, messages, embed pipeline. Use when modifying Android UI, build-android-embed, or vanillaicecream-style assets.
---

# OS Android (CapsuleOS)

## Arborescence

| Zone | Chemin |
|------|--------|
| Façade | `OS/android/` (`index.html`, `apps/`, `js/`, `style/`, `ressources/`) |
| Embed offline | `var/lib/capsuleos/generated/capsule-android-embed.js` |
| Icônes portail | `./assets/images/platforms/pick-os/android/` |

## Build

Après apps ou `OS/android/ressources/messages.json` :

```bash
node usr/lib/capsuleos/tools/build-android-embed.mjs
```

## Partage contenu

Certaines démos peuvent réutiliser la logique « home » ; vérifier `user-home.js` et manifests si explorateur fichiers ajouté côté Android.

## Rôles fréquents

`role-developer`, `role-web-designer`, `role-integrator`.
