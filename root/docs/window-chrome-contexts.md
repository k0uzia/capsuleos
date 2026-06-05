# Contextes chrome fenêtre par toolkit DE

Objectif : **isoler le fenêtrage** de chaque environnement de bureau (Cinnamon, GNOME, KDE, COSMIC) pour éviter les effets de bord entre skins — typiquement **Nemo ≠ Nautilus ≠ Dolphin**, et chaque WM conserve sa singularité visuelle (Muffin, Mutter, Breeze…).

Complète [convention-contexte-fenetres.md](convention-contexte-fenetres.md) et [mint-fenetres-muffin.md](mint-fenetres-muffin.md).

## Problème

Avant ce contrat, `chrome.js` inférait le provider (Nemo, Nautilus, Dolphin) via des tests ad hoc (`body#mint`, `CAPSULE_EMBED_SKIN_KEY`, etc.). Un skin GNOME pouvait hériter de comportements Cinnamon et inversement.

## Architecture

```
etc/capsuleos/profiles/linux-*.json
  └─ CAPSULE_WINDOW_CHROME_CONTEXT   ← surcharge par distro (toolkitId, slotProviders)
       +
etc/capsuleos/contracts/window-chrome-contexts.json   ← vérité machine
       ↓
usr/lib/capsuleos/common/window/header-context.js   ← résolution runtime
       ↓
usr/lib/capsuleos/common/window/chrome.js           ← providers + drag policy
```

| Couche | Rôle |
|--------|------|
| **Contrat JSON** | Définit les toolkits, templates explorateur, providers par slot |
| **`CapsuleWindowHeaderContext`** | Fusionne profil skin + contrat ; expose `resolveChromeProviderId(slotId)` |
| **`CapsuleWindowChrome`** | Injecte `#windowHeader`, applique drag/icons selon le provider résolu |
| **Skin CSS** | Habillage visuel uniquement (`window-chrome.base.css`, `*.skin.css`) |

## Toolkits (phase 1)

| Toolkit | WM simulé | Explorateur | Provider slot `nemo` | Drag explorateur |
|---------|-----------|-------------|----------------------|------------------|
| **cinnamon** | Muffin SSD | Nemo (`nemo`) | `nemo` / **`cinnamon`** (autres slots) | `unified-titlebar` / drag `#windowHeader` |
| **gnome** | Mutter SSD | Nautilus (`nemo-gnome`, `nautilus`) | `nemo-gnome` | `app-headerbar-passthrough` |
| **kde** | Breeze | Dolphin (`dolphin`) | `dolphin` | `window-header` |
| **cosmic** | COSMIC | `nemo-cosmic` / `nautilus-cosmic` | `nemo-gnome` | `app-headerbar-passthrough` |

Seule la **couche fichiers simulée** (`fileExplorerCore.js`, FS CapsuleOS) est commune ; le chrome et les templates HTML restent singuliers.

## Profil Mint (référence P0)

`etc/capsuleos/profiles/linux-mint.json` :

```json
"CAPSULE_WINDOW_CHROME_CONTEXT": {
  "toolkitId": "cinnamon",
  "explorerTemplate": "nemo",
  "explorerDragMode": "unified-titlebar",
  "slotProviders": {
    "file_roller": "file-roller-gtk"
  }
}
```

Après modification : `node usr/lib/capsuleos/tools/build-skin-profiles.mjs`.

## API runtime

```js
CapsuleWindowHeaderContext.resolveToolkitId();       // 'cinnamon' | 'gnome' | 'kde' | 'cosmic'
CapsuleWindowHeaderContext.getToolkitContext();        // fusion profil + défauts
CapsuleWindowHeaderContext.resolveChromeProviderId('nemo');  // 'nemo' sur Mint
CapsuleWindowHeaderContext.usesUnifiedExplorerTitleBar();     // true sur Cinnamon
```

## Gates

```bash
node usr/lib/capsuleos/tools/validate-window-chrome-contexts.mjs
node usr/lib/capsuleos/tools/build-capsule-window.mjs   # regen capsule-window.js
node usr/lib/capsuleos/tools/build-skin-profiles.mjs    # si profil touché
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Roadmap

1. **P0 Mint** — contrat + `header-context.js` + profil cinnamon + barre Muffin toutes fenêtres ✅
2. **P1 GNOME** — profils Fedora/Ubuntu/Rocky/AnduinOS avec `toolkitId: gnome` ✅
3. **P1 KDE** — openSUSE/MX/Debian-KDE avec `dolphin` ✅
4. **P2 Cosmic** — Pop!_OS avec `toolkitId: cosmic` ✅
5. **P2** — providers `gnome` / `kde` dédiés (au-delà du résolveur générique)
6. **P2** — générer les défauts runtime depuis le JSON (éviter double source)

Attributs debug : `data-window-chrome-toolkit`, `data-window-chrome-provider` sur chaque `.windowElement`.

CSS Mint unifié : `home/Debian/Mint/style/cinnamon-window-chrome.css`

Smokes : `smoke-mint-window-chrome.mjs`, `smoke-mint-nemo.mjs`, `smoke-mint-file-roller.mjs`

## Skills

- `window-desktop` — boot WM
- `window-side-effects` — ancrage `object#desktop`, profils
- `capsuleos-distro-linux-mint` — parité Muffin/Nemo

## Références

- [common/window/README.md](../../usr/lib/capsuleos/common/window/README.md)
- [contrats-ui-bureau.md](contrats-ui-bureau.md)
