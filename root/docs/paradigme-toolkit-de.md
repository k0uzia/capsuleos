# Paradigme toolkit — environnements de bureau Linux

> **Statut** : référence architecturale multi-DE.  
> Spécialisation Cinnamon : [paradigme-toolkit-cinnamon.md](paradigme-toolkit-cinnamon.md) · audit Mint : [inventaires/linux-mint-cinnamon-vs-gnome-audit.md](inventaires/linux-mint-cinnamon-vs-gnome-audit.md) · cloisonnement : [inventaires/toolkit-cloisonnement-audit.md](inventaires/toolkit-cloisonnement-audit.md).

CapsuleOS modélise chaque skin Linux avec un **toolkit** distinct. Le noyau JS partage des gabarits (Nemo slot `data-link="nemo"`) mais **branche** par toolkit pour menus, icônes et chrome fenêtre.

---

## Matrice DE → toolkit → vendor → explorateur → menu contextuel

| Registry ID | DE / toolkit | Vendor | Slot explorateur | Template | Module menu contextuel |
|-------------|--------------|--------|------------------|----------|------------------------|
| `linux-mint` | Cinnamon | `mint` | `nemo` | `nemo` | `fileExplorerContextMenu.js` → `bindNemoContextMenu` (dynamique `.nemo-app__context-menu`) |
| `linux-rocky` | GNOME Shell | `rocky` | `nemo` | `nemo-gnome` | `fileExplorerContextMenu.js` → `bindNautilusGnomeContextMenu` (`#nemo-context-menu` dans `shell-gnome.html`) |
| `linux-ubuntu` | GNOME Shell | `ubuntu` | `nemo` | `nemo-gnome` | idem Rocky (pack icônes Yaru via `explorer-icon-base.js`) |
| `linux-fedora` | GNOME Shell | `fedora` | `nemo` | `nemo-gnome` | idem Rocky |
| `linux-debian-kde` | KDE Plasma | `debian` | `nemo` | `dolphin` | `fileExplorerDolphin.js` (pas de menu Nemo/Nautilus) |
| `linux-mx-kde` | KDE Plasma | `mx` | `nemo` | `dolphin` | idem KDE |
| `linux-kde-neon` | KDE Plasma | `neon` | `nemo` | `dolphin` | idem KDE |

**Règle slot** : le lanceur panel reste `data-link="nemo"` sur tous les skins ; seul le **template** (`CAPSULE_EXPLORER_TEMPLATE`) change le gabarit HTML chargé.

---

## Noyau JS — branches par toolkit

| Module | Cinnamon (Nemo) | GNOME (Nautilus) | KDE (Dolphin) |
|--------|-------------------|------------------|---------------|
| `explorer-icon-base.js` | `icons/cinnamon/nemo` | `icons/gnome/adwaita` ou Yaru | `icons/kde` |
| `fileExplorerCore.js` | `isNemoTemplate()` | `isNautilusGnomeTemplate()` | `isDolphinTemplate()` |
| `fileExplorerContextMenu.js` | `bindNemoContextMenu` | `bindNautilusGnomeContextMenu` | — |
| `fileExplorerNautilus*.js` | non chargé | chargé si `loadNautilusExtension` | non chargé |
| WM behaviors | `cinnamon-window-behaviors.js` | `gnome-window-behaviors.js` | KDE chrome |
| Menu bureau | `mainMenu-data-cinnamon.js` | overview / dash GNOME | menu KDE |

Détection runtime : `window.isNautilusGnomeTemplate()` (classe `.nautilus-app` ou `CapsuleExplorerRegistry.isNautilusFamily()`).

---

## Gates cloisonnement

```bash
node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --all
node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --id linux-mint
node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --id linux-rocky
node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --id linux-ubuntu
```

---

## Anti-patterns (fuites cross-toolkit)

| Fuite | Impact | Gate |
|-------|--------|------|
| `toolkits/gnome/apps` dans skin Mint | Menu Cinnamon → icônes GNOME Shell | `validate-toolkit-paradigm --id linux-mint` |
| `toolkits/cinnamon` dans Rocky/Ubuntu | Dock GNOME → assets Cinnamon | `--id linux-rocky` / `--id linux-ubuntu` |
| Menu Nemo simplifié sur Nautilus GNOME | Clic droit Rocky/Ubuntu cassé (régression 00816fb) | smoke `smoke-gnome-nautilus-interactions.mjs` |
| `mainMenu-data-cinnamon.js` hors Mint | Structure menu Cinnamon sur GNOME | scan skin GNOME |

---

## Voir aussi

- [contrib.md § Cinnamon](../../contrib.md#5-cinnamon--linux-mint)
- [politique-assets.md](politique-assets.md)
- [apps-linux-par-distro.md](apps-linux-par-distro.md)
