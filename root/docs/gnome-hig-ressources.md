# GNOME HIG — ressources officielles pour la reproduction fidèle

> **Public** : agents développant les versions **toolkit GNOME** (Rocky, Fedora, Alma, Ubuntu GNOME, etc.)  
> **Source racine** : [Tools & Resources — GNOME HIG](https://developer.gnome.org/hig/resources.html)  
> **Inventaire machine** : [`inventaires/gnome-hig-resources.json`](inventaires/gnome-hig-resources.json) (crawl récursif, régénérable)  
> **Skill agent** : [`gnome-hig-replication`](../skills/gnome-hig-replication/SKILL.md)

La plateforme GNOME moderne s’appuie sur **GTK 4** et **libadwaita**. Le HIG est la source normative pour apps et patterns UI ; le **GNOME Shell** (top bar, Aperçu) complète via wiki design et captures VM — voir [branche-redhat-gnome.md](branche-redhat-gnome.md).

---

## 1. Méthode de crawl (régénération)

```bash
node root/tools/lab/crawl-gnome-hig-resources.mjs
```

- Point d’entrée : `https://developer.gnome.org/hig/resources.html`
- Parcours récursif de tous les liens `https://developer.gnome.org/hig/*` (pages de contenu, hors `_static/`)
- Liens sortants collectés : apps design Flathub, GitLab GNOME Design, API libadwaita, GTK inspector, templates SVG

Dernière génération : voir champ `crawledAt` dans le JSON.

---

## 2. Arborescence HIG (58 pages de contenu)

### 2.1 Principes et ressources

| Page | URL | Usage CapsuleOS |
|------|-----|-----------------|
| Accueil HIG | https://developer.gnome.org/hig/ | Vue d’ensemble, GTK 4 + libadwaita |
| Design Principles | https://developer.gnome.org/hig/principles.html | Simplicité, effort utilisateur, copy courte |
| **Tools & Resources** | https://developer.gnome.org/hig/resources.html | **Point d’entrée** outils + templates |
| Index | https://developer.gnome.org/hig/genindex.html | Recherche alphabétique |

### 2.2 Guidelines (conventions transverses)

| Page | URL | CapsuleOS |
|------|-----|-----------|
| Guidelines (hub) | https://developer.gnome.org/hig/guidelines.html | — |
| Accessibility | https://developer.gnome.org/hig/guidelines/accessibility.html | `data-contrast-mode`, Orca, focus |
| Scaling & Adaptiveness | https://developer.gnome.org/hig/guidelines/adaptive.html | `data-display-scale`, breakpoints |
| App Icons | https://developer.gnome.org/hig/guidelines/app-icons.html | Grille Aperçu, icônes RL10 |
| App Naming | https://developer.gnome.org/hig/guidelines/app-naming.html | Libellés dash / overview |
| Keyboard | https://developer.gnome.org/hig/guidelines/keyboard.html | Raccourcis shell + apps |
| Navigation | https://developer.gnome.org/hig/guidelines/navigation.html | Structure apps Paramètres |
| Pointer & Touch | https://developer.gnome.org/hig/guidelines/pointer-touch.html | Zones clic, hover |
| **Typography** | https://developer.gnome.org/hig/guidelines/typography.html | `--font-ui`, Red Hat Text |
| UI Icons | https://developer.gnome.org/hig/guidelines/ui-icons.html | Symbolic vs fullcolor, tray |
| UI Styling | https://developer.gnome.org/hig/guidelines/ui-styling.html | Adwaita, coins, élévation |
| Writing Style | https://developer.gnome.org/hig/guidelines/writing-style.html | Placeholders FR (« Saisissez pour rechercher ») |

### 2.3 Patterns — Containers

| Page | URL | CapsuleOS |
|------|-----|-----------|
| Containers (hub) | https://developer.gnome.org/hig/patterns/containers.html | — |
| Windows | https://developer.gnome.org/hig/patterns/containers/windows.html | CSD, ombres Mutter |
| **Header Bars** | https://developer.gnome.org/hig/patterns/containers/header-bars.html | `windows-chrome.css`, Nautilus |
| Popovers | https://developer.gnome.org/hig/patterns/containers/popovers.html | Calendrier, Quick Settings |
| Utility Panes | https://developer.gnome.org/hig/patterns/containers/utility-panes.html | Paramètres GNOME sidebar |
| Boxed Lists | https://developer.gnome.org/hig/patterns/containers/boxed-lists.html | Panneaux `themes` |
| Grid Views | https://developer.gnome.org/hig/patterns/containers/grid-views.html | Fond d’écran, apps grid |
| List & Column Views | https://developer.gnome.org/hig/patterns/containers/list-column-views.html | Nautilus liste |
| Selection & Edit Modes | https://developer.gnome.org/hig/patterns/containers/selection-mode.html | Nautilus multi-sélection |

### 2.4 Patterns — Navigation

| Page | URL | CapsuleOS |
|------|-----|-----------|
| Navigation (hub) | https://developer.gnome.org/hig/patterns/nav.html | — |
| Browsing | https://developer.gnome.org/hig/patterns/nav/browsing.html | NavigationView apps |
| **Search** | https://developer.gnome.org/hig/patterns/nav/search.html | Aperçu `CapsuleAppSearch` |
| Sidebars | https://developer.gnome.org/hig/patterns/nav/sidebars.html | Nautilus Places |
| Tabs | https://developer.gnome.org/hig/patterns/nav/tabs.html | Firefox, Terminal |
| View Switchers | https://developer.gnome.org/hig/patterns/nav/view-switchers.html | Paramètres panneaux |

### 2.5 Patterns — Controls

Hub : https://developer.gnome.org/hig/patterns/controls.html

| Contrôle | URL |
|----------|-----|
| Buttons | https://developer.gnome.org/hig/patterns/controls/buttons.html |
| Menus | https://developer.gnome.org/hig/patterns/controls/menus.html |
| Switches | https://developer.gnome.org/hig/patterns/controls/switches.html |
| Text Fields | https://developer.gnome.org/hig/patterns/controls/text-fields.html |
| Checkboxes | https://developer.gnome.org/hig/patterns/controls/checkboxes.html |
| Radio Buttons | https://developer.gnome.org/hig/patterns/controls/radio-buttons.html |
| Drop-Down Lists | https://developer.gnome.org/hig/patterns/controls/drop-downs.html |
| Sliders | https://developer.gnome.org/hig/patterns/controls/sliders.html |
| Spin Buttons | https://developer.gnome.org/hig/patterns/controls/spin-buttons.html |
| Overlaid Controls | https://developer.gnome.org/hig/patterns/controls/overlaid.html |

### 2.6 Patterns — Feedback

Hub : https://developer.gnome.org/hig/patterns/feedback.html

| Feedback | URL |
|----------|-----|
| Notifications | https://developer.gnome.org/hig/patterns/feedback/notifications.html |
| Toasts | https://developer.gnome.org/hig/patterns/feedback/toasts.html |
| Banners | https://developer.gnome.org/hig/patterns/feedback/banners.html |
| Dialogs | https://developer.gnome.org/hig/patterns/feedback/dialogs.html |
| Progress Bars | https://developer.gnome.org/hig/patterns/feedback/progress-bars.html |
| Spinners | https://developer.gnome.org/hig/patterns/feedback/spinners.html |
| Placeholder Pages | https://developer.gnome.org/hig/patterns/feedback/placeholders.html |
| Tooltips | https://developer.gnome.org/hig/patterns/feedback/tooltips.html |

### 2.7 Reference

| Page | URL | CapsuleOS |
|------|-----|-----------|
| Reference (hub) | https://developer.gnome.org/hig/reference.html | — |
| **Palette** | https://developer.gnome.org/hig/reference/palette.html | Accent `#3584e4` (Blue 3), tokens |
| Backgrounds | https://developer.gnome.org/hig/reference/backgrounds.html | Fonds Adwaita / RL10 |
| Standard Keyboard Shortcuts | https://developer.gnome.org/hig/reference/keyboard.html | Super, Aperçu, workspaces |

---

## 3. Outils et assets (liens depuis Resources)

### 3.1 Apps design (Flatpak)

| App | URL | Rôle |
|-----|-----|------|
| Icon Library | https://flathub.org/apps/details/org.gnome.design.IconLibrary | Icônes UI GNOME |
| Typography | https://flathub.org/apps/details/org.gnome.design.Typography | Styles texte, glyphes |
| Color Palette | https://flathub.org/apps/details/org.gnome.design.Palette | Palette officielle |
| App Icon Preview | https://flathub.org/apps/details/org.gnome.design.AppIconPreview | Icônes apps |
| Symbolic Preview | https://flathub.org/apps/details/org.gnome.design.SymbolicPreview | Icônes symboliques tray |

### 3.2 Toolkit & inspection

| Ressource | URL |
|-----------|-----|
| Adwaita Demo (flatpakref) | https://nightly.gnome.org/repo/appstream/org.gnome.Adwaita1.Demo.flatpakref |
| GTK 4 — lancer + inspector | https://docs.gtk.org/gtk4/running.html |
| libadwaita — variables CSS | https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/css-variables.html |
| libadwaita — style classes | https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/style-classes.html |

### 3.3 Templates & dépôts design

| Ressource | URL |
|-----------|-----|
| GNOME Design (GitLab) | https://gitlab.gnome.org/Teams/Design |
| Mockup resources | https://gitlab.gnome.org/Teams/Design/mockup-resources |
| App icon template (SVG) | https://gitlab.gnome.org/Teams/Design/HIG-app-icons/-/blob/master/template.svg |
| Palette GIMP (GPL) | https://gitlab.gnome.org/Teams/Design/HIG-app-icons/raw/master/GNOME%20HIG.gpl?inline=false |
| HIG sources (GitLab) | https://gitlab.gnome.org/Teams/Websites/developer.gnome.org-hig |
| Fonds Adwaita (XML) | https://gitlab.gnome.org/GNOME/gnome-backgrounds/-/blob/main/backgrounds/adwaita.xml.in |

---

## 4. Compléments CapsuleOS (hors HIG strict)

Le HIG couvre surtout **applications GTK/libadwaita**. Pour le **shell** :

| Besoin | Doc CapsuleOS |
|--------|----------------|
| Top bar, Aperçu, dash | [design-shell-layout](../skills/design-shell-layout/SKILL.md), [branche-redhat-gnome.md](branche-redhat-gnome.md) |
| GNOME Shell design (wiki) | https://wiki.gnome.org/Projects/GnomeShell/Design |
| Expertise stack | [reference-gnome-expert.md](reference-gnome-expert.md) |
| Fidélité typo/vue/MIME | [convention-fidelite-visuelle.md](convention-fidelite-visuelle.md) |
| Composants plateforme | https://developer.gnome.org/components/ |

---

## 5. Matrice rapide surface → pages HIG

| Surface CapsuleOS | Pages HIG prioritaires |
|-------------------|------------------------|
| Top bar + horloge + tray | Typography, UI Icons, Popovers, Reference keyboard |
| Aperçu + recherche | Search, Writing Style, App Icons |
| Dash / grille apps | App Icons, App Naming, Grid Views |
| Quick Settings / volume | Popovers, Switches, Sliders |
| Fenêtres CSD | Windows, Header Bars |
| Nautilus (`nemo`) | Sidebars, List & Column Views, Header Bars |
| Paramètres (`themes`) | Utility Panes, View Switchers, Boxed Lists, Switches |
| Notifications | Notifications, Toasts |
| Tokens couleur | Reference palette, UI Styling, libadwaita css-variables |

---

## 6. Règles agents

1. **Avant** un patch visuel GNOME : identifier la page HIG correspondante dans ce document ou le JSON.
2. **Ground truth** : captures VM + HIG ; en cas de conflit, VM prime pour le shell, HIG pour les apps GTK.
3. **Ne pas** inventer espacements — skill `design-shell-layout` + palette HIG.
4. **Régénérer** l’inventaire JSON après montée de version GNOME majeure (ex. 47 → 48).
