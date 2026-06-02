# Bibliothèques graphiques Linux — guide agents CapsuleOS

Document **opérationnel** pour les agents (`os-linux`, `role-integrator`, `role-web-designer`, `role-graphic-artist`) qui modifient l’UX/CSS des huit bureaux Linux simulés. Ce n’est pas une encyclopédie GTK/Qt : chaque section est ancrée dans les chemins, variables et gabarits réels du dépôt.

**Compléments obligatoires** : [root/docs/apps-linux-par-distro.md](root/docs/apps-linux-par-distro.md) (IDs `data-link`, menus), [usr/share/capsuleos/linux/explorers/README.md](usr/share/capsuleos/linux/explorers/README.md) (explorateurs), [root/AGENTS.md](root/AGENTS.md) (choix des skills).

---

## 1. Modèle CapsuleOS (rappel)

| Couche | Chemin | Rôle |
|--------|--------|------|
| Façade URL | `OS/linux/families/<famille>/<distro>/` | Entrée stable ; **ne pas** y ajouter de README dev |
| Skin actif | `home/<Vendor>/<Distro>/` | `style/`, `media/`, tokens shell, `*.skin.css` |
| Apps HTML | `usr/share/capsuleos/linux/apps/` | Gabarits partagés (`nemo` = slot explorateur, `terminal.html`, …) |
| Explorateurs | `usr/share/capsuleos/linux/explorers/` | `nemo/`, `dolphin/`, `nautilus/`, variantes GNOME/COSMIC |
| Noyau JS | `usr/lib/capsuleos/shells/linux/` | Fenêtres, menus, terminal, `contentLoader.js` |
| Variables globales | `usr/share/capsuleos/themes/global/variables.css` | `--head`, couleurs portail |
| Variables Linux | `usr/share/capsuleos/themes/linux/variables-linux.css` | Tailles fenêtres `--win-*` |
| Embed offline | `var/lib/capsuleos/generated/capsule-app-embed.js` | Régénérer après changement gabarit/skin |

**Chaîne CSS type** (dans `style/imports.css` de chaque skin) :

```
reset.css → variables.css → variables-linux.css → tokens shell (*-tokens.css) → shell chrome → apps *.skin.css (injectés)
```

**Scoping obligatoire** : presque toutes les surcharges skin utilisent `body#<skin>` ou `html:has(#<skin>)`. Ne jamais styliser une app globalement sans ce préfixe — un correctif Ubuntu ne doit pas casser Mint.

**Identifiants dans `index.html`** :

| Attribut | Exemple | Usage |
|----------|---------|--------|
| `body id` | `mint`, `ubuntu`, `mx-kde` | Sélecteur CSS principal |
| `CAPSULE_EMBED_SKIN_KEY` | `mint`, `mxkde`, `popos` | Clé embed (peut différer de `body id` : MX → `mxkde`) |
| `CAPSULE_EXPLORER_TEMPLATE` | `nemo`, `dolphin`, `nemo-gnome` | Gabarit explorateur |
| `CAPSULE_EXPLORER_DISPLAY_NAME` | `Nemo`, `Dolphin`, `Fichiers` | Titre fenêtre / accessibilité |

---

## 2. Tableau skin ↔ toolkit ↔ composants

| Skin | `body#` | Toolkit réel émulé | Shell CapsuleOS | Explorateur (`CAPSULE_EXPLORER_*`) | Terminal (classe JS) | Menu / lanceur |
|------|---------|-------------------|-----------------|-----------------------------------|----------------------|----------------|
| **Linux Mint** | `mint` | **Cinnamon** (GTK 3, Nemo, Muffin) | Panel bas `footer.css`, fenêtres Mint | `nemo` → **Nemo** | `terminal-window--gnome` | `mainMenu.html` + `mainMenu.skin.css` |
| **Ubuntu 25.10** | `ubuntu` | **GNOME** 46+ (GTK 4, libadwaita, Nautilus « Fichiers ») | `gnome-shell/*`, dock Ubuntu | `nemo-gnome` → **Fichiers** | `terminal-window--gnome` | Overview + dock (`index.html`) |
| **Fedora** | `fedora` | **GNOME Workstation** (Adwaita, Nautilus) | `gnome-shell/*` (tokens Fedora) | `nemo` (slot Nautilus) | `terminal-window--fedora` | Dash + overview |
| **Pop!_OS** | `popos` | **COSMIC** (Rust, pas GTK classique ; UI proche GNOME) | `cosmic-shell/*` | `nemo-cosmic` → **Fichiers COSMIC** | `terminal-window--cosmic` | Dock + grille `#cosmic-applications-grid` |
| **MX Linux KDE** | `mx-kde` | **Plasma** (Qt 5/6, Breeze, Dolphin, Konsole) | `footer.css` + panel KDE | `dolphin` → **Dolphin** | skin Konsole (`terminal.skin.css`) | `content/mainMenu-data.js` + Plasma chrome JS |
| **Debian KDE** | `debian-kde` | **Plasma** (Debian, Discover) | comme MX, `windows.css` partagé openSUSE | `dolphin` | idem | `mainMenu-plasma.js`, menu local |
| **openSUSE** | `opensuse` | **Plasma** Tumbleweed (Breeze clair possible) | `opensuse-desktop.css` | `dolphin` | idem | `mainMenu-kde-chrome.js` |
| **AnduinOS** | `anduinos` | **GNOME-like** (barre basse type Windows 11, GTK apps) | `anduin-shell/*` | `nemo-gnome` → **Fichiers** | minimal (`terminal.skin.css`) | `mainMenu-gnome` + `ANDUIN_MENU_FAVORITES` |

**Gap produit (non simulés aujourd’hui)** : **Xfce** (Thunar, xfwm4), **elementary OS** (Pantheon, Granite HIG), **LXQt**, **UKUI**. Les mentionner uniquement si une nouvelle famille est ajoutée sous `OS/linux/families/`.

---

## 3. GTK / GNOME / libadwaita

**Skins** : `ubuntu`, `fedora`, `anduinos` (shell hybride).

### Identité visuelle à viser

- **Adwaita** : coins ~10–12px, headerbar unifié (titre + contrôles à droite), palette sombre `#2e2e2e` / `#383838`, accent distro (Ubuntu `#E95420`, Fedora bleu, Anduin `#3584e4`).
- **Typographie** : Cantarell / système sans-serif ; labels shell en `#f6f7f9` sur barre sombre.
- **Patterns** : top bar opaque, dock vertical (Ubuntu), overview grille (Fedora/Ubuntu), popovers calendrier/volume partagés (`calendar-popover.css`, `volume-popover.css`).
- **libadwaita** : en vrai OS = widgets `Adw*` ; dans CapsuleOS = **HTML/CSS** qui imite headerbar, listes, switches — pas de binding GTK. Viser les captures **GNOME 46** / Adwaita dark.

### Composants clés CapsuleOS

| Composant réel | Nom UI officiel | ID / gabarit | Fichiers skin typiques |
|--------------|-----------------|--------------|------------------------|
| Nautilus | **Fichiers** (Ubuntu), **Files** (EN) | `data-link="nemo"` + template `nemo-gnome` ou `nemo` | `style/apps/nautilus.skin.css`, `nemo.skin.css` |
| gnome-terminal | **Terminal** | `terminal` | `style/apps/terminal.skin.css` + classe `terminal-window--gnome` ou `--fedora` |
| GNOME Software | **Ubuntu Software** / **Software** | `update_manager` | `update_manager.skin.css` ; override `update_manager_ubuntu.html` (Ubuntu) |
| Paramètres | **Settings** | `themes` | `themes.skin.css` |
| Menu apps | **Overview** / grille | `mainMenu` | `gnome-shell/overview.css`, `mainMenu.skin.css` |

### Variables CSS projet

- **Globales** : `usr/share/capsuleos/themes/linux/variables-linux.css` (`--win-*`).
- **Ubuntu** : `home/Debian/Ubuntu/style/gnome-shell/ubuntu-tokens.css` — préfixe `--ubuntu-*` (`--ubuntu-window-radius`, `--ubuntu-app-surface`, `--menu-accent: #E95420`).
- **Fedora** : `home/RedHat/Fedora/style/gnome-shell/tokens.css` — même famille de noms, valeurs Fedora.
- **AnduinOS** : `home/Debian/AnduinOS/style/anduin-shell/tokens.css` — `--anduin-*`, `--taskbar-height`.

Surcharges thème clair : `html[data-theme="light"]:has(#ubuntu)` (et équivalents) dans les fichiers tokens.

### Fichiers à modifier (ordre de priorité)

1. `style/imports.css` — ordre des `@import` shell.
2. `style/gnome-shell/windows-chrome.css` — boutons fenêtre, ombres.
3. `style/apps/<app>.skin.css` — contenu iframe app.
4. `index.html` — raccourcis dock/overview, `CAPSULE_TEMPLATE_OVERRIDES`.

### Pièges

- Copier des règles **sans** `body#ubuntu` / `html:has(#ubuntu)` → régression sur Mint/KDE.
- Confondre **`nemo`** (ID slot) et **Nemo** (app Cinnamon) : sous GNOME le slot s’appelle toujours `nemo` mais le template est `nemo-gnome` / `nautilus`.
- Oublier **`CAPSULE_EMBED_SKIN_KEY`** : les `.skin.css` embarqués sont filtrés par cette clé.
- **Fedora** utilise `terminal-window--fedora` (pas `--gnome`) — vérifier `usr/lib/capsuleos/shells/linux/terminal/terminal.js`.

### Références visuelles

- Icônes : templates **Adwaita** dans `media/img/apps/overview/org.gnome.*.svg`.
- Explorer : symboles `-symbolic` dans `media/img/elements/nemo/` (Ubuntu).

---

## 4. COSMIC (Pop!_OS)

**Skin** : `home/Debian/PopOS/` — toolkit **COSMIC** (System76), pas GTK3 Cinnamon ni Plasma pur.

### Identité visuelle

- Accent **cyan** `#62d0e9`, dock flottant centré, barre haute compacte, coins ~11px, surfaces `#121214` / `rgba(30,30,34)`.
- Grille apps avec catégories `data-cosmic-category` ; nommage UI **« … COSMIC »** (Fichiers COSMIC, Terminal COSMIC, Store → `update_manager`).

### Composants CapsuleOS

| Réel | UI | Template / ID |
|------|-----|----------------|
| cosmic-files | Fichiers COSMIC | `nemo-cosmic`, `nautilus.skin.css` |
| cosmic-term | Terminal COSMIC | `terminal` + `terminal-window--cosmic` |
| pop-shop | Pop!_Shop | `update_manager` |
| cosmic-settings | Paramètres COSMIC | `themes` |

### Variables

- `style/cosmic-shell/popos-tokens.css` : `--popos-accent`, `--popos-dock-*`, `--popos-panel-*`.
- Fichiers chrome : `cosmic-shell/dock.css`, `launcher.css`, `applications.css`, `windows-chrome.css`.

### Pièges

- Ne pas appliquer les tokens **Ubuntu** (`--ubuntu-*`) au body `#popos`.
- La grille apps est dans **`index.html`** (`#cosmic-applications-grid`), pas dans `mainMenu-data.js`.
- Catalog JS : `js/cosmic-apps-catalog.js` pour libellés cohérents.

---

## 5. Cinnamon / Linux Mint

**Skin** : `home/Debian/Mint/` — **GTK 3** + **Cinnamon** (Muffin WM, thème **Mint-Y**).

### Identité visuelle

- Panel **bas** vert/gris Mint, coins fenêtre plus carrés que GNOME 46, ombre `--frame`.
- **Mint-Y** : surfaces menu `#` variables `--menuDefaultCcol`, texte desktop `--desktop-shortcut-*`.
- Nemo : barre d’outils classique GTK, pas headerbar Adwaita stricte.

### Composants

| Réel | UI | Notes |
|------|-----|--------|
| **Nemo** | Nemo | `CAPSULE_EXPLORER_TEMPLATE = 'nemo'` |
| gnome-terminal (sur Mint) | Terminal | `terminal-window--gnome` dans `terminal.skin.css` |
| xed | Éditeur de texte | `text_editor` (souvent non épinglé — voir roadmap) |
| mintupdate | Gestionnaire de mises à jour | `update_manager` |
| muffin | (WM) | Émulé par `windows.css` + panel, pas de WM séparé |

### Variables / fichiers

- Peu de fichier `*-tokens.css` : tokens souvent dans `style/style.css` et variables globales Mint.
- Shell : `footer.css`, `windows.css`, `calendar-popover.css`, `volume-popover.css`.
- Apps : `style/apps/*.skin.css` (un fichier par `data-link`).

### Pièges

- Mint est le **skin noyau historique** : `usr/lib/capsuleos/shells/linux/mainMenu-data.js` sert de défaut — une modif menu peut impacter d’autres distros si mal scopée.
- Le gabarit `themes.html` affiche **Mint-Y** : ne pas renommer sans mettre à jour la coquille partagée.

---

## 6. Qt / KDE Plasma

**Skins** : `mx-kde`, `debian-kde`, `opensuse` — **Qt 6**, **Breeze**, **Plasma** panel.

### Identité visuelle

- Accent **bleu Plasma** `#3daee9`, chrome plat, **coins faibles** (~5px), ombres nettes `0 4px 14px rgba(0,0,0,.45)`.
- **Breeze sombre** (MX, Debian-KDE) vs **Breeze clair** (openSUSE — voir commentaire `dolphin.skin.css` / `opensuse-desktop.css`).
- Fenêtres : boutons minimiser/maximiser/fermer **à droite** du titre ; règles dans `style/windows.css` scoppées `body#mx-kde`, `body#debian-kde`, `body#opensuse`.

### Composants

| Réel | UI | CapsuleOS |
|------|-----|-----------|
| **Dolphin** | Dolphin | template `dolphin`, slot `data-link="nemo"` |
| **Konsole** | Konsole | `terminal.skin.css` (pas de classe `--gnome`) |
| **Discover** | Discover | `update_manager_kde.html` via `CAPSULE_TEMPLATE_OVERRIDES` |
| **System Settings** | Paramètres système | `themes` |
| Menu Plasma | Application Launcher | `mainMenu.skin.css` + `mainMenu-kde-chrome.js` / `mainMenu-plasma.js` |

### Variables

- Explorateur : `usr/share/capsuleos/linux/explorers/dolphin/base.css` — préfixe `--dolphin-*` sur `div[data-link="nemo"]`.
- Surcharges skin : `style/apps/dolphin.skin.css` (dernier dans la chaîne injectée par `contentLoader.js`).

### Fichiers par skin

| Skin | Tokens / shell | Spécificité |
|------|----------------|-------------|
| MX-KDE | `footer.css`, `windows.css` | `CAPSULE_EMBED_SKIN_KEY = 'mxkde'` |
| Debian-KDE | `windows.css` (dupliqué depuis openSUSE) | Menu `./apps/mainMenu.html` override |
| openSUSE | `opensuse-desktop.css` | Tray Breeze, Dolphin clair |

### Pièges

- **`body#mx-kde`** vs clé embed **`mxkde`** : deux identifiants différents, tous deux requis.
- Exclure Nemo du chrome KDE : sélecteurs `:not([data-link="nemo"])` dans `windows.css` — ne pas retirer sans test Dolphin.
- Discover : template KDE séparé ; régénérer embed si le HTML partagé change.

---

## 7. Autres toolkits (pertinence CapsuleOS)

| Toolkit | Statut dépôt | Note agent |
|---------|--------------|------------|
| **libhandy** | Non utilisé | GTK 3 mobile/HIG ; AnduinOS et GNOME sont en CSS « desktop », pas de `.hdy-*`. |
| **elementary / Granite** | Absent | Pas de skin Pantheon ; icônes personnalisées seulement si nouveau skin `home/.../`. |
| **Xfce** | Absent | Thunar/Xfwm4 non mappés — gap documenté pour roadmap. |
| **LXQt** | Absent | — |
| **WPF / WinUI** | Hors scope | Voir `os-windows`. |

---

## 8. Explorateurs : nommage officiel vs code

| Template `CAPSULE_EXPLORER_TEMPLATE` | Affichage utilisateur typique | Stack |
|--------------------------------------|------------------------------|--------|
| `nemo` | Nemo | Cinnamon |
| `nemo-gnome` | Fichiers | GNOME |
| `nemo-cosmic` / `nautilus-cosmic` | Fichiers COSMIC | COSMIC |
| `nautilus` | Fichiers / Files | GNOME (Fedora) |
| `dolphin` | Dolphin | KDE |

Le **registre** est dans `usr/lib/capsuleos/shells/linux/explorers/explorer-registry.js`. Les fichiers `usr/share/capsuleos/linux/apps/nemo.html` sont **dépréciés**.

---

## 9. Apps partagées et skins `.skin.css`

Gabarits : `usr/share/capsuleos/linux/apps/<id>.html` + `usr/share/capsuleos/linux/apps/style/<id>.base.css`.

Injection skin (ordre) :

1. Base app partagée.
2. `home/<Vendor>/<Distro>/style/apps/<id>.skin.css` si présent et clé embed correspondante.

**IDs principaux** : voir tableau dans [apps-linux-par-distro.md](root/docs/apps-linux-par-distro.md).

Overrides HTML par distro (dans `index.html`) :

```javascript
window.CAPSULE_TEMPLATE_OVERRIDES = {
  update_manager: '.../update_manager_ubuntu.html',  // Ubuntu
  update_manager: '.../update_manager_kde.html',     // KDE
  mainMenu: './apps/mainMenu.html'                   // Debian-KDE
};
```

---

## 10. Pièges post-refactor rootfs

1. **Miroir `OS/` ↔ `home/`** : les facades sous `OS/linux/families/` dupliquent souvent les skins ; modifier **les deux** ou le skin canonique documenté dans `role-integrator`.
2. **Embed offline** : après tout changement sous `usr/share/.../apps/`, `explorers/`, `home/public/` ou `*.skin.css` :

   ```bash
   node usr/lib/capsuleos/tools/generate-public-manifest.mjs
   node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs
   ```

3. **`file://`** : sans embed régénéré, les skins affichent d’anciennes coquilles.
4. **HTTP vs embed** : en `http://`, `fetch` charge les fichiers à jour ; pour tester l’offline, `window.CAPSULE_FORCE_APP_EMBED = true`.
5. **Profondeur `CapsuleUserHome.fromRepoDepth(n)`** : si l’arborescence `index.html` bouge, ajuster `n` et les chemins relatifs vers `usr/`.
6. **CSS sans nesting** (règle projet) : pas de `@nest` ; préférer `calc(var(--head) * …)`.
7. **Convention propriétés** : position → display → width → height → margin → padding → border → font → color → background (cf. README racine).

---

## 11. Checklist agent avant modification CSS/UX

- [ ] Skin cible identifié (`body#`, `CAPSULE_EMBED_SKIN_KEY`, famille toolkit).
- [ ] Lecture de [apps-linux-par-distro.md](root/docs/apps-linux-par-distro.md) pour les `data-link` concernés.
- [ ] Gabarit explorateur / terminal correct (`CAPSULE_EXPLORER_TEMPLATE`, classe `terminal-window--*`).
- [ ] Noms UI **officiels de la distro** (ex. « Fichiers » pas « Nemo » sur Ubuntu).
- [ ] Toutes les nouvelles règles préfixées `body#…` ou `html:has(#…)`.
- [ ] Tokens dans le fichier `*-tokens.css` du shell, pas dispersés sans motif.
- [ ] Pas de duplication de gabarits HTML dans le skin (utiliser `usr/share/capsuleos/linux/apps/`).
- [ ] Test navigateur : skin seul + `file://` après rebuild embed si apps touchées.
- [ ] Pas de README ajouté sous `OS/` (règle projet).
- [ ] Skills chargés : `os-linux` + rôle adapté (`role-integrator` / `role-web-designer` / `role-graphic-artist`).

---

## 12. Chemins rapides par skin

| Skin | `home/` | `OS/` miroir |
|------|---------|--------------|
| Mint | `home/Debian/Mint/` | `OS/linux/families/debian/mint/` |
| Ubuntu | `home/Debian/Ubuntu/` | `OS/linux/families/debian/ubuntu/` |
| Pop!_OS | `home/Debian/PopOS/` | `OS/linux/families/debian/popos/` |
| AnduinOS | `home/Debian/AnduinOS/` | `OS/linux/families/debian/anduinos/` |
| MX-KDE | `home/Debian/MX-KDE/` | `OS/linux/families/debian/mx-kde/` |
| Debian-KDE | `home/Debian/Debian-KDE/` | `OS/linux/families/debian/debian-kde/` |
| Fedora | `home/RedHat/Fedora/` | `OS/linux/families/redhat/fedora/` |
| openSUSE | `home/SUSE/openSUSE/` | `OS/linux/families/suse/opensuse/` |

---

## 13. Références externes (validation visuelle)

Utiliser captures officielles ou VM uniquement pour **valider** une passe fidélité — l’implémentation reste HTML/CSS :

- [GNOME HIG](https://developer.gnome.org/hig/) — headerbar, patterns apps GTK 4.
- [KDE Human Interface Guidelines](https://develop.kde.org/hig/) — Breeze, Dolphin, Konsole.
- [Linux Mint style](https://linuxmint.com/) — Cinnamon, Nemo, Mint-Y (marketing / screenshots communauté).
- [System76 COSMIC](https://github.com/pop-os/cosmic) — dock, launcher, identité cyan.

Dossiers captures internes (si présents) : `visuel/`, `visuel/screen/`, références dans commentaires CSS (`réf. visuel/screen/...`).

---

*Dernière mise à jour : juin 2026 — aligné sur les huit skins Linux du dépôt.*
