---
name: capsuleos-kde-hig-replication
description: >-
  Reproduction fidèle KDE via le HIG officiel — guidelines, icônes Breeze, patterns
  Kirigami. Use when developing or polishing any CapsuleOS distribution with
  toolkit kde (linux-kde-neon, linux-opensuse, linux-mx-kde, linux-debian-kde).
---

# KDE HIG — réplication fidèle

## Charger en premier

1. Ce skill
2. Skill distro (`distributions/linux-kde-neon`, `linux-opensuse`, …)
3. [`convention-fidelite-visuelle.md`](../../docs/convention-fidelite-visuelle.md)

## Documentation interne (obligatoire)

| Document | Rôle |
|----------|------|
| [kde-hig-ressources.md](../../docs/kde-hig-ressources.md) | **Catalogue humain** — 22 pages HIG + outils |
| [kde-hig-resources.json](../../docs/inventaires/kde-hig-resources.json) | **Inventaire machine** — URLs crawlées |
| [reference-kde-expert.md](../../docs/reference-kde-expert.md) | Stack Plasma, Breeze, slots |
| [branche-plasma-kde.md](../../docs/branche-plasma-kde.md) | Shell Neon / dérivés Plasma |

Source officielle racine : https://develop.kde.org/hig/

## Workflow agent

```
VM capture / lab
    → page HIG correspondante (kde-hig-ressources.md §5)
    → icônes Breeze VM (symbolic 16–22 px, color 32 px+)
    → CSS skin home/<Vendor>/<Distro>/
    → sync-linux-skin-closure + validate-all
```

## Sections HIG par tâche

| Tâche | URLs |
|-------|------|
| Copy / libellés FR | `text_and_labels`, `simple_by_default` |
| Icônes tray panel | `icons/monochrome/status`, `icons/monochrome/action` |
| Icônes Kickoff apps | `icons/colorful/application`, `icons/colorful/category_preferences` |
| Kickoff layout | `layout_and_nav`, `simple_by_default` |
| Discover sidebar / grilles | `displaying_content`, `layout_and_nav` |
| Discover onglets / chrome | `icons/colorful/category_preferences`, `kde_app_design` |
| Dolphin vues fichiers | `displaying_content`, `icons/colorful/places`, `icons/colorful/mimetype` |
| Popovers tray | `status_changes`, `getting_input` |
| Badge MAJ tray | `status_changes` |
| Accessibilité / contraste | `accessibility`, `text_and_labels` |
| Fenêtres CSD Plasma | `kde_app_design`, `layout_and_nav` + docs Kirigami |

Préfixe base : `https://develop.kde.org/hig/`

## Outils et assets

- **Icon Explorer** — paquet `plasma-sdk` sur VM lab
- **Breeze paths VM** — `/usr/share/icons/breeze/actions/22/`, `places/`, `status/`
- **Assets dépôt** — `usr/share/capsuleos/assets/images/toolkits/kde/`, `vendors/neon/`
- **Kirigami docs** — https://develop.kde.org/docs/plasma/kirigami/

## Régénérer l’inventaire

```bash
node root/tools/lab/crawl-kde-hig-resources.mjs
```

Commit le JSON si de nouvelles pages apparaissent (mise à jour site HIG).

## Limites HIG

- Le HIG documente surtout **apps KDE** (Qt/Kirigami), pas tout le **Plasma Shell** (panel, Kickoff natif, widgets).
- Shell : captures VM KDE neon + [branche-plasma-kde.md](../../docs/branche-plasma-kde.md).
- Le HIG est **philosophique** (what/why) — compléter par docs Kirigami et code apps existantes pour le how.

## Gates CapsuleOS

```bash
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node root/tools/lab/capture-capsule-kde-neon.mjs
```

## Distributions KDE actives

| registryId | Skill distro |
|------------|--------------|
| `linux-kde-neon` | `distributions/linux-kde-neon` |
| `linux-opensuse` | `distributions/linux-opensuse` |
| `linux-mx-kde` | `distributions/linux-mx-kde` |
| `linux-debian-kde` | `distributions/linux-debian-kde` |
