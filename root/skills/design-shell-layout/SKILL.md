---
name: capsuleos-design-shell-layout
description: >-
  Design et mise en page du shell simulé (GNOME, KDE, etc.) — templating CSS,
  espacements, tailles, alignements. Use when fixing top bar, dock, Aperçu,
  popovers, or any shell surface where VM parity requires measured layout.
---

# Design shell — templating, espacements, dimensions

Complète [convention-fidelite-visuelle.md](../../docs/convention-fidelite-visuelle.md) (Tp/Tv) par la **géométrie** et l’**alignement** des surfaces shell.

## Quand charger ce skill

- Incohérences visuelles shell (top bar, horloge, tray, dash, Aperçu).
- Avant toute passe « polish » shell sur une distro GNOME Red Hat (`linux-rocky`, `linux-fedora`, `linux-alma`).
- Après lecture d’une capture VM : mesurer, ne pas deviner.

## Workflow (obligatoire)

1. **Ground truth** — capture VM ou `*-deep-audit.json` / inventaire lab.
2. **Inventorier** — format texte, disposition (row/column), hauteur barre, gap, padding.
3. **Tokens** — définir dans `style/gnome-shell/tokens.css` (ou équivalent) **avant** les règles composant.
4. **Composant** — `tray.css`, `overview.css`, `gnome-workstation.css` : uniquement `var(--…)` et `calc(var(--head) / n)`.
5. **Smoke** — `smoke-*-shell-polish.mjs` (+ `--playwright` si horloge/alignement).
6. **Clôture** — `sync-linux-skin-closure.mjs`.

## Échelle d’espacement

| Règle | Détail |
|-------|--------|
| Unité | `--head` (dérivé de `variables-linux-computed.css`) |
| Interdit | `px` magiques pour padding/gap/font shell (sauf 1px bordures) |
| Ratios | Préférer divisions documentées : `/5` gap horloge, `/12` padding vertical, `/3` padding horizontal |
| Hauteur barre | `--fedora-top-bar-height` doit contenir **une ligne** de texte horloge + padding |

## Templating GNOME top bar (Red Hat)

### Structure HTML (ne pas réordonner sans spec)

```html
<header class="fedora-top-bar">
  <div class="fedora-top-bar__left"><!-- Activities --></div>
  <div class="fedora-top-bar__center"><!-- horloge --></div>
  <div class="fedora-top-bar__right"><!-- tray --></div>
</header>
```

### Alignement horloge (VM RL10)

- **Centre optique** : `.fedora-top-bar__center` en `position: absolute; left: 50%; transform: translate(-50%, -50%); z-index: 1` — **hors flux** : la top bar doit être en **2 colonnes** (`1fr 1fr`), `__left` → `grid-column: 1`, `__right` → `grid-column: 2; justify-self: end; z-index: 2`. Sinon le tray retombe dans la colonne centrale et se superpose à l’horloge.
- **Format FR** : date courte + heure sur **une ligne** — ex. `6 juin` + `00:33` → rendu VM `6 juin 00:33`.
- **Pas** de `weekday: 'long'` dans la top bar (réservé au popover calendrier).
- **JS** : `usr/lib/capsuleos/shells/linux/date.js` (pas de script inline dans `index.html`).

### Tokens Rocky (référence)

```css
--gnome-shell-clock-font-size: calc(var(--head) / 2.55);
--gnome-shell-clock-gap: calc(var(--head) / 5);
--gnome-shell-clock-padding-y: calc(var(--head) / 12);
--gnome-shell-clock-padding-x: calc(var(--head) / 3);
```

### Checklist horloge

- [ ] `flex-flow: row` sur `.taskbar-clock-trigger`
- [ ] date et heure : même `font-size` (heure `font-weight: 500`)
- [ ] hauteur trigger ≤ `--fedora-top-bar-height`
- [ ] offset centre &lt; 3 px (Playwright)
- [ ] capture VM comparée (`rocky-dark-desktop.png`)

## Surfaces shell (même méthode)

| Surface | Fichiers | Tokens clés |
|---------|----------|-------------|
| Aperçu | `overview.css`, `tokens.css` | `--fedora-overview-*`, `--fedora-overview-dash-*` |
| Dash | `overview.css` | gap items, `backdrop-filter` |
| Tray / QS | `tray.css`, `volume-popover.css` | `--gnome-shell-tray-*` |
| Dock | `gnome-workstation.css` | `--fedora-dock-*` |
| Fenêtres | `windows-chrome.css` | `--fedora-window-*` |

Pour chaque surface : **une** source de tokens, pas de duplication entre `home/` et `OS/`.

## Gates

```bash
node usr/lib/capsuleos/tools/lab/smoke-rocky-shell-polish.mjs
CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-rocky-shell-polish.mjs --playwright
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
```

## Pairing

| Ordre | Skill |
|-------|--------|
| 1 | `gnome-hig-replication` (patterns + palette HIG) |
| 2 | `design-shell-layout` (ce fichier) |
| 3 | `distributions/linux-rocky` ou distro cible |
| 4 | `role-designer` (parcours / copy) |
| 5 | `css-variables-contract` |

## Ne pas

- Empiler date + heure en colonne sur GNOME 47 RL10 (déborde la top bar).
- Centrer l’horloge uniquement avec flex grid sans test asymétrie tray/Activities.
- Dupliquer la logique date dans `index.html` — centraliser dans `date.js`.
