# KDE HIG — ressources officielles pour la reproduction fidèle

> **Public** : agents développant les versions **toolkit KDE / Plasma** (KDE neon, openSUSE, MX-KDE, Debian KDE, etc.)  
> **Source racine** : [KDE Human Interface Guidelines](https://develop.kde.org/hig/)  
> **Inventaire machine** : [`inventaires/kde-hig-resources.json`](inventaires/kde-hig-resources.json) (crawl récursif, régénérable)  
> **Skill agent** : [`kde-hig-replication`](../skills/kde-hig-replication/SKILL.md)

Les apps KDE modernes s’appuient sur **Qt 6**, **Kirigami** et le thème **Breeze**. Le HIG est la source normative pour le design applicatif ; le **Plasma Shell** (panel, Kickoff, widgets) complète via captures VM et [branche-plasma-kde.md](branche-plasma-kde.md).

---

## 1. Méthode de crawl (régénération)

```bash
node root/tools/lab/crawl-kde-hig-resources.mjs
```

- Point d’entrée : `https://develop.kde.org/hig/`
- Parcours récursif de tous les liens `https://develop.kde.org/hig/*` (sidebar Hugo, hors `index.xml`)
- Liens sortants collectés : invent.kde.org, docs Kirigami/Plasma sur develop.kde.org, API Qt/KDE

Dernière génération : voir champ `crawledAt` dans le JSON (**22 pages** au crawl initial).

---

## 2. Arborescence HIG (22 pages de contenu)

### 2.1 Philosophie et principes

| Page | URL | Usage CapsuleOS |
|------|-----|-----------------|
| Accueil HIG | https://develop.kde.org/hig/ | Vue d’ensemble, philosophie design KDE |
| What makes a KDE app a KDE app? | https://develop.kde.org/hig/kde_app_design/ | Identité apps, cohérence Breeze/Kirigami |
| Simple by default | https://develop.kde.org/hig/simple_by_default/ | Kickoff, Discover — UI épurée par défaut |
| Powerful when needed | https://develop.kde.org/hig/powerful_when_needed/ | Menus contextuels, modes avancés Dolphin |

### 2.2 Patterns transverses

| Page | URL | CapsuleOS |
|------|-----|-----------|
| Layout and navigation | https://develop.kde.org/hig/layout_and_nav/ | Panel, sidebar Discover, navigation Dolphin |
| Displaying content | https://develop.kde.org/hig/displaying_content/ | Grilles Discover, vues Dolphin (`nemo`) |
| Getting input | https://develop.kde.org/hig/getting_input/ | Popovers tray, champs recherche Kickoff |
| Communicating status changes | https://develop.kde.org/hig/status_changes/ | Badge MAJ tray, notifications, spinners |
| Text and labels | https://develop.kde.org/hig/text_and_labels/ | Libellés FR, titres fenêtre Discover |
| Accessibility and inclusiveness | https://develop.kde.org/hig/accessibility/ | Contraste, focus, lecteurs d’écran |

### 2.3 Icons (hub et sous-pages)

| Page | URL | CapsuleOS |
|------|-----|-----------|
| **Icons** (hub) | https://develop.kde.org/hig/icons/ | Règles symbolic vs full-color, tailles |
| Colorful Icons | https://develop.kde.org/hig/icons/colorful/ | Icônes apps Kickoff, Discover (32 px+) |
| Application Icons | https://develop.kde.org/hig/icons/colorful/application/ | Grille Kickoff, pins panel |
| Category and Preferences Icons | https://develop.kde.org/hig/icons/colorful/category_preferences/ | Catégories Kickoff, onglets Discover |
| MIME Type Icons | https://develop.kde.org/hig/icons/colorful/mimetype/ | Dolphin vues fichiers |
| Places Icons | https://develop.kde.org/hig/icons/colorful/places/ | Sidebar Dolphin, favoris |
| Monochromatic Icons | https://develop.kde.org/hig/icons/monochrome/ | Tray panel, actions toolbar |
| Action Icons | https://develop.kde.org/hig/icons/monochrome/action/ | Boutons inline, show-desktop |
| Status Icons | https://develop.kde.org/hig/icons/monochrome/status/ | Réseau, volume, luminosité tray |
| Emblem Icons | https://develop.kde.org/hig/icons/monochrome/emblem/ | Overlays listes |
| Icon Localization | https://develop.kde.org/hig/icons/localization/ | RTL, variantes locales |

**Règle Breeze clé** : tailles `small` (16 px) et `smallMedium` (22 px) → **symbolic** (`-symbolic` suffix) ; `medium` (32 px) et plus → **full-color**.

---

## 3. Outils et assets (liens outbound)

### 3.1 Sources HIG et design KDE

| Ressource | URL | Rôle |
|-----------|-----|------|
| HIG sources (GitLab) | https://invent.kde.org/documentation/develop-kde-org | Markdown source du site HIG |
| Visual Design Group | https://invent.kde.org/groups/vdg | Icônes Breeze, demandes nouvelles icônes |
| Icon Explorer | paquet `plasma-sdk` sur VM | Parcourir bibliothèque Breeze |

### 3.2 Toolkit & inspection

| Ressource | URL |
|-----------|-----|
| Kirigami — docs | https://develop.kde.org/docs/plasma/kirigami/ |
| Plasma — docs | https://develop.kde.org/docs/plasma/ |
| Qt Quick Controls | https://doc.qt.io/qt-6/qtquickcontrols-index.html |
| API KDE Frameworks | https://api.kde.org/ |

### 3.3 Assets CapsuleOS (dépôt)

| Pack | Chemin |
|------|--------|
| Toolkit KDE panel | `usr/share/capsuleos/assets/images/toolkits/kde/panel/` |
| Tray Breeze VM | `usr/share/capsuleos/assets/images/toolkits/kde/panel/tray/` |
| Kickoff actions Neon | `usr/share/capsuleos/assets/images/vendors/neon/kickoff/actions/` |
| Discover catalogue Neon | `usr/share/capsuleos/assets/images/vendors/neon/discover/` |

Pull VM : scripts sous `root/tools/lab/vm-kde-neon-*.sh` — jamais d’icône inventée (prédicat **A∧S**).

---

## 4. Compléments CapsuleOS (hors HIG strict)

Le HIG documente surtout **applications KDE** (Qt/Kirigami), pas tout le **Plasma Shell** :

| Besoin | Doc CapsuleOS |
|--------|----------------|
| Panel, Kickoff, tray | [branche-plasma-kde.md](branche-plasma-kde.md), [`plasma-panel-dock.css`](../../home/Debian/KDE-Neon/style/plasma-panel-dock.css) |
| Expertise stack | [reference-kde-expert.md](reference-kde-expert.md) |
| Parité VM Neon | [inventaire-parite-neon.md](inventaire-parite-neon.md) |
| Fidélité typo/vue/MIME | [convention-fidelite-visuelle.md](convention-fidelite-visuelle.md) |
| Modèle Plasma partagé | [inventaires/linux-opensuse-repair-checklist.md](inventaires/linux-opensuse-repair-checklist.md) |

---

## 5. Matrice rapide surface → pages HIG

| Surface CapsuleOS | Pages HIG prioritaires |
|-------------------|------------------------|
| Panel Plasma + horloge | layout_and_nav, status_changes, icons/monochrome/status, text_and_labels |
| Kickoff | layout_and_nav, simple_by_default, icons/monochrome/action, icons/colorful/application |
| Tray popovers | status_changes, getting_input, icons/monochrome/status |
| Discover (`update_manager`) | displaying_content, layout_and_nav, icons/colorful/application, icons/colorful/category_preferences |
| Dolphin (`nemo`, template `dolphin`) | displaying_content, getting_input, icons/colorful/places, icons/colorful/mimetype |
| Fenêtres CSD Plasma | kde_app_design, layout_and_nav (+ Kirigami docs) |
| Thème clair/sombre Breeze | text_and_labels, accessibility, icons (symbolic vs color) |
| Icônes tray panel | icons/monochrome/status, icons/monochrome/action |

Voir aussi `capsuleMapping` dans [`kde-hig-resources.json`](inventaires/kde-hig-resources.json).

---

## 6. Règles agents

1. **Avant** un patch visuel KDE : identifier la page HIG correspondante dans ce document ou le JSON.
2. **Ground truth** : captures VM + HIG ; en cas de conflit, **VM prime pour le shell Plasma**, **HIG prime pour les apps** (Discover, Dolphin, Konsole).
3. **Ne pas** inventer icônes — pull Breeze depuis VM (`breeze/actions/22`, `breeze/places/`, etc.).
4. **Régénérer** l’inventaire JSON si le site HIG KDE change structure (contributions invent.kde.org).
