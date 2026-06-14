# Brief agent — KDE neon User Edition

> Campagne **v13-clone-excellence** — perfectionner le ground truth pivot et l’algorithme de clonage (juin 2026). Clone skin conservé ; métriques v12 archivées dans `replication-state`.

## Contexte

- **ID registre** : `linux-kde-neon`
- **Famille** : linux · **Tier** : **P1** · **Statut** : active · **fidelityLevel** : 3
- **Toolkit** : kde / Plasma · **Vendor** : neon
- **VM lab** : `capsule@192.168.122.48` · clé `~/.ssh/capsuleos-lab`
- **Ground truth** : [`ground-truth-kde.md`](../ground-truth-kde.md)

## v13 — objectifs

1. **Algorithme clonage** : `apps-parity-geometry.mjs` (géométrie VM partagée) + `compare-apps-visual-investigation.mjs` (`geometryAlign`)
2. **P0 accepted → ok** : Firefox (1066×860), Konsole, VLC
3. **RealΣ** : `run-ui-state-effects-pass.mjs --id linux-kde-neon`
4. **Propagation dérivés** : gelée jusqu’à clôture v13

## Chaîne v13 (ordre indicatif)

1. `node usr/lib/capsuleos/tools/lab/collect-capsule-apps-visual-investigation.mjs --id linux-kde-neon --filter P0`
2. `node usr/lib/capsuleos/tools/lab/compare-apps-visual-investigation.mjs --id linux-kde-neon --filter P0 --write`
3. `node usr/lib/capsuleos/tools/lab/resolve-slot-gap-delta.mjs --id linux-kde-neon --write`
4. `node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --id linux-kde-neon`
5. `node usr/lib/capsuleos/tools/lab/run-kde-neon-pass.mjs --write`

Purge complète (relance A→Z) : uniquement si nécessaire — `reset-kde-neon-campaign.mjs --write --campaign v13-clone-excellence`

## Gates maintenance (clone — ne pas régresser)

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
node usr/lib/capsuleos/tools/lab/smoke-discover-kde-neon.mjs
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-dolphin.mjs
```

## État

- [`linux-kde-neon-replication-state.json`](../inventaires/linux-kde-neon-replication-state.json)
- [`linux-kde-neon-apps-visual-investigation.json`](../inventaires/linux-kde-neon-apps-visual-investigation.json)

## Interdits

- Fork `contentLoader` / `CapsuleWindow`
- Images hors zones autorisées · icônes vendor croisées
- Propagation dérivés avant clôture ground Neon v13
