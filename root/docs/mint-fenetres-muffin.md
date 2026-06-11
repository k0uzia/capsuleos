# Linux Mint Cinnamon — gestion des fenêtres (référence réelle → CapsuleOS)

Document d’étude pour recréer le comportement **Muffin** (WM de Cinnamon) dans le skin P0 **linux-mint**. Complète [convention-contexte-fenetres.md](convention-contexte-fenetres.md) et [contrib.md § Cinnamon](../../contrib.md#5-cinnamon--linux-mint).

## Architecture réelle

| Couche | Rôle |
|--------|------|
| **Muffin** | Gestionnaire de fenêtres (fork Mutter) : cadre, boutons, focus, z-order, tiling, workspaces |
| **Cinnamon** | Shell : panel, applets, raccourcis, paramètres `org.cinnamon.muffin.*` |
| **GTK / apps** | Client-side decorations (CSD) possibles ; Nemo classique = barre WM + menubar app |

CapsuleOS **n’émule pas Muffin** : le noyau `CapsuleWindow` + `CapsuleWindowShell` reproduit un sous-ensemble SSD (single document model).

## Comportements Muffin à reproduire (priorités)

### P0 — Perçu utilisateur Mint

| Comportement réel | Attendu simulé | État CapsuleOS |
|-------------------|----------------|----------------|
| Boutons **min / max / close** à **droite** du titre | `#windowHeader` : nav droite = 3 boutons | OK (`chrome.js`) |
| **Glisser** la fenêtre par la barre titre | Drag sur `#windowHeader` (toutes fenêtres SSD) | OK (`provider cinnamon` + `nemo`) |
| **Redimensionner** les bords | `CapsuleWindowResize` 5 px | OK |
| Fenêtre **active** : bordure / ombre accent Mint | `.windowElementActive` + `--menu-accent` | OK |
| **Clic panel** sur app ouverte → focus | Lanceur `.running-link` + `.active-link` si focus | OK (`taskbar-launcher-state.js`) |
| **Clic panel** sur fenêtre active → **réduire** | Minimize vers panel (pas destroy) | OK (`taskbar-window-list.js`) |
| **Liste des fenêtres** ouvertes sur le panel | Zone entre lanceurs et tray | Branché (`#taskbar-window-list`) |
| **Menu Démarrer** = popup, pas fenêtre SSD | `mainMenu` dans `skipSlots` | OK |
| **Zone de travail** = `object#desktop` moins le panel | `CAPSULE_WINDOW_CONTEXT.bounds` | OK |

### P1 — Fidélité Cinnamon

| Comportement réel | Attendu simulé | État |
|-------------------|----------------|------|
| **Double-clic** barre titre → maximiser | `dblclick` sur `#windowHeader` / poignée | OK (`cinnamon-window-behaviors.js`) |
| **Super+↑** maximiser, **Super+↓** restaurer/minimiser | Raccourcis clavier (optionnel pédagogie) | OK (`cinnamon-window-behaviors.js`) |
| **Tiling** bord écran (½ écran, coins ¼, haut = max) | Drag vers bord → snap | OK (`edge-tiling.js`) |
| **Alt+Tab** (aperçu) | Vignettes + icônes lanceurs | OK (`cinnamon-alt-tab.js`) |
| **Nemo** : une seule barre titre WM au-dessus du contenu | `#windowHeader` + toolbar Nemo | OK (`nemo.skin.css`) |
| **Toutes les apps** : barre Muffin visible (pas de CSD GTK seul) | `data-window-chrome-toolkit="cinnamon"` + `#windowHeader` | OK (`cinnamon-window-chrome.css`, provider `cinnamon`) |
| **Minimiser** = masquer + entrée panel | `display:none` + liste panel | OK si liste branchée |
| **Fermer** = retirer du panel | `closeBtn` + retrait liste | OK |
| Menu contextuel **bureau** (fond) | Clic droit `#desktop` | Branché (`desktop-context-menu.js`) |
| Menu contextuel **barre titre** | Clic droit `#windowHeader` | Branché (`cinnamon-window-behaviors.js`) |

### P2 — Paramètres avancés

- `button-layout` Muffin (`:minimize,maximize,close` par défaut récent)
- « Maximiser au lieu de tile » en haut d’écran (`edge-tiling` / `tile-maximize`)
- « Donner le focus aux fenêtres lancées depuis le terminal »
- Ombrages ouverture / fermeture (effets Cinnamon) — **partiel** : fade/scale Mint (`cinnamon-window-effects.js`)
- Multi-écrans / workspaces

## Cartographie technique CapsuleOS

```
index.html (Mint)
  └─ .windowElement[data-link]     ← fenêtre logique (slot)
       ├─ #windowHeader (injecté)   ← SSD Muffin simulé
       └─ contenu app (embed)       ← Nemo, Firefox, …

Scripts (ordre)
  capsule-window.js → context → shell → windowContainer.js
  taskbar-window-list.js           ← panel Cinnamon
  desktop-context-menu.js          ← bureau
```

| Fichier | Rôle Mint |
|---------|-----------|
| `usr/share/capsuleos/themes/linux/window-chrome.base.css` | Chrome SSD commun (pilot Mint) |
| `home/Debian/Mint/style/windows.css` | Tailles `--win-*` par slot |
| `home/Debian/Mint/style/footer.css` | Lanceurs + tray + horloge |
| `home/Debian/Mint/style/panel-windows.css` | Liste fenêtres panel |
| `home/Debian/Mint/style/cinnamon-window-chrome.css` | Barre Muffin unifiée sur toutes les fenêtres (`data-window-chrome-toolkit="cinnamon"`) |
| `usr/lib/capsuleos/common/window/header-context.js` | Résolution toolkit / provider par profil skin |
| `usr/lib/capsuleos/common/window/chrome.js` | Providers `cinnamon`, `nemo` : drag + injection `#windowHeader` |
| `usr/lib/capsuleos/shells/linux/taskbar-launcher-state.js` | Lanceurs running vs focus |
| `usr/lib/capsuleos/shells/linux/taskbar-window-list.js` | Liste + focus / minimize |
| `usr/lib/capsuleos/shells/linux/cinnamon-window-behaviors.js` | Double-clic titre, Super+flèches |
| `usr/lib/capsuleos/common/window/edge-tiling.js` | Snap bords + coins ¼ (Mint) |
| `usr/lib/capsuleos/shells/linux/cinnamon-alt-tab.js` | Sélecteur Alt+Tab |
| `usr/lib/capsuleos/shells/linux/cinnamon-window-effects.js` | Animations ouverture / fermeture |
| `home/Debian/Mint/style/window-effects.css` | Keyframes animations |
| `home/Debian/Mint/style/alt-tab.css` | Styles sélecteur |

## Barre titre Muffin — toutes les fenêtres

Sur Mint, **chaque** `.windowElement` hors `mainMenu` reçoit :

1. `#windowHeader` injecté par `CapsuleWindowChrome`
2. `data-window-chrome-toolkit="cinnamon"` et `data-window-chrome-provider` (`cinnamon` ou `nemo`)
3. Styles communs dans `home/Debian/Mint/style/cinnamon-window-chrome.css` (flex colonne, boutons Cinnamon, drag sur la barre WM)

| Provider | Slots | Drag |
|----------|-------|------|
| `cinnamon` | Firefox, Terminal, Calculatrice, File Roller, Update Manager, … | `#windowHeader` |
| `nemo` | Explorateur (`nemo`) | `#windowHeader` (barre unifiée, pas de menubar Nemo) |

**File Roller** : retour au modèle SSD Muffin + toolbar GTK en dessous (plus de CSD avec boutons dans la headerbar app).

Smoke lab : `node usr/lib/capsuleos/tools/lab/smoke-mint-window-chrome.mjs` · parité VM : [`linux-mint-window-chrome-vm.md`](inventaires/linux-mint-window-chrome-vm.md) + `smoke-mint-window-chrome-parity.mjs`

## Cas Nemo (double chrome)

**Réel :** Muffin dessine **un** cadre ; la zone client commence sous la barre de titre WM ; menubar/toolbar Nemo sont **à l’intérieur**.

**Actuel (P1) :** `#windowHeader` = barre WM Muffin (drag, boutons, double-clic) ; menubar Nemo masquée sur Mint (`nemo.skin.css`) ; toolbar Nemo conservée.

**Fichiers :** `header-context.js`, `chrome.js` (provider `nemo`), `home/Debian/Mint/style/apps/nemo.skin.css`, `cinnamon-window-chrome.css`, `usr/share/capsuleos/linux/apps/style/nemo.base.css`.

**JS :** `fileExplorerHeader.js` n’attache la menubar que si visible ; `resolveRelative()` pour `home/public` depuis la façade.

## Menu principal

Le menu Cinnamon est un **popup** ancré au panel, pas une fenêtre avec SSD. Ne pas appeler `ensureChrome` sur `mainMenu` (`skipSlots`).

## Panel (taskbar)

Structure cible :

```
[Menu] [Nemo] [Firefox] … [Accueil] | [fenêtre1] [fenêtre2] … | [tray] [horloge]
```

- Lanceurs = raccourcis fixes (icônes).
- `taskbar-window-list` = une entrée texte par `.windowElement` visible (hors `mainMenu`).
- Clic : focus ; reclic sur l’actif : minimize (comportement Cinnamon classique).

## Work area (bornes drag / resize)

Équivalent Muffin « monitor work area » :

- Haut : haut du `#desktop` / `main`
- Bas : hauteur moins `#tableau` (panel)

Profil : `etc/capsuleos/profiles/linux-mint.json` (→ `build-skin-profiles.mjs`). Bornes : `object#desktop`, `subtractFooter: false` (le CSS `#desktop` retire déjà la hauteur du panel).

**Façade** `OS/linux/families/debian/mint/index.html` : `<base href="…/home/Debian/Mint/">` + `CAPSULE_SKIN_PROFILE_ID = 'linux-mint'` + `CapsuleUserHome.resolveRelative()` pour les chemins contenu.

## Checklist implémentation agent

1. Lire ce document + ouvrir Mint en VM ou captures [visuel/](visuel/) si disponibles.
2. `node usr/lib/capsuleos/tools/build-embeds-all.mjs` après toucher gabarits.
3. Vérifier `file://` : drag, resize, max, close, panel liste, reclic minimize.
4. `validate-desktop-window-boot.mjs` + smoke manuel.
5. Noter écarts dans une issue / roadmap P1.

## Références externes

- [Cinnamon — projets Linux Mint](https://projects.linuxmint.com/cinnamon/)
- [Muffin (WM)](https://github.com/linuxmint/muffin) — `button-layout`, tiling GSettings
- Paramètres : `org.cinnamon.muffin` (`edge-tiling`, `tile-maximize`, `button-layout`)
- [contrib.md § Cinnamon](../../contrib.md#5-cinnamon--linux-mint)

## Interactions UX (shell Mint)

- CSS : `home/Debian/Mint/style/mint-interactions.css` (panel, bureau, fermer, focus)
- Drag : `#windowHeader` + `requireHeader: true` dans `skin.profile.json` / `linux-mint.json`
- Alt+Tab : `cinnamon-alt-tab.js` + `alt-tab.css` (clic souris sur une vignette)
- Gate : `node usr/lib/capsuleos/tools/validate-interactions-contract.mjs`

## Skills agent

- `capsuleos-distro-linux-mint`
- `capsuleos-vendor-mint`
- `os-linux` + `window-desktop`
