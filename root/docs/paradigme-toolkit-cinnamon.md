# Paradigme toolkit Cinnamon — Linux Mint

> **Statut** : référence architecturale pour le skin `linux-mint`.  
> Complète [contrib.md § Cinnamon](../../contrib.md#5-cinnamon--linux-mint) et [politique-assets.md](politique-assets.md).

Linux Mint n’utilise **pas** GNOME Shell. Le bureau est **Cinnamon** (Muffin WM, Nemo, mint-* apps). CapsuleOS modélise cela comme un toolkit distinct de `gnome`.

---

## Couches

| Couche | Mint / Cinnamon | Anti-pattern |
|--------|-----------------|--------------|
| **Toolkit** | `cinnamon` | `toolkit: gnome` dans profil / registre |
| **Vendor** | `mint` | Emprunter assets Ubuntu/Fedora |
| **WM** | Muffin → `cinnamon-window-behaviors.js` | `gnome-window-behaviors.js` sur `#mint` |
| **Explorateur** | Nemo, template `nemo`, slot `data-link="nemo"` | `nemo-gnome`, `nautilus`, `nautilusChromeMode` |
| **Menu** | `mainMenu-data-cinnamon.js` uniquement | `mainMenu-data.js`, overview GNOME |
| **Paramètres** | Slot `themes` + `cinnamon-settings.js` 6.6 | `themes_gnome.html`, classe `themes-app--gnome` |
| **Assets shell** | `./assets/images/toolkits/cinnamon/` | `./assets/images/toolkits/gnome/` (sauf § exceptions) |
| **Icônes menu** | `./assets/images/toolkits/cinnamon/apps/` | Pack `gnome/apps` pour lanceurs Mint |
| **Icônes panel** | `./assets/images/vendors/mint/panel/` | Dock GNOME Ubuntu |
| **Chrome fenêtre** | `toolkit-cinnamon/chrome.css`, `data-window-chrome-toolkit="cinnamon"` | Cluster `toolkit-gnome` sur apps Mint |

---

## Chemins assets autorisés

```
./assets/images/toolkits/cinnamon/header/     # boutons fenêtre Muffin
./assets/images/toolkits/cinnamon/elements/nemo/
./assets/images/toolkits/cinnamon/apps/       # lanceurs menu (symlinks ManΣ depuis VM)
./assets/icons/cinnamon/                      # Nemo, cinnamon-settings
./assets/images/vendors/mint/                 # panel, branding
```

Synchronisation icônes menu : `node usr/lib/capsuleos/tools/linux/sync-cinnamon-app-icons.mjs`

---

## Profil skin (`skin.profile.json`)

```json
{
  "toolkit": { "id": "cinnamon", "shell": "cinnamon" },
  "assets": {
    "toolkitPack": "toolkits/cinnamon",
    "vendorPack": "vendors/mint",
    "iconPacks": ["icons/cinnamon"]
  },
  "capsuleGlobals": {
    "CAPSULE_EXPLORER_TEMPLATE": "nemo",
    "CAPSULE_WINDOW_CHROME_CONTEXT": {
      "toolkitId": "cinnamon",
      "explorerTemplate": "nemo"
    }
  }
}
```

Registre : `desktopEnvironment: { id: "cinnamon", version: "6.6", windowManager: "muffin" }`.

---

## Apps GTK partagées (exceptions légitimes)

Mint embarque des apps **GNOME/GTK** dont le gabarit HTML/CSS est partagé. Les **classes DOM** peuvent conserver le préfixe `gnome-*` tant que le chrome fenêtre reste Cinnamon :

| App | Slot | Exception documentée |
|-----|------|-------------------|
| gnome-terminal | `terminal` | `terminal-window--gnome` dans `terminal.skin.css` |
| gnome-calculator | `calculator` | `#gnomeCalculatorApp`, vars `--gnome-calc-*` |
| gnome-screenshot | `screenshot` | `#gnomeScreenshotApp`, vars `--gnome-shot-*` |
| gnome-disks | `gnome_disks` | ID slot + `gnome-disks.js` (nom app upstream) |
| Fonds d’écran | `themes` | JS partagé `themes.js` utilise `.gnome-settings-wallpaper` ; skin Mint alias `.cinnamon-settings-wallpaper` |

Ces exceptions **ne** justifient **pas** l’usage de `toolkits/gnome` pour les icônes menu ni du toolkit GNOME pour le shell.

---

## Gates

```bash
node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --id linux-mint
node usr/lib/capsuleos/tools/validate-clone-assets.mjs --id linux-mint
node usr/lib/capsuleos/tools/print-validation-plan.mjs home/Debian/Mint/
```

Audit détaillé : [inventaires/linux-mint-cinnamon-vs-gnome-audit.md](inventaires/linux-mint-cinnamon-vs-gnome-audit.md).
