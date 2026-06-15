# Audit cloisonnement toolkits — GNOME / Cinnamon / KDE

> **Date** : 2026-06-08 · **Périmètre** : Mint, Rocky, Ubuntu, noyau explorateur  
> **Paradigme** : [paradigme-toolkit-de.md](../paradigme-toolkit-de.md)

---

## 1. Synthèse

| Zone | État | Fuites détectées | Action |
|------|------|------------------|--------|
| `home/Debian/Mint/` | OK | Aucune vers Rocky/Ubuntu | Gate `linux-mint` (b5e39bc) |
| `home/RedHat/Rocky/` | OK | Aucune réf. `cinnamon` / `mint-*` | Gate `linux-rocky` ajouté |
| `home/Debian/Ubuntu/` | OK | Aucune réf. `cinnamon` / `mint-*` | Gate `linux-ubuntu` ajouté |
| `home/Debian/Debian-KDE/` | OK | Pas de `nemo-gnome` / `nautilus-app` | Gate `linux-debian-kde` |
| `fileExplorerContextMenu.js` | **Réparé** | Régression 00816fb : branche Nautilus supprimée | Restauration branche `isNautilusGnome()` |
| `explorer-icon-base.js` | OK | Remap cinnamon→adwaita/yaru/kde par toolkit | Inchangé (b5e39bc) |
| `fileExplorerCore.js` | OK | `isNautilusGnomeTemplate` / `isNemoTemplate` séparés | Inchangé |

---

## 2. Cause racine — menu clic droit Rocky Nautilus

| Commit | Changement | Effet Rocky |
|--------|------------|-------------|
| `80b09be` | Menu contextuel Nautilus GNOME complet (`#nemo-context-menu`, profils item/background/trash) | OK |
| `00816fb` | Remplacement par menu Nemo dynamique (Mint v2 Π) sans garde `isNautilusGnome()` | **Clic droit cassé** — menu HTML `#nemo-context-menu` jamais lié |
| Fix 2026-06-08 | `bindFileExplorerContextMenu` dispatch Nautilus vs Nemo | Restauré |

**Symptôme** : clic droit dans la grille Fichiers Rocky → pas de menu (ou menu Nemo incorrect).  
**Diagnostic smoke** : `contextInit: false`, `#nemo-context-menu` présent mais non initialisé.

---

## 3. Scan cross-contamination (grep manuel)

### Mint → pas de fuite vers GNOME skins

```
home/Debian/Mint/ : toolkits/cinnamon uniquement (menu, panel, Nemo)
Aucune réf. home/Debian/Mint dans Rocky/Ubuntu
```

### Rocky / Ubuntu → GNOME pur

```
home/RedHat/Rocky/ : toolkits/gnome, nemo-gnome, gnome-window-behaviors
Pas de toolkits/cinnamon, mainMenu-data-cinnamon, mint-panel
```

### KDE → toolkit kde

```
home/Debian/Debian-KDE/ : dolphin, toolkits/kde, icons/kde
Pas de nautilus-app ni cinnamon
```

---

## 4. Noyau JS — branches vérifiées

| Fichier | Branche Cinnamon | Branche GNOME | Branche KDE |
|---------|------------------|---------------|-------------|
| `explorer-icon-base.js` | `CINNAMON_BASE` défaut | `usesGnomeAdwaita()` remap | `usesKdeIcons()` remap |
| `fileExplorerContextMenu.js` | `bindNemoContextMenu` | `bindNautilusGnomeContextMenu` | `bindNautilusGnomeContextMenu` |
| `fileExplorerCore.js` L380 | `isNemoTemplate()` exclut nautilus | `isNautilusGnomeTemplate()` | `isDolphinTemplate()` |

---

## 5. Gates étendus

```bash
node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --all
node usr/lib/capsuleos/tools/validate-toolkit-paradigm.mjs --id linux-rocky
node usr/lib/capsuleos/tools/lab/smoke-gnome-nautilus-interactions.mjs --profile=linux-rocky
node usr/lib/capsuleos/tools/validate-all.mjs
```

---

## 6. Non-régression Mint

Le menu Nemo Cinnamon (dynamique, 7 entrées) reste sur la branche `bindNemoContextMenu` — **pas** le menu Nautilus HTML. Panel/menu pixel-perfect (fbf2d12) non touché.

**Dispatch 2026-06-10** : `bindFileExplorerContextMenu` tente `isNemoCinnamonScope` **avant** Nautilus/Dolphin ; garde `.dolphin-app` pour éviter qu’un gabarit KDE (`.nemo-app` sans `.nautilus-app`) ne reçoive le menu dynamique Mint.

---

## 7. Passe régression Rocky GNOME (2026-06-08)

### Gates exécutés

| Gate / smoke | Résultat | Notes |
|--------------|----------|-------|
| `validate-all.mjs` | **OK** | assets + links + capsule + quality (13 contrats UI) |
| `validate-toolkit-paradigm.mjs --id linux-rocky` | **OK** | Aucune fuite cinnamon/mint |
| `validate-toolkit-paradigm.mjs --all` | **OK** | mint, rocky, ubuntu, debian-kde |
| `validate-clone-assets.mjs --id linux-rocky` | **OK** | zones + profil + paradigme |
| `validate-clone-checkpoints.mjs --tier P0` | **OK** | mint seul (Rocky = tier P1) |
| `validate-toolkit-chrome-isolation.mjs` | **OK** | 8 profils actifs |
| `validate-skin-vendor-isolation.mjs` | **OK** | 8 profils actifs |
| `smoke-gnome-nautilus-interactions.mjs --profile=linux-rocky` | **OK** | menu contextuel, sidebar, headerbar |
| `smoke-gnome-nautilus-routing.mjs --profile=linux-rocky` | **OK** | 3 skins GNOME |
| `capture-clone-surfaces.mjs --id linux-rocky --compare` | drift 5/5 | baseline rafraîchie post-fix tokens |

### Correctifs appliqués

| Item | Avant | Après |
|------|-------|-------|
| `--taskbar-height` portail (1.25×head, Mint) | Hérité par règles génériques `calendar-popover.css` | Alias local `--taskbar-height: var(--fedora-top-bar-height)` dans `home/RedHat/Rocky/style/gnome-shell/tokens.css` |
| Ubuntu (spot-check) | Même risque portail | Alias `--taskbar-height: var(--ubuntu-top-bar-height)` |
| `validate-clone-assets.mjs --all` | Ignoré (`--all` non implémenté → défaut mint) | Boucle `listCloneTargets` par tier |

### Dette P2 inchangée (volontaire)

Chemins physiques `../../../../usr/` dans `home/Debian/Mint/style/` — **pas de correction** : Rocky n'importe pas ces CSS ; correction Mint risquerait régression pixel-perfect panel/menu.

### Score cloisonnement post-passe

| Critère | Score |
|---------|-------|
| Paradigme toolkit (4 DE) | 25/25 |
| Chrome isolation (clusters) | 20/20 |
| Vendor isolation | 15/15 |
| Noyau JS branches (explorer, context menu) | 20/20 |
| Variables CSS cross-portail | 16/20 (Mint P2 chemins physiques) |
| **Total** | **96/100** |

Recette détaillée : [recette-clone-rocky-regression.md](../recette-clone-rocky-regression.md).
