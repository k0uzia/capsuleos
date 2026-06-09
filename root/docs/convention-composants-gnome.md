# Convention — composants GNOME (modèle, apps par défaut)

> **Statut** : modèle de référence (juin 2026) — premier toolkit documenté ; Cinnamon/KDE suivront [convention-composants-ui.md](convention-composants-ui.md).  
> **Contrat machine** : [`etc/capsuleos/contracts/ui-components-gnome.json`](../../etc/capsuleos/contracts/ui-components-gnome.json)

**VM de référence design** : `linux-rocky` (RL10, GNOME natif RHEL).  
**VM de référence ManΣ** : `linux-ubuntu` (écarts retail documentés dans `apps-catalog.json`).

---

## 1. Sources officielles (obligatoires)

| Source | URL | Usage |
|--------|-----|-------|
| **GNOME HIG** | https://developer.gnome.org/hig/ | Patterns UI normatifs |
| **HIG Resources** | https://developer.gnome.org/hig/resources.html | Outils design (Palette, Icon Library, Adwaita Demo) |
| **GNOME Components** | https://developer.gnome.org/components/ | Widgets libadwaita / GTK 4 |
| **libadwaita CSS** | https://gnome.pages.gitlab.gnome.org/libadwaita/doc/1-latest/css-variables.html | Variables → tokens CapsuleOS |
| **Apps GNOME** | https://apps.gnome.org/fr/ | Périmètre apps Core |
| **Inventaire crawlé** | [gnome-hig-resources.json](inventaires/gnome-hig-resources.json) | 58 pages HIG indexées |

Skill agent : [`gnome-hig-replication`](../skills/gnome-hig-replication/SKILL.md).

---

## 2. Composants N1 (plateforme)

Référence complète : champ `components` du contrat JSON. Synthèse :

| ID contrat | Widget GNOME | Page HIG | Fichier CapsuleOS principal |
|------------|--------------|----------|----------------------------|
| `gnome.adw-application-window` | AdwApplicationWindow | [windows](https://developer.gnome.org/hig/patterns/containers/windows.html) | `gnome-app-csd.base.css` |
| `gnome.adw-header-bar` | AdwHeaderBar | [header-bars](https://developer.gnome.org/hig/patterns/containers/header-bars.html) | `gnome-app-csd.base.css` |
| `gnome.adw-navigation-split` | AdwNavigationSplitView | [sidebars](https://developer.gnome.org/hig/patterns/nav/sidebars.html) | `nemo.base.css` |
| `gnome.gtk-column-view` | GtkColumnView | [list-column-views](https://developer.gnome.org/hig/patterns/containers/list-column-views.html) | `nemo.base.css` |
| `gnome.gtk-search-entry` | GtkSearchEntry | [search](https://developer.gnome.org/hig/patterns/nav/search.html) | skins / overview |
| `gnome.adw-preferences-page` | AdwPreferencesPage | [settings](https://developer.gnome.org/hig/patterns/nav/settings.html) | `themes_gnome.base.css` |
| `gnome.adw-preferences-group` | AdwPreferencesGroup | [boxed-lists](https://developer.gnome.org/hig/patterns/containers/boxed-lists.html) | `gnome-shell-preferences.base.css` |
| `gnome.gtk-grid-view` | GtkGrid | [grid-views](https://developer.gnome.org/hig/patterns/containers/grid-views.html) | `calculator.base.css` |
| `gnome.popover` | GtkPopover | [popovers](https://developer.gnome.org/hig/patterns/containers/popovers.html) | apps (calc, menus) |
| `gnome.browser-chrome` | — (Firefox) | [tabs](https://developer.gnome.org/hig/patterns/nav/tabs.html) | `firefox.base.css` |
| `gnome.terminal-chrome` | — (Ptyxis) | header-bars | `terminal-ptyxis.base.css` |

États UI à capturer par composant : champ `states` dans le contrat (hover, focus, selection, etc.).

---

## 3. Apps par défaut — compositions N2

Chaque ligne = un **slot** `apps-catalog.json` · détail dans `appCompositions` du contrat.

### 3.1 Core GNOME (RL10 / triplet RHEL)

| Slot | App VM (.desktop) | Composants N1 clés | Priorité catalogue |
|------|-------------------|--------------------|--------------------|
| `nemo` | org.gnome.Nautilus | navigation-split, column-view, search | P0 |
| `firefox` | firefox | browser-chrome | P0 |
| `terminal` | org.gnome.Ptyxis | terminal-chrome | P0 |
| `update_manager` | org.gnome.Software | software-grid, search | P0 |
| `text_editor` | org.gnome.TextEditor | monospace-editor | P0 |
| `calculator` | org.gnome.Calculator | header-bar, grid-view, popover | P0 |
| `themes` | org.gnome.Settings | preferences-page, preferences-group | P0 |
| `clocks` | org.gnome.clocks | clocks-face | P1 |
| `visionneur_pdf` | org.gnome.Papers | media-viewer, toolbar-view | P1 |
| `visionneur_images` | org.gnome.Loupe | media-viewer | P1 |
| `snapshot` | org.gnome.Snapshot | camera-preview | P1 |
| `calendar` | org.gnome.Calendar | calendar-grid | P1 |
| `baobab` | org.gnome.baobab | chart-disk-usage | P2 |
| `system_monitor` | org.gnome.SystemMonitor | system-metrics | P2 |
| `tour` | org.gnome.Tour | welcome-flow | P2 |
| `characters` | org.gnome.Characters | character-grid | P2 |

### 3.2 Spécifiques CapsuleOS / retail (hors Core strict)

| Slot | Note | Référence |
|------|------|-----------|
| `screenshot` | Quick Settings Rocky — simulé | `linux-rocky` |
| `profile` | À propos distro — simulé | chaque vendor |
| `checklist` | Pédagogie CapsuleOS | `capsuleOnly` |
| `librewriter` | Flatpak/deb optionnel | `linux-ubuntu` retail |
| `lecteur_multimedia` | Rhythmbox Ubuntu | `linux-ubuntu` retail |

Les écarts **par distro** restent dans `registryOverrides` ; la **composition** reste commune.

---

## 4. Campagne VM — entraînement intensif (catalogue)

Ordre recommandé pour constituer le catalogue GNOME sur **linux-rocky** :

### Phase A — Inventaire apps

```bash
node usr/lib/capsuleos/tools/lab/collect-vm-apps-inventory.mjs --id linux-rocky --write --ssh
node usr/lib/capsuleos/tools/lab/generate-apps-catalog.mjs --id linux-rocky --write
node usr/lib/capsuleos/tools/lab/smoke-apps-catalog.mjs --id linux-rocky
```

### Phase B — Acquisition par composant (P0)

Pour chaque slot P0, exécuter `acquisitionOrder` du contrat :

| # | Slot | Vues à capturer sur VM |
|---|------|------------------------|
| 1 | `nemo` | sidebar, colonnes, fil d'Ariane, menu contextuel fichier |
| 2 | `firefox` | onglets, URL, menu |
| 3 | `terminal` | headerbar, onglets, palette |
| 4 | `update_manager` | explorer, détail app, mises à jour |
| 5 | `text_editor` | document vide, avec texte |
| 6 | `calculator` | basique, avancée, historique |
| 7 | `themes` | Wi-Fi, Affichage, À propos (playbook Paramètres) |

```bash
node usr/lib/capsuleos/tools/lab/collect-vm-apps-visual-investigation.mjs --id linux-rocky --write --ssh
node usr/lib/capsuleos/tools/lab/collect-capsule-apps-visual-investigation.mjs --id linux-rocky --write
node usr/lib/capsuleos/tools/lab/enrich-apps-visual-investigation-parity.mjs --id linux-rocky --write
```

### Phase C — Parité et clôture

```bash
node usr/lib/capsuleos/tools/lab/run-apps-lab.mjs --id linux-rocky
node usr/lib/capsuleos/tools/validate-ui-components-gnome.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
```

Étiqueter chaque capture : `{slot}/{composantId}/{état}` (ex. `calculator/gnome.gtk-grid-view/pressed-key`).

---

## 5. Reproduction CapsuleOS (sans redondance)

```text
Contrat appCompositions
  → gabarit HTML (usr/share/capsuleos/linux/apps/)
  → *.base.css (N1 partagé)
  → *.skin.css (tokens vendor sous home/)
  → sync-gnome-utility-app-skins.mjs / pack.json
```

**Ne pas** recréer une headerbar dans Fedora si Rocky l’a déjà définie — synchroniser via `toolkit-gnome/pack.json`.

Provider chrome : `etc/capsuleos/contracts/window-chrome-contexts.json` (`libadwaita-gnome`, `nemo-gnome`, …).

---

## 6. Ajouter un composant ou une app

1. Lire la page HIG / fiche GNOME Components correspondante.
2. Ajouter l’entrée dans `components` ou `appCompositions` du contrat JSON.
3. Vérifier que `template` et `baseCss` existent (ou PR intégrateur Z1).
4. Lier le slot dans `apps-catalog.json` → `toolkits.gnome.slotSpecs`.
5. `node usr/lib/capsuleos/tools/validate-ui-components-gnome.mjs`

---

## 7. Extension autres distros GNOME

| registryId | Action |
|------------|--------|
| `linux-fedora` | `registryOverrides` + sync skins depuis Rocky |
| `linux-ubuntu` | Écarts retail (`snap-store`, Rhythmbox…) — compositions inchangées |
| `linux-alma` | Héritage Rocky — pas de nouveau composant |

Nouveau leaf GNOME : [convention-accueil-os.md](convention-accueil-os.md) — **pas** de fork composant.

---

## 8. Hors scope actuel (documenté pour suite)

| Surface | Raison | Extension future |
|---------|--------|------------------|
| GNOME Shell (panel, overview, QS) | Shell ≠ app GTK | `ui-components-gnome-shell.json` |
| Extensions tierces | Non default | — |
| Apps Flatpak non installées VM | Hors default | entrée `distroOptional` |

---

## 9. Checklist composant GNOME

```
[ ] higUrl ou gnomeComponents référencé
[ ] Entrée components{} avec states + acquisitionVm
[ ] appCompositions{} avec acquisitionOrder
[ ] template + baseCss présents sur disque
[ ] slotSpecs apps-catalog aligné (même clé slot)
[ ] validate-ui-components-gnome → exit 0
[ ] Captures VM étiquetées composant/état
```

---

*GNOME est le modèle : les autres toolkits répliquent cette forme (contrat JSON + convention + validateur + campagne VM).*
