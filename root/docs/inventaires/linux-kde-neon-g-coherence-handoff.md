# Handoff — campagne G-coherence linux-kde-neon

> **Statut** : clôturée · **registryId** : `linux-kde-neon` · juin 2026

## Livrables

| Phase | Contenu |
|-------|---------|
| Gc0 | Contrat `kde-coherence-campaign.json`, orchestrateur `run-kde-coherence-campaign.mjs`, bundle `run-kde-neon-pass` durci |
| Gc1 | Matrice Se+ (workspace P0), `systemsettings_kde.html`, fix `handleKdeSettingsWindowOpened` |
| Gc2 | `run-kde-ui-state-effects-pass.mjs` (kickoff/panel/tray/desktop) |
| Gc3 | Smoke Discover + meta `CapsuleGnomeStore` post-install |
| Gc4 | CredΣ +3 scénarios (themes, discover-install, panel-height) |
| Gc5 | Passe intégrale pivot · Π=100 aligné |
| Gc6 | Se propagé dérivés (scripts kconfig/parity sur openSUSE, MX-KDE, Debian-KDE) |
| Gc7 | Docs sync · handoff |

## Commandes reprise

```bash
node usr/lib/capsuleos/tools/lab/run-kde-coherence-campaign.mjs --status
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/run-kde-neon-pass.mjs --write
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Suite

Propagation dérivés post-G-coherence selon `priorityQueue` dans replication-state.
