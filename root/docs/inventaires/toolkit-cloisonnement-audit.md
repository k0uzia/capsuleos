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
| `fileExplorerContextMenu.js` | `bindNemoContextMenu` | `bindNautilusGnomeContextMenu` | — |
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
