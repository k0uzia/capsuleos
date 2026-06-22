# Convention — composants Cinnamon (squelette)

> **Statut** : **squelette** (juin 2026) — extension du modèle [convention-composants-gnome.md](convention-composants-gnome.md).  
> **Contrat** : [`etc/capsuleos/contracts/ui-components-cinnamon.json`](../../etc/capsuleos/contracts/ui-components-cinnamon.json)  
> **Référence distro** : `linux-mint`

---

## 1. Objectif

Reproduire les **apps par défaut Linux Mint / Cinnamon** avec la même méthode que GNOME :

- composants N1 documentés (panel, menu, Nemo, tray, XApp…) ;
- compositions N2 par slot ;
- acquisition VM étiquetée `composant/état`.

**Hors scope squelette** : catalogue complet des 101 apps Mint — priorité P0 shell + Nemo + Paramètres + mintinstall.

---

## 2. Sources officielles

| Source | URL |
|--------|-----|
| Projet Cinnamon | https://projects.linuxmint.com/cinnamon/ |
| Dépôt Cinnamon | https://github.com/linuxmint/Cinnamon |
| Nemo | https://github.com/linuxmint/nemo |
| Doc utilisateur Mint | https://linuxmint.com/documentation.php |
| Paradigme CapsuleOS | [paradigme-toolkit-cinnamon.md](paradigme-toolkit-cinnamon.md) |

Pas de HIG unique type GNOME : s’appuyer sur **captures VM** + docs Mint + code Cinnamon (CJS).

---

## 3. Composants N1 (squelette)

Voir contrat JSON `components{}`. Synthèse :

| ID | Surface |
|----|---------|
| `cinnamon.muffin-window` | Chrome fenêtre Muffin |
| `cinnamon.panel` | Panel 40px |
| `cinnamon.menu-popup` | Menu Démarrer |
| `cinnamon.nemo-explorer` | Nemo |
| `cinnamon.tray-applets` | Tray |
| `cinnamon.settings-panels` | cinnamon-settings |
| `cinnamon.xapp-window` | Apps mint-* / XApp |

---

## 4. Sortie du statut skeleton

Checklist pour passer `status: model` :

```
[ ] slotSpecs cinnamon dans apps-catalog.json
[x] validate-ui-components-cinnamon.mjs (aligné apps-catalog P0)
[ ] appCompositions P0 complétées (sans planned: true)
[ ] sync-mint-visual-investigation-compositions.mjs sur inventaire P0/P1
[ ] Campagne VM linux-mint (AppV → AppC)
[ ] Lien convention-composants-ui.md § extension
```

---

## 5. Documents liés

| Document | Rôle |
|----------|------|
| [convention-composants-ui.md](convention-composants-ui.md) | Cadre transversal |
| [procedure-clonage-os-depuis-vm.md](procedure-clonage-os-depuis-vm.md) | Clone Mint |
| [linux-mint-apps-catalog.json](inventaires/linux-mint-apps-catalog.json) | Catalogue existant |

---

*Cinnamon partage des gabarits HTML avec d’autres toolkits (Nemo, Firefox) mais pas la grammaire visuelle — tokens `toolkit-cinnamon` obligatoires.*
