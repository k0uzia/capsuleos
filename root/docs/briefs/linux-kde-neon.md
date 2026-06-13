# Brief agent — KDE neon User Edition

> Campagnes v4 / ground G1–G8 / H6 **clôturées** · **G-coherence** clôturée (juin 2026).

## Contexte

- **ID registre** : `linux-kde-neon`
- **Famille** : linux · **Tier** : **P1** · **Statut** : active · **fidelityLevel** : 3
- **Toolkit** : kde / Plasma · **Vendor** : neon
- **VM lab** : `goupil@192.168.123.52` · clé `~/.ssh/capsuleos-lab`

## Campagne G-coherence (canon)

- Roadmap : [`linux-kde-neon-roadmap-g-coherence.md`](../inventaires/linux-kde-neon-roadmap-g-coherence.md)
- Orchestrateur : `run-kde-coherence-campaign.mjs`
- Passe intégrale : `run-kde-neon-pass.mjs --write`

```bash
node usr/lib/capsuleos/tools/lab/run-kde-coherence-campaign.mjs --status
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/run-kde-neon-pass.mjs --write
node usr/lib/capsuleos/tools/lab/verify-kde-settings-parity-chain.mjs --id linux-kde-neon
```

## Gates maintenance

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
node usr/lib/capsuleos/tools/lab/smoke-discover-kde-neon.mjs
node usr/lib/capsuleos/tools/lab/run-kde-ui-state-effects-pass.mjs --id linux-kde-neon
```

## État

- [`linux-kde-neon-replication-state.json`](../inventaires/linux-kde-neon-replication-state.json)
- [`linux-kde-neon-vp-residual.md`](../inventaires/linux-kde-neon-vp-residual.md)

## Interdits

- Fork `contentLoader` / `CapsuleWindow`
- Images hors zones autorisées · icônes vendor croisées
