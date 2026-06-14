# Brief agent — KDE neon User Edition

> Campagne **v12-excellence** — relance A→Z (juin 2026). Clone skin conservé ; captures et clôtures v3–v11 purgées.

## Contexte

- **ID registre** : `linux-kde-neon`
- **Famille** : linux · **Tier** : **P1** · **Statut** : active · **fidelityLevel** : 3
- **Toolkit** : kde / Plasma · **Vendor** : neon
- **VM lab** : `goupil@192.168.123.52` · clé `~/.ssh/capsuleos-lab`
- **Ground truth** : [`ground-truth-kde.md`](../ground-truth-kde.md)

## Purge / relance

```bash
node usr/lib/capsuleos/tools/lab/reset-kde-neon-campaign.mjs --write
node usr/lib/capsuleos/tools/lab/resolve-agent-action.mjs --id linux-kde-neon --scope pipeline
```

## Chaîne campagne v12 (ordre indicatif)

1. `validate-clone-assets.mjs --id linux-kde-neon`
2. `collect-vm-apps-visual-investigation.mjs --id linux-kde-neon --filter P0 --ssh`
3. `collect-capsule-apps-visual-investigation.mjs --id linux-kde-neon`
4. `capture-clone-surfaces.mjs --id linux-kde-neon --write-baseline`
5. `run-kde-neon-pass.mjs --write` (après prédicats)

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
- Réintroduire roadmaps/handoffs campagnes clôturées sans nouveau cycle v12
