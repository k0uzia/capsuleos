# Brief agent — KDE neon User Edition

> Campagne **v3** clôturée H₆ v3 + P1 référence (2026-06-08) · **Campagne v4** : [`linux-kde-neon-roadmap-v4.md`](../inventaires/linux-kde-neon-roadmap-v4.md)

## Contexte

- **ID registre** : `linux-kde-neon`
- **Famille** : linux · **Tier** : **P1** · **Statut** : active · **fidelityLevel** : 3
- **Toolkit** : kde / Plasma · **Vendor** : neon
- **embedKey** / **bodyId** : `kde-neon` / `kde-neon`
- **VM lab** : `goupil@192.168.123.52` · clé `~/.ssh/capsuleos-lab`

## Clone VM (ground truth)

- Parité : [`inventaire-parite-neon.md`](../inventaire-parite-neon.md)
- État : [`linux-kde-neon-replication-state.json`](../inventaires/linux-kde-neon-replication-state.json)
- Écarts Vp : [`linux-kde-neon-vp-residual.md`](../inventaires/linux-kde-neon-vp-residual.md)
- Dolphin diff : [`linux-kde-neon-dolphin-diff.md`](../inventaires/linux-kde-neon-dolphin-diff.md)

## Chemins

- **Façade** : `OS/linux/families/debian/kde-neon/index.html`
- **Skin** : `home/Debian/KDE-Neon/index.html`
- **Assets vendor** : `usr/share/capsuleos/assets/images/vendors/neon/`

## Gates H₆ v3 (maintenance)

```bash
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --id linux-kde-neon --compare
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-shell-polish.mjs
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-firefox.mjs
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-dolphin.mjs
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-terminal.mjs
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-kickoff.mjs
```

## Campagne v3 — livré ✅

| Pallier | Contenu |
|---------|---------|
| P0 | Parity-index, interactions, validate-all |
| P1 | Audit assets JS, shell polish, panel VM compare |
| P2 | Dolphin §7–9, Discover tabs, tray dynamique, Konsole |
| P3 | Kickoff 30/30 dataLink, slot Kate `text_editor` |
| P4 | Propagation tray/panel → openSUSE, MX-KDE, Debian-KDE |
| P5 | Tier P1, H₆ v3, baseline v3, smokes complets |

## Suite — campagne v4

Voir [`linux-kde-neon-roadmap-v4.md`](../inventaires/linux-kde-neon-roadmap-v4.md).

**Prochaine action** : **V4-P2** — Kickoff batches B2/B3 (voir [`linux-kde-neon-roadmap-v4.md`](../inventaires/linux-kde-neon-roadmap-v4.md)).

## Interdits

- Fork `contentLoader` / `CapsuleWindow`
- Images hors zones autorisées · icônes vendor croisées
- `?.` / `??` / object spread dans JS runtime skin
