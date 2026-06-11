---
name: capsuleos-os-linux
description: Expert on CapsuleOS simulated Linux desktops—Debian, Red Hat, SUSE families, kernel, explorers, home/public, embeds. Use for Mint, Ubuntu, Fedora, openSUSE, KDE/Cinnamon/GNOME skins, or Linux kernel JS under OS/linux and usr/lib/capsuleos/shells/linux.
---

# OS Linux (CapsuleOS)

## Arborescence

| Zone | Chemin |
|------|--------|
| Façades | `OS/linux/families/debian|redhat|suse/<distro>/index.html` |
| Noyau JS/CSS | `usr/lib/capsuleos/common/` · `usr/lib/capsuleos/shells/linux/` |
| Skins | `home/Debian/`, `home/RedHat/`, `home/SUSE/` |
| Apps partagées | `usr/share/capsuleos/linux/apps/` |
| Explorateurs | `usr/share/capsuleos/linux/explorers/` |
| Shell logic | `usr/lib/capsuleos/shells/linux/` |
| FS utilisateur | `home/public/` + `.capsule-manifest.json` |
| Embed offline | `var/lib/capsuleos/generated/capsule-app-embed.js` |

## Familles (writing.md)

- **Debian** : mint, ubuntu, popos, debian-kde, mx-kde, anduinos, …
- **Red Hat** : fedora
- **SUSE** : opensuse
- **Arch / Slackware** : prévus sous `OS/linux/families/` — suivre le pattern existant

## Explorateurs

Templates : `nemo`, `dolphin`, `nautilus`, `nemo-gnome`, `nemo-cosmic`, `nautilus-cosmic`. Registre : `usr/lib/capsuleos/shells/linux/explorers/explorer-registry.js`. Doc : `usr/share/capsuleos/linux/explorers/README.md`.

## Variables skin (exemple)

```html
window.CAPSULE_CONTENT_ROOT = CapsuleUserHome.resolveRelative();
window.CAPSULE_EXPLORER_TEMPLATE = 'nemo';
window.CAPSULE_EMBED_SKIN_KEY = 'mint';
```

Contrats UI bureau : [contrats-ui-bureau.md](../../docs/contrats-ui-bureau.md) · gate `validate-ui-contracts-all.mjs`.

## Build après changement

```bash
node usr/lib/capsuleos/tools/generate-public-manifest.mjs
node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs
```

## Panel / menu Mint (v3 — anti-patterns retirés)

| Éviter | Remplacer par |
|--------|----------------|
| `footer.css` + `panel-windows.css` dupliqués | `home/Debian/Mint/style/mint-panel.css` |
| `--taskbar-height` hérité portal (1.25×head) | `--mint-panel-height: 40px` dans `mint-y-dark-aqua-tokens.css` |
| `mainMenu.skin.css` injecté dynamiquement seul | Chaîne statique `imports.css` + `CAPSULE_STATIC_SKIN_SLOTS: ["mainMenu"]` |
| Layout menu en JS (`mint-menu-parity` DOM/CSS) | `mainMenu.skin.css` grille 20/25/55 % ; parity = données FR uniquement |
| Lanceurs panel fixes / checklist dans le HTML | Noyau `taskbar-window-list.js` + adaptateurs tray/favoris |

## Checkpoints post-clonage VM

Après import assets / skin :

```bash
node usr/lib/capsuleos/tools/validate-clone-assets.mjs --id linux-mint
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
python3 -m http.server 5500 --bind 127.0.0.1
node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --id linux-mint
```

Voir [procedure-clonage-os-depuis-vm.md](../../docs/procedure-clonage-os-depuis-vm.md) §7–8 et [agent-validation-discipline.md](../../docs/agent-validation-discipline.md).

## Fenêtres (drag / resize)

Skill **`window-desktop`** + [convention-contexte-fenetres.md](../../docs/convention-contexte-fenetres.md). Gate : `validate-linux-window-boot.mjs`.

## Toolkits graphiques (GTK, Qt, Cinnamon, COSMIC)

Avant toute passe CSS/UX sur un skin Linux : [contrib.md § toolkits](../../../contrib.md#bibliotheques-graphiques-linux-toolkits-gui) (tableau skin ↔ toolkit, tokens, pièges embed).

## Toolkit Cinnamon (Linux Mint)

**Mint ≠ GNOME Shell.** Avant toute passe menu/assets/chrome sur `home/Debian/Mint/` :

| Règle | Valeur Mint |
|-------|-------------|
| Toolkit | `cinnamon` (profil + registre) |
| Menu data | `mainMenu-data-cinnamon.js` uniquement |
| Icônes lanceurs | `./assets/images/toolkits/cinnamon/apps/` |
| Explorateur | template `nemo`, pas `nemo-gnome` |
| WM | `cinnamon-window-behaviors.js` |

Doc : [paradigme-toolkit-cinnamon.md](../../docs/paradigme-toolkit-cinnamon.md) · audit : [linux-mint-cinnamon-vs-gnome-audit.md](../../docs/inventaires/linux-mint-cinnamon-vs-gnome-audit.md).

```bash
node usr/lib/capsuleos/tools/linux/sync-cinnamon-app-icons.mjs
node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --id linux-mint
```

Exceptions légitimes : classes `gnome-*` sur apps GTK partagées (calculator, terminal, screenshot) — voir audit §4.

## Toolkit GNOME (GTK 4 + libadwaita)

Distros `toolkit: gnome` (Ubuntu, Fedora, Rocky, AnduinOS) : charger **`gnome-hig-replication`** + [gnome-hig-ressources.md](../../docs/gnome-hig-ressources.md). Inventaire crawl : `root/docs/inventaires/gnome-hig-resources.json`.

**Ne pas** appliquer les patterns GNOME Shell (overview, dash `toolkits/gnome/apps/dash`) au skin Mint.

## Toolkit KDE (Plasma + Qt/Kirigami)

Distros `toolkit: kde` : charger **`kde-hig-replication`** + [kde-hig-ressources.md](../../docs/kde-hig-ressources.md). Inventaire crawl : `root/docs/inventaires/kde-hig-resources.json`. Branche : [branche-plasma-kde.md](../../docs/branche-plasma-kde.md).

## Manifeste distribution (tous vendors Linux)

Avant import assets massif : skill **`vm-distribution-manifest`** → `run-manifest-replication-chain.mjs --id <registryId>`.  
Sorties : `proc/<id>/distribution-manifest.json`, playbook, staging → `usr/share/capsuleos/assets/` via `manifest.media.iconPack`.

## Ajouter une distro / version / vendor

Avant toute création : skill `onboarding` → [ajouter-os-scalable.md](../../docs/ajouter-os-scalable.md).  
Scaffold catalogue : `ensure-vm-manifest-vendor.mjs --write`. Gate : `validate-all.mjs`.

## Rôles fréquents

`role-integrator`, `role-developer`, `role-web-designer`.
