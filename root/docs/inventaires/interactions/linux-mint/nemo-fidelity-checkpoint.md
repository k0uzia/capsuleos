# Checkpoint fidélité Nemo — pré-push

**Date** : 2026-06-09  
**Base** : `80ee1f6` → correctifs campagne + menus contextuels  
**URL recette** : `http://127.0.0.1:5501/OS/linux/families/debian/mint/index.html?v=nemoctx3`

## Verdict : **GO push**

## Gates exécutées

| Gate | Commande | Résultat |
|------|----------|----------|
| H₂ / H₆ | `node usr/lib/capsuleos/tools/validate-all.mjs` | exit 0 |
| Smoke menus P0/P1 | `smoke-mint-context-menus.mjs` | exit 0 (incl. `nemo.sidebar.place`, `nemo.list.multi`) |
| Smoke Nemo | `smoke-mint-nemo.mjs` | exit 0 |
| Campagne recette | `run-mint-nemo-context-campaign.mjs` | 29 scénarios · **0 P0 · 0 P1** |
| Comparateur VM | `compare-mint-nemo-context-campaign.mjs --write` | **0 P0 · 0 P1** cross-diff |
| Clôture skin | `sync-linux-skin-closure.mjs linux-mint` | exit 0 |

## Écarts avant / après

| Zone | Avant (campagne `80ee1f6`) | Après | Cause racine |
|------|---------------------------|-------|--------------|
| `nemo.list.background.*` / `nemo.list.file.*` | Capsule « non » (fenêtre masquée) | Tous **oui** | `ensureNemoOpen` + `isolateNemoCampaignWindows` avant chaque scénario Nemo |
| `nemo.list.multi` | Menu fond (extras Créer… / Tout sélectionner) | Couper…Propriétés VM | Écouteurs `contextmenu` dupliqués après `capsule:slot-injected` ; skip `selectNemoContextItem` en multi |
| `nemo.sidebar.place.documents/downloads` | Menu absent | Ouvrir / Supprimer / Vider la corbeille / Propriétés | Profil `sidebar-place` sur `#voletnemo a.places-item[data-link]` |
| Sous-menus campagne | Faux P1 (labels parent) | ok | `classifyGap` utilise `submenuKey` |
| `nemo.sidebar.place.home` | P1 | skip (optional) | VM : menu absent sur Dossier personnel |

## P1 clos / résiduels

**Clos**

- Stabilité campagne Playwright (isolation fenêtre Nemo)
- Multi-sélection (matrice `nemo.list.multi`)
- Sidebar places Documents / Téléchargements
- Comparateur sous-menus

**Résiduels documentés (non bloquants push)**

- `nemo.sidebar.tree` / `nemo.toolbar` : optional P2 (VM tree inactive)
- `nemo.list.file.odt` : optional (fichier absent manifeste)
- Écarts VM GTK complets vs matrice pédagogique : `vmExtraLabels` dans `context-menus.json` (Warpinator, desklets…) — hors périmètre Nemo standard 6.6.3 fr

## Risques régression

| Risque | Mitigation |
|--------|------------|
| Ré-injection slot Nemo → écouteurs multiples | `__nemoCtxMenuHandler` retiré avant rebind |
| Fenêtre masquée en fin de campagne | `ensureNemoOpen` en tête de boucle runner |
| Menu GTK VM complet confondu avec recette | `filterPedagogicalLabels` + `vmExtraLabels` |

## Procédure reproductible

Voir § checkpoint pré-push Nemo dans `recette-clone-mint-integral.md` et `ground-truth-cinnamon.md`.
