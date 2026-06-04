# Contribuer à CapsuleOS

Guide pour **contributeurs humains** et **agents IA** (Cursor, automations). Objectif : faire évoluer le catalogue (distros, versions, bureaux, vendors) sans dette technique ni régression du noyau.

**Contrat technique** : [`writing.md`](writing.md) (workspace parent si présent) · [checklist contrat](#checklist-contrat-avant-merge-ou-release) (ce fichier)

---

## Démarrage rapide

| Étape | Action |
|-------|--------|
| 1 | Lire ce fichier et la section [Formation agents](#formation-agents-ia) si vous utilisez un agent |
| 2 | `node usr/lib/capsuleos/tools/validate-all.mjs` — baseline locale (**exit 0** attendu avant gros patch) |
| 3 | Travailler sous `CapsuleOS/` uniquement (`home/`, `usr/`, `OS/`, `var/`, `index.html`) |
| 4 | Clôture : si skin Linux (`home/…` ou gabarits `usr/share/capsuleos/linux/apps/`) → `node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs` puis `validate-all.mjs` (échoue si façade pick-os ≠ `home/`) |

Documentation agents détaillée : dossier [`root/`](root/) (skills Cursor, parcours H0–H6).

---

## Formation agents IA

### Règles Cursor (automatiques dans ce workspace)

| Fichier | Rôle |
|---------|------|
| [`.cursor/rules/capsuleos-agent-onboarding.mdc`](.cursor/rules/capsuleos-agent-onboarding.mdc) | Parcours H0–H6, `validate-all`, routage skills, scalabilité |
| [`.cursor/rules/capsuleos-assets.mdc`](.cursor/rules/capsuleos-assets.mdc) | Images uniquement sous `usr/share/capsuleos/assets/` et `home/public/Images/` |

### Parcours obligatoire (H0 → H6)

1. **H0** — [`root/AGENTS.md`](root/AGENTS.md), [checklist contrat](#checklist-contrat-avant-merge-ou-release), [`root/docs/arborescence.md`](root/docs/arborescence.md)
2. **H1** — [`etc/capsuleos/os-registry.json`](etc/capsuleos/os-registry.json), [`root/docs/manifeste-noyau.md`](root/docs/manifeste-noyau.md), [`root/docs/politique-assets.md`](root/docs/politique-assets.md)
3. **H2** — `node usr/lib/capsuleos/tools/validate-all.mjs`
4. **H3** — Skill [`root/skills/onboarding/SKILL.md`](root/skills/onboarding/SKILL.md) puis skill OS + rôle (voir [équipe agentique](root/docs/equipe-agentique.md))
5. **H4** — Nouvel OS : [`root/docs/ajouter-os-scalable.md`](root/docs/ajouter-os-scalable.md)
6. **H5** — Implémentation minimale
7. **H6** — `validate-all.mjs` + regen embed si besoin + test hors ligne

Détail : [`root/docs/parcours-agent.md`](root/docs/parcours-agent.md)

### Comparaison avec un environnement réel (VM / Proxmox)

**Clonage fidèle depuis VM** : [`root/docs/procedure-clonage-os-depuis-vm.md`](root/docs/procedure-clonage-os-depuis-vm.md) — inventaire ground truth, assets, panel, apps, FS simulé ; modèle **linux-mint** en annexe.

**Procédure complète (contrôle agent + toutes distributions)** : [`root/docs/procedure-controle-distributions-reelles.md`](root/docs/procedure-controle-distributions-reelles.md) — parc VM, SSH, sonde JSON, inventaire lab, comparateur CapsuleOS ↔ réel. **noVNC seul ne suffit pas** pour l’automatisation P0.

Pour qu’un agent **voie et compare** Cinnamon, Nemo, le panel, etc. avec CapsuleOS (secours visuel / Proxmox) :

| Prérequis | Action |
|-----------|--------|
| **CapsuleOS local** | `python3 -m http.server 5500 --bind 127.0.0.1` → URL du skin actif (ex. `home/Debian/Mint/index.html` après recréation clone ; voir [`procedure-clonage-os-depuis-vm.md`](root/docs/procedure-clonage-os-depuis-vm.md)) |
| **VM de référence** | Linux Mint Cinnamon (live ou installé) accessible en **noVNC** depuis la machine où tourne Cursor |
| **Certificat Proxmox** | Ouvrir une fois `https://<ip>:8006` dans le **navigateur intégré Cursor** et accepter le certificat (sinon `chrome-error://chromewebdata/`) |
| **Console noVNC** | Laisser l’onglet ouvert sur l’URL du type `…?console=kvm&novnc=1&vmid=…&vmname=Mint&node=…` |
| **État préparé** | Ouvrir manuellement les apps à comparer (Nemo, Firefox, Terminal) **avant** de demander la comparaison — les clics noVNC automatisés restent imprécis |
| **Embed à jour** | Après modification des gabarits `usr/share/capsuleos/linux/apps/*.html` : `node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs` |

**Ce que l’agent peut faire seul** : captures d’écran, mesures DOM (`position`, `z-index`, liste `#taskbar-window-list`), `curl` vers Proxmox, comparaison VM ↔ CapsuleOS.

**Ce qui reste manuel** : accepter le certificat HTTPS, **un clic initial au centre du canvas** (capture souris noVNC), préparer l’état de la VM si les clics automatisés échouent.

**Clics noVNC automatisés (navigateur Cursor)** — après focus manuel sur le canvas :

| Cible | Coords screenshot (1024×675) | Viewport cible |
|-------|------------------------------|----------------|
| Centre (focus) | `(512, 340)` | canvas |
| Nemo (panel) | `(84, 627)` | y ≈ 832 |
| Firefox | `(120, 627)` | idem |
| Terminal | `(156, 627)` | idem |

Formule : `ss_x = (canvas.left + vmX) × 1024 / innerWidth` · `ss_y = (canvas.top + vmY) × 675 / innerHeight` · **ne pas dépasser** `ss_y ≈ 638` (bas du canvas). Attendre 2–3 s entre chaque ouverture (live ISO lent). Cible attendue : `<canvas>` (pas `noVNC_mouse_capture_elem`).

**Checklist de parité** (Mint P0) : fenêtres sœurs sous `object#desktop` · cascade à l’ouverture (+28 px/fenêtre) · titres dans `#taskbar-window-list` · drag barre de titre · z-index au focus · sidebar Nemo = navigation interne · **lanceur panel** : focus si app ouverte mais inactive, minimize si déjà active · **liste fenêtres** : clic entrée active = minimize, inactive = focus.

**Écarts connus (P1)** : minimize Cinnamon conserve la fenêtre dans la liste panel (CapsuleOS utilise `display:none`) · clics noVNC automatisés imprécis · Super+↑/↓ et double-clic titre (scripts `cinnamon-window-behaviors.js` partiels).

### Brief par entrée du catalogue

```bash
node usr/lib/capsuleos/tools/print-agent-brief.mjs <id>
node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-elementary --write
node usr/lib/capsuleos/tools/print-agent-brief.mjs --list --tier P2 --status planned
```

Briefs générés : [`root/docs/briefs/`](root/docs/briefs/)

---

## Qualité et gates (sans npm)

Gate **release** unique :

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

Enchaîne :

| Étape | Script | Contrôle |
|-------|--------|----------|
| Assets | `validate-assets-all.mjs` | Zones images, profils skin, CSS, liens |
| Liens / médias | `validate-links-all.mjs` | HTML statique, hubs, CSS `url()`, data-link embed |
| Capsule | `validate-capsule.mjs` | Registre OS, façades actives, chaîne fenêtres multi-vendors (`validate-desktop-window-boot.mjs`), références mortes |
| Qualité | `validate-quality-all.mjs` | JSON canon + **JavaScript ES6 strict** |

Passe liens dédiée : skill [`root/skills/link-routing/SKILL.md`](root/skills/link-routing/SKILL.md) · [`root/docs/routage-donnees-medias.md`](root/docs/routage-donnees-medias.md)

Fenêtres bureau Linux : skill [`root/skills/window-desktop/SKILL.md`](root/skills/window-desktop/SKILL.md) · [`root/docs/convention-contexte-fenetres.md`](root/docs/convention-contexte-fenetres.md)

Contrats UI (effets de bord fenêtres, sélecteurs CSS, variables CSS, interactivité vanilla, **hover/active/focus/drag**) : [`root/docs/contrats-ui-bureau.md`](root/docs/contrats-ui-bureau.md) · gate `validate-ui-contracts-all.mjs` (inclus dans `validate-quality-all.mjs`).

Skills agent (vendor, distribution, version, langage) — générés depuis `os-registry.json` :

```bash
node usr/lib/capsuleos/tools/seed-agent-skills.mjs --write
node usr/lib/capsuleos/tools/validate-agent-skills.mjs
```

Doc : [`root/docs/skills-hierarchie.md`](root/docs/skills-hierarchie.md) · index [`root/skills/_index/SKILL.md`](root/skills/_index/SKILL.md)

Mint — fenêtres Muffin : [`root/docs/mint-fenetres-muffin.md`](root/docs/mint-fenetres-muffin.md)

Après changement de `CAPSULE_WINDOW_CONTEXT` : `node usr/lib/capsuleos/tools/build-skin-profiles.mjs` puis recharger la page (façade ou skin).

```bash
node usr/lib/capsuleos/tools/fix-static-html-asset-urls.mjs   # src/href ./assets → chemins physiques
node usr/lib/capsuleos/tools/validate-links-all.mjs
```

Scripts ciblés : `validate-asset-zones.mjs`, `validate-json.mjs`, `validate-vanilla-js.mjs`, etc. — voir [`root/docs/passe-vanilla-json.md`](root/docs/passe-vanilla-json.md)

---

## Ajouter un OS, une version, un vendor ou un bureau

**Principe** : une entrée dans `os-registry.json` + réutilisation d’un **toolkit** existant + pack **vendor** — pas de fork de `contentLoader` ni de `CapsuleWindow`.

Procédure complète : [`root/docs/ajouter-os-scalable.md`](root/docs/ajouter-os-scalable.md)

Résumé :

1. Enregistrer l’entrée dans `etc/capsuleos/os-registry.json` (et regen pick-os si applicable).
2. Créer `etc/capsuleos/profiles/<id>.json` et `skin.profile.json` (façade + miroir `home/`).
3. Placer les visuels dans `usr/share/capsuleos/assets/images/toolkits/` et `.../vendors/`.
4. Façade `OS/<famille>/.../index.html` — ordre boot : `capsule-resource.js` → `capsule-skin-boot.js` → shell.
5. `validate-all.mjs` ; regen embed Linux si templates/strings modifiés.

Catalogue et toolkits : [`root/docs/repertoire-os.md`](root/docs/repertoire-os.md) · Linux GUI : [toolkits GUI](#bibliotheques-graphiques-linux-toolkits-gui) (ce fichier)

---

## Bibliothèques graphiques Linux (toolkits GUI)


Document **opérationnel** pour les agents (`os-linux`, `role-integrator`, `role-web-designer`, `role-graphic-artist`) qui modifient l’UX/CSS des huit bureaux Linux simulés. Ce n’est pas une encyclopédie GTK/Qt : chaque section est ancrée dans les chemins, variables et gabarits réels du dépôt.

**Compléments obligatoires** : [root/docs/apps-linux-par-distro.md](root/docs/apps-linux-par-distro.md) (IDs `data-link`, menus), [usr/share/capsuleos/linux/explorers/README.md](usr/share/capsuleos/linux/explorers/README.md) (explorateurs), [root/AGENTS.md](root/AGENTS.md) (choix des skills).

---

### 1. Modèle CapsuleOS (rappel)

| Couche | Chemin | Rôle |
|--------|--------|------|
| Façade URL | `OS/linux/families/<famille>/<distro>/` | Entrée stable ; **ne pas** y ajouter de README dev |
| Skin actif | `home/<Vendor>/<Distro>/` | `style/`, `media/`, tokens shell, `*.skin.css` |
| Apps HTML | `usr/share/capsuleos/linux/apps/` | Gabarits partagés (`nemo` = slot explorateur, `terminal.html`, …) |
| Explorateurs | `usr/share/capsuleos/linux/explorers/` | `nemo/`, `dolphin/`, `nautilus/`, variantes GNOME/COSMIC |
| Noyau JS fenêtre | `usr/lib/capsuleos/common/capsule-window.js` | Drag, resize, z-index, maximise, chrome (`window/`, voir README) |
| Shell Linux JS | `usr/lib/capsuleos/shells/linux/` | `windowContainer.js` (tailles `--win-*`, dock), `contentLoader.js`, menus, terminal |
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
| `CAPSULE_KDE_ICONS_BASE` | `../../../usr/share/capsuleos/linux/icons/kde` | Base des icônes Dolphin (skins KDE uniquement) |

---

### 2. Tableau skin ↔ toolkit ↔ composants

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

### 3. GTK / GNOME / libadwaita

**Skins** : `ubuntu`, `fedora`, `anduinos` (shell hybride).

#### Identité visuelle à viser

- **Adwaita** : coins ~10–12px, headerbar unifié (titre + contrôles à droite), palette sombre `#2e2e2e` / `#383838`, accent distro (Ubuntu `#E95420`, Fedora bleu, Anduin `#3584e4`).
- **Typographie** : Cantarell / système sans-serif ; labels shell en `#f6f7f9` sur barre sombre.
- **Patterns** : top bar opaque, dock vertical (Ubuntu), overview grille (Fedora/Ubuntu), popovers calendrier/volume partagés (`calendar-popover.css`, `volume-popover.css`).
- **libadwaita** : en vrai OS = widgets `Adw*` ; dans CapsuleOS = **HTML/CSS** qui imite headerbar, listes, switches — pas de binding GTK. Viser les captures **GNOME 46** / Adwaita dark.

#### Composants clés CapsuleOS

| Composant réel | Nom UI officiel | ID / gabarit | Fichiers skin typiques |
|--------------|-----------------|--------------|------------------------|
| Nautilus | **Fichiers** (Ubuntu), **Files** (EN) | `data-link="nemo"` + template `nemo-gnome` ou `nemo` | `style/apps/nautilus.skin.css`, `nemo.skin.css` |
| gnome-terminal | **Terminal** | `terminal` | `style/apps/terminal.skin.css` + classe `terminal-window--gnome` ou `--fedora` |
| GNOME Software | **Ubuntu Software** / **Software** | `update_manager` | `update_manager.skin.css` ; override `update_manager_ubuntu.html` (Ubuntu) |
| Paramètres | **Settings** | `themes` | `themes.skin.css` |
| Menu apps | **Overview** / grille | `mainMenu` | `gnome-shell/overview.css`, `mainMenu.skin.css` |

#### Variables CSS projet

- **Globales** : `usr/share/capsuleos/themes/linux/variables-linux.css` (`--win-*`).
- **Ubuntu** : `home/Debian/Ubuntu/style/gnome-shell/ubuntu-tokens.css` — préfixe `--ubuntu-*` (`--ubuntu-window-radius`, `--ubuntu-app-surface`, `--menu-accent: #E95420`).
- **Fedora** : `home/RedHat/Fedora/style/gnome-shell/tokens.css` — même famille de noms, valeurs Fedora.
- **AnduinOS** : `home/Debian/AnduinOS/style/anduin-shell/tokens.css` — `--anduin-*`, `--taskbar-height`.

Surcharges thème clair : `html[data-theme="light"]:has(#ubuntu)` (et équivalents) dans les fichiers tokens.

#### Fichiers à modifier (ordre de priorité)

1. `style/imports.css` — ordre des `@import` shell.
2. `style/gnome-shell/windows-chrome.css` — boutons fenêtre, ombres.
3. `style/apps/<app>.skin.css` — contenu iframe app.
4. `index.html` — raccourcis dock/overview, `CAPSULE_TEMPLATE_OVERRIDES`.

#### Pièges

- Copier des règles **sans** `body#ubuntu` / `html:has(#ubuntu)` → régression sur Mint/KDE.
- Confondre **`nemo`** (ID slot) et **Nemo** (app Cinnamon) : sous GNOME le slot s’appelle toujours `nemo` mais le template est `nemo-gnome` / `nautilus`.
- Oublier **`CAPSULE_EMBED_SKIN_KEY`** : les `.skin.css` embarqués sont filtrés par cette clé.
- **Fedora** utilise `terminal-window--fedora` (pas `--gnome`) — vérifier `usr/lib/capsuleos/shells/linux/terminal/terminal.js`.

#### Références visuelles

- Icônes : templates **Adwaita** dans `media/img/apps/overview/org.gnome.*.svg`.
- Explorer : symboles `-symbolic` dans `media/img/elements/nemo/` (Ubuntu).

---

### 4. COSMIC (Pop!_OS)

**Skin** : `home/Debian/PopOS/` — toolkit **COSMIC** (System76), pas GTK3 Cinnamon ni Plasma pur.

#### Identité visuelle

- Accent **cyan** `#62d0e9`, dock flottant centré, barre haute compacte, coins ~11px, surfaces `#121214` / `rgba(30,30,34)`.
- Grille apps avec catégories `data-cosmic-category` ; nommage UI **« … COSMIC »** (Fichiers COSMIC, Terminal COSMIC, Store → `update_manager`).

#### Composants CapsuleOS

| Réel | UI | Template / ID |
|------|-----|----------------|
| cosmic-files | Fichiers COSMIC | `nemo-cosmic`, `nautilus.skin.css` |
| cosmic-term | Terminal COSMIC | `terminal` + `terminal-window--cosmic` |
| pop-shop | Pop!_Shop | `update_manager` |
| cosmic-settings | Paramètres COSMIC | `themes` |

#### Variables

- `style/cosmic-shell/popos-tokens.css` : `--popos-accent`, `--popos-dock-*`, `--popos-panel-*`.
- Fichiers chrome : `cosmic-shell/dock.css`, `launcher.css`, `applications.css`, `windows-chrome.css`.

#### Pièges

- Ne pas appliquer les tokens **Ubuntu** (`--ubuntu-*`) au body `#popos`.
- La grille apps est dans **`index.html`** (`#cosmic-applications-grid`), pas dans `mainMenu-data.js`.
- Catalog JS : `js/cosmic-apps-catalog.js` pour libellés cohérents.

---

### 5. Cinnamon / Linux Mint

**Skin** : `home/Debian/Mint/` — **GTK 3** + **Cinnamon** (Muffin WM, thème **Mint-Y**).

#### Identité visuelle

- Panel **bas** vert/gris Mint, coins fenêtre plus carrés que GNOME 46, ombre `--frame`.
- **Mint-Y** : surfaces menu `#` variables `--menuDefaultCcol`, texte desktop `--desktop-shortcut-*`.
- Nemo : barre d’outils classique GTK, pas headerbar Adwaita stricte.

#### Composants

| Réel | UI | Notes |
|------|-----|--------|
| **Nemo** | Nemo | `CAPSULE_EXPLORER_TEMPLATE = 'nemo'` |
| gnome-terminal (sur Mint) | Terminal | `terminal-window--gnome` dans `terminal.skin.css` |
| xed | Éditeur de texte | `text_editor` (souvent non épinglé — voir roadmap) |
| mintupdate | Gestionnaire de mises à jour | `update_manager` |
| muffin | (WM) | Émulé par `CapsuleWindow` + `windows.css` + panel ; doc [mint-fenetres-muffin.md](root/docs/mint-fenetres-muffin.md) |

#### Variables / fichiers

- Peu de fichier `*-tokens.css` : tokens souvent dans `style/style.css` et variables globales Mint.
- Shell : `footer.css`, `windows.css`, `calendar-popover.css`, `volume-popover.css`.
- Apps : `style/apps/*.skin.css` (un fichier par `data-link`).

#### Pièges

- Mint est le **skin noyau historique** : `usr/lib/capsuleos/shells/linux/mainMenu-data.js` sert de défaut — une modif menu peut impacter d’autres distros si mal scopée.
- Le gabarit `themes.html` affiche **Mint-Y** : ne pas renommer sans mettre à jour la coquille partagée.

---

### 6. Qt / KDE Plasma

**Skins** : `mx-kde`, `debian-kde`, `opensuse` — **Qt 6**, **Breeze**, **Plasma** panel.

#### Identité visuelle

- Accent **bleu Plasma** `#3daee9`, chrome plat, **coins faibles** (~5px), ombres nettes `0 4px 14px rgba(0,0,0,.45)`.
- **Breeze sombre** (MX-KDE par défaut) vs **Breeze clair** (openSUSE, Debian-KDE — thèmes centralisés, voir ci-dessous).
- Fenêtres : boutons minimiser/maximiser/fermer **à droite** du titre ; règles dans `style/windows.css` scoppées `body#mx-kde`, `body#debian-kde`, `body#opensuse`.

#### Composants

| Réel | UI | CapsuleOS |
|------|-----|-----------|
| **Dolphin** | Dolphin | template `dolphin`, slot `data-link="nemo"` |
| **Konsole** | Konsole | `terminal.skin.css` (pas de classe `--gnome`) |
| **Discover** | Discover | `update_manager_kde.html` via `CAPSULE_TEMPLATE_OVERRIDES` |
| **System Settings** | Paramètres système | `themes` |
| Menu Plasma | Application Launcher | `mainMenu.skin.css` + `mainMenu-kde-chrome.js` / `mainMenu-plasma.js` |

#### Variables et centralisation Dolphin

- **CSS** : `usr/share/capsuleos/linux/explorers/dolphin/base.css` (fusion de `layout.css` + `themes.css` + tokens `--dolphin-*` sur `div[data-link="nemo"]`). Copie miroir : `usr/share/capsuleos/linux/apps/style/dolphin.base.css` pour `contentLoader.js` / embed.
- **Thèmes clair / sombre** (`themes.css`, inliné dans `base.css`) :
  - **Clair** : `body#opensuse`, `body#debian-kde`, et `html[data-theme="light"] body#mx-kde`.
  - **Sombre** (défaut) : `body#mx-kde` sans `data-theme="light"`.
- **Icônes** : `usr/share/capsuleos/linux/icons/kde/` (`places32/`, `elements/`, `nemo/`, `mimeTypes/`). Carte unique : `usr/lib/capsuleos/shells/linux/fileExplorer/dolphin-icon-map.js` (chemins logiques `./icons/kde/...`). Chaque skin KDE définit `CAPSULE_KDE_ICONS_BASE = '../../../usr/share/capsuleos/linux/icons/kde'` ; `capsule-resource-url.js` résout `./icons/kde/` vers cette base.
- **Chargement** : `CAPSULE_APPS_BASE` → `dolphin.html` + `style/dolphin.base.css` (+ fusion `nemo.base.css` pour Dolphin). `style/apps/dolphin.skin.css` par skin : stub commenté uniquement (surcharges désactivées).

#### Fichiers par skin

| Skin | Tokens / shell | Spécificité |
|------|----------------|-------------|
| MX-KDE | `footer.css`, `windows.css` | `CAPSULE_EMBED_SKIN_KEY = 'mxkde'` |
| Debian-KDE | `windows.css` (dupliqué depuis openSUSE) | Menu `./apps/mainMenu.html` override |
| openSUSE | `opensuse-desktop.css` | Tray Breeze, Dolphin clair (`body#opensuse`) |

#### Pièges

- **`body#mx-kde`** vs clé embed **`mxkde`** : deux identifiants différents, tous deux requis.
- Exclure Nemo du chrome KDE : sélecteurs `:not([data-link="nemo"])` dans `windows.css` — ne pas retirer sans test Dolphin.
- Discover : template KDE séparé ; régénérer embed si le HTML partagé change.

---

### 7. Autres toolkits (pertinence CapsuleOS)

| Toolkit | Statut dépôt | Note agent |
|---------|--------------|------------|
| **libhandy** | Non utilisé | GTK 3 mobile/HIG ; AnduinOS et GNOME sont en CSS « desktop », pas de `.hdy-*`. |
| **elementary / Granite** | Absent | Pas de skin Pantheon ; icônes personnalisées seulement si nouveau skin `home/.../`. |
| **Xfce** | Absent | Thunar/Xfwm4 non mappés — gap documenté pour roadmap. |
| **LXQt** | Absent | — |
| **WPF / WinUI** | Hors scope | Voir `os-windows`. |

---

### 8. Explorateurs : nommage officiel vs code

| Template `CAPSULE_EXPLORER_TEMPLATE` | Affichage utilisateur typique | Stack |
|--------------------------------------|------------------------------|--------|
| `nemo` | Nemo | Cinnamon |
| `nemo-gnome` | Fichiers | GNOME |
| `nemo-cosmic` / `nautilus-cosmic` | Fichiers COSMIC | COSMIC |
| `nautilus` | Fichiers / Files | GNOME (Fedora) |
| `dolphin` | Dolphin | KDE |

Le **registre** est dans `usr/lib/capsuleos/shells/linux/explorers/explorer-registry.js`. Les fichiers `usr/share/capsuleos/linux/apps/nemo.html` sont **dépréciés**.

---

### 9. Apps partagées et skins `.skin.css`

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

### 10. Pièges post-refactor rootfs

1. **Miroir `OS/` ↔ `home/`** : source de vérité = `home/…/index.html` ; pick-os charge `OS/linux/families/…/index.html` (URL stable + `<base href>` vers `home/`). Après tout patch skin : `node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs` — `validate-all` refuse une façade périmée.
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

### 11. Checklist agent avant modification CSS/UX

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

### 12. Noyau fenêtre (`capsule-window.js`)

| Élément | Chemin |
|---------|--------|
| Modules source | `usr/lib/capsuleos/common/window/*.js` |
| Bundle chargé par les skins | `usr/lib/capsuleos/common/capsule-window.js` |
| Shims compat | `window-drag.js`, `resizeWindow.js` |
| Shell Linux (spécifique distro) | `shells/linux/windowContainer.js` |
| CSS chrome partagé (pilot Mint) | `usr/share/capsuleos/themes/linux/window-chrome.base.css` |

**Ordre scripts bureau** (Linux et autres vendors — réf. macOS Sonoma) : `capsule-window.js` → `resizeWindow.js` → `window-drag.js` → `shells/common/capsule-window-context.js` → `capsule-window-shell.js` → `capsule-desktop-shell.js` → `capsule-window-header-buttons.js` → shell vendor (`windowContainer.js` / `windowManager.js`).

**Contexte fenêtres** : `CapsuleWindowContext` / `CAPSULE_WINDOW_CONTEXT`. Doc : [root/docs/convention-contexte-fenetres.md](root/docs/convention-contexte-fenetres.md). Gate : `node usr/lib/capsuleos/tools/validate-desktop-window-boot.mjs`.

Après modification des modules `window/` :

```bash
node usr/lib/capsuleos/tools/build-capsule-window.mjs
```

Documentation détaillée : [usr/lib/capsuleos/common/window/README.md](usr/lib/capsuleos/common/window/README.md).

**Explorateur — DnD** : `fileExplorerDnD.js` (HTML5, Ctrl = copier), APIs `moveExplorerItem` / `copyExplorerItem` dans `fileExplorerCore.js`.

---

### 13. Chemins rapides par skin

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

### 14. Références externes (validation visuelle)

Utiliser captures officielles ou VM uniquement pour **valider** une passe fidélité — l’implémentation reste HTML/CSS :

- [GNOME HIG](https://developer.gnome.org/hig/) — headerbar, patterns apps GTK 4.
- [KDE Human Interface Guidelines](https://develop.kde.org/hig/) — Breeze, Dolphin, Konsole.
- [Linux Mint style](https://linuxmint.com/) — Cinnamon, Nemo, Mint-Y (marketing / screenshots communauté).
- [System76 COSMIC](https://github.com/pop-os/cosmic) — dock, launcher, identité cyan.

Dossiers captures internes (si présents) : `visuel/`, `visuel/screen/`, références dans commentaires CSS (`réf. visuel/screen/...`).

---

*Dernière mise à jour : juin 2026 — aligné sur les huit skins Linux du dépôt.*
---

## Assets et images

Zones autorisées **uniquement** :

- `usr/share/capsuleos/assets/`
- `home/public/Images/`

Chemins logiques dans le code : `./assets/...` (résolu par `CapsuleResource`).

**Interdit** : `OS/*/media/`, `home/*/media/img/`, `usr/share/capsuleos/branding/icons/` (legacy).

Doc : [`root/docs/politique-assets.md`](root/docs/politique-assets.md)

---

## JavaScript (ES6 strict)

- Pas de `import` / `export` dans le JS chargé par le navigateur.
- Pas de optional chaining (`?.`), nullish (`??`), ni object spread (`{...x}`) dans le runtime.
- Autorisés : `[...arr]`, `fn(...args)`, destructuring rest, `'use strict'` dans les IIFE.
- Outils Node sous `usr/lib/capsuleos/tools/*.mjs` hors périmètre navigateur.

---

## Embeds offline

Après changement de gabarits ou de `home/public/` :

Gate unique (recommandé) :

```bash
node usr/lib/capsuleos/tools/build-embeds-all.mjs
```

Ou ciblé :

```bash
node usr/lib/capsuleos/tools/generate-public-manifest.mjs
node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs   # → var/lib/capsuleos/generated/capsule-app-embed.js
node usr/lib/capsuleos/tools/build-android-embed.mjs      # → OS/android/js/capsule-android-embed.js
node usr/lib/capsuleos/tools/build-embeds-all.mjs --linux-only
```

---

## Documentation : où écrire quoi

| Sujet | Emplacement |
|-------|-------------|
| Guide contributeur, checklist contrat, toolkits Linux GUI | `contrib.md` à la racine |
| Agents, skills, parcours | `root/` |
| Doc développeur sous `OS/` | **Interdit** (`README.md`, etc.) — utiliser `root/docs/` |
| Politique assets | `root/docs/politique-assets.md` |
| Roadmap / Phase 0.5 | `root/docs/roadmap.md` |

---

## Skills Cursor (index)

| Besoin | Skill |
|--------|--------|
| Première intervention | `onboarding` |
| Migration assets | `kernel-supervisor` + `asset-pipeline` |
| Linux | `os-linux` |
| OS inconnu | `os-orchestrator` |
| Intégration skin | `role-integrator` |
| Liens / médias cassés | `link-routing` |
| Code / ES6 | `role-developer` + `code-quality` |
| Multi-familles | `coordinator` |

Index complet : [`root/README.md`](root/README.md)

---

## Checklist contrat (avant merge ou release)

À utiliser avant merge ou release (revue manuelle ou automatisée partielle). Alignement avec `writing.md` / contrat stack du workspace parent.

### Stack

- [ ] HTML5, CSS3, JavaScript **ES6 strict** pour l’implémentation utilisateur (`node usr/lib/capsuleos/tools/validate-vanilla-js.mjs`).
- [ ] Aucun framework front, aucune lib UI externe, aucun préprocesseur CSS.
- [ ] Aucun code serveur requis pour l’exécution normale du site.
- [ ] Aucune dépendance imposant un chargement réseau obligatoire pour l’usage principal.

### HTML / CSS

- [ ] HTML sémantique ; `div` évité lorsqu’une balise plus précise existe.
- [ ] Ordre des propriétés CSS conforme au contrat (position → … → z-index).
- [ ] Styles centralisés ; variables CSS réutilisées avant d’en ajouter de nouvelles.

### JavaScript

- [ ] Logique mutualisée ; pas de duplication inutile ; pas de couplage fort entre OS simulés.

### Offline

- [ ] Le site reste utilisable hors ligne après chargement initial (Service Worker + cache ; tester en coupant le réseau sur localhost).
- [ ] Ouverture locale `file://` : `capsule-app-embed.js` / `capsule-android-embed.js` à jour si les gabarits ou JSON embarqués ont changé ; vérifier un bureau Linux et Android sans serveur.

### Agents / release

- [ ] `node usr/lib/capsuleos/tools/validate-all.mjs` → exit 0 avant merge significatif.
- [ ] Nouvel OS : [root/docs/ajouter-os-scalable.md](root/docs/ajouter-os-scalable.md) suivi ; entrée `os-registry.json`.

### Structure

- [ ] Arborescence lisible ; séparation noyau commun / variantes OS respectée.
- [ ] Aucun lien symbolique versionné dans le dépôt ; skins dérivées sans `media/` local déclarent `CAPSULE_MEDIA_BASE` (et `CAPSULE_ASSETS_BASE` si besoin) avant `capsule-resource-url.js`.
- [ ] Pas de doc développeur nouvelle sous `OS/` (`README.md`, `UI-FIDELITE.txt`, `ICONS-*.md`, etc.) — uniquement sous `.doc/` (miroir) ; voir `.cursor/rules/capsuleos-doc-location.mdc`.

### Linux (CapsuleOS / `OS/linux`)

- [ ] `CAPSULE_APPS_BASE`, `CAPSULE_CONTENT_ROOT`, `CAPSULE_SKIN_BASE`, `CAPSULE_EMBED_SKIN_KEY` définis avant les scripts noyau ; `capsule-app-embed.js` chargé avant `contentLoader.js` ; `strings-default.js` et `capsule-strings.js` chargés avant `contentLoader.js`.
- [ ] Slot explorateur `data-link="nemo"` : template résolu via `CAPSULE_EXPLORER_TEMPLATE` (`nemo`, `dolphin`, `nautilus`, …) sans dupliquer la logique dans `fileSystem.js`.
- [ ] Textes surchargeables : défauts dans `kernel/js/strings-default.js`, option `./content/strings.json` par skin.
- [ ] Hub statique `OS/linux/index.html` à jour pour les distros listées ; pas de backend requis.

---

## Interdits (rappel)

- Fork noyau par distro.
- Images hors zones autorisées.
- README ou doc dev nouvelle sous `OS/`.
- Merge significatif sans `validate-all` vert.
- Codemod `rewrite-es6-strict.mjs` (fragile) — corrections manuelles + validateur.

---

## Liens utiles

- [README.md](README.md) — présentation projet
- [root/docs/scalabilite-noyau.md](root/docs/scalabilite-noyau.md) — scale statique
- [root/docs/equipe-agentique.md](root/docs/equipe-agentique.md) — staffing agents
- [Service Worker](sw.js) — mode hors ligne
