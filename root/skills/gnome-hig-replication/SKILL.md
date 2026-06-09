---
name: capsuleos-gnome-hig-replication
description: >-
  Reproduction fidèle GNOME via le HIG officiel — guidelines, patterns, palette,
  outils design. Use when developing or polishing any CapsuleOS distribution
  with toolkit gnome (linux-rocky, linux-fedora, linux-alma, ubuntu GNOME).
---

# GNOME HIG — réplication fidèle

## Charger en premier

1. Ce skill
2. [`design-shell-layout`](../design-shell-layout/SKILL.md) — géométrie shell (top bar, Aperçu)
3. Skill distro (`distributions/linux-rocky`, `linux-fedora`, …)
4. [`convention-fidelite-visuelle.md`](../../docs/convention-fidelite-visuelle.md)

## Documentation interne (obligatoire)

| Document | Rôle |
|----------|------|
| [convention-composants-gnome.md](../../docs/convention-composants-gnome.md) | **Composants + apps par défaut** — modèle toolkit |
| [gnome-hig-ressources.md](../../docs/gnome-hig-ressources.md) | **Catalogue humain** — 58 pages HIG + outils |
| [gnome-hig-resources.json](../../docs/inventaires/gnome-hig-resources.json) | **Inventaire machine** — URLs crawlées |
| [reference-gnome-expert.md](../../docs/reference-gnome-expert.md) | Stack Mutter, apps, gsettings |
| [branche-redhat-gnome.md](../../docs/branche-redhat-gnome.md) | Shell Rocky/Fedora/Alma |

Source officielle racine : https://developer.gnome.org/hig/resources.html

## Workflow agent

```
VM capture / lab
    → page HIG correspondante (gnome-hig-ressources.md §5)
    → tokens (--head, palette Blue 3 #3584e4, --font-ui)
    → CSS skin home/<Vendor>/<Distro>/
    → smoke + sync-linux-skin-closure
```

## Sections HIG par tâche

| Tâche | URLs |
|-------|------|
| Copy / placeholders FR | `guidelines/writing-style.html`, `patterns/nav/search.html` |
| Typo / polices | `guidelines/typography.html` + VM `gsettings` |
| Couleurs / accent | `reference/palette.html`, `guidelines/ui-styling.html` |
| Icônes tray / symbolic | `guidelines/ui-icons.html` + Icon Library (Flathub) |
| Header bar app | `patterns/containers/header-bars.html` |
| Popover QS / calendrier | `patterns/containers/popovers.html` |
| Liste Paramètres | `patterns/containers/boxed-lists.html`, `patterns/nav/view-switchers.html` |
| Sidebar Nautilus | `patterns/nav/sidebars.html` |
| Accessibilité | `guidelines/accessibility.html`, `guidelines/keyboard.html` |
| Raccourcis | `reference/keyboard.html` |

## Outils design (depuis Resources)

- **Icon Library** — `org.gnome.design.IconLibrary` (Flathub)
- **Typography** — `org.gnome.design.Typography`
- **Palette** — `org.gnome.design.Palette` + `reference/palette.html`
- **Adwaita Demo** — `org.gnome.Adwaita1.Demo` (nightly flatpak)
- **GTK Inspector** — https://docs.gtk.org/gtk4/running.html
- **libadwaita CSS** — https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/css-variables.html

## Régénérer l’inventaire

```bash
node root/tools/lab/crawl-gnome-hig-resources.mjs
```

Commit le JSON si de nouvelles pages apparaissent (montée GNOME).

## Limites HIG

- Le HIG documente **apps GTK 4 / libadwaita**, pas tout le **GNOME Shell** (Aperçu, dash, peek workspaces).
- Shell : wiki GnomeShell/Design + captures VM + `design-shell-layout`.
- Extensions tierces (Dash to Dock) ≠ modèle RHEL natif.

## Catalogue composants (apps default)

```bash
node usr/lib/capsuleos/tools/validate-ui-components-gnome.mjs
```

Contrat : `etc/capsuleos/contracts/ui-components-gnome.json` — acquisition VM par `acquisitionOrder` par slot.

## Gates CapsuleOS

```bash
node usr/lib/capsuleos/tools/lab/smoke-visual-fidelity.mjs --id <registryId>
CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-rocky-shell-polish.mjs --playwright
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
```

## Distributions GNOME actives

| registryId | Skill distro |
|------------|--------------|
| `linux-rocky` | `distributions/linux-rocky` |
| `linux-fedora` | `distributions/linux-fedora` |
| `linux-alma` | `distributions/linux-alma` |
| `linux-ubuntu` | `distributions/linux-ubuntu` (dock ≠ RHEL — lire branche) |
