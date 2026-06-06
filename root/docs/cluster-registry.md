# Registre des clusters — gabarits CapsuleOS

Classification hiérarchique des templates HTML/CSS.

**Source JSON** : [`etc/capsuleos/cluster-registry.json`](../../etc/capsuleos/cluster-registry.json)  
**Runtime** : `usr/lib/capsuleos/core/cluster-registry.js`  
**Résolution** : `contentLoader.js` → `CapsuleClusterRegistry.resolveHtmlPath()`

## Niveaux

| Niveau | Exemple ID | Rôle |
|--------|------------|------|
| `kernel` | (dans kernels.json) | Specs OS |
| `branch` | `debian`, `kde` | Tokens branche Linux |
| `toolkit` | `toolkit.gnome` | Window chrome |
| `cluster` | `explorer.dolphin.kde` | HTML + CSS base |
| `leaf` | `linux-opensuse` | Overrides skin |

## Regénération

```bash
node usr/lib/capsuleos/tools/build-cluster-registry.mjs
```
