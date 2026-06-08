# Brief agent — KDE neon User Edition

> Campagne **v2** clôturée H₆ (2026-06-08) · **Roadmap v3** : [`linux-kde-neon-roadmap.md`](../inventaires/linux-kde-neon-roadmap.md)

## Contexte

- **ID registre** : `linux-kde-neon`
- **Famille** : linux · **Tier** : P2 · **Statut** : active
- **Toolkit** : kde / Plasma · **Vendor** : neon
- **embedKey** / **bodyId** : `kde-neon` / `kde-neon`
- **VM lab** : `goupil@192.168.123.52` · clé `~/.ssh/capsuleos-lab`

## Clone VM (ground truth)

- Parité : [`inventaire-parite-neon.md`](../inventaire-parite-neon.md)
- Statut : [`linux-kde-neon-clone-status.md`](../inventaires/linux-kde-neon-clone-status.md)
- Dolphin diff : [`linux-kde-neon-dolphin-diff.md`](../inventaires/linux-kde-neon-dolphin-diff.md)
- Interactions : `root/docs/inventaires/interactions/linux-kde-neon/*.json`

## Chemins

- **Façade** : `OS/linux/families/debian/kde-neon/index.html`
- **Skin** : `home/Debian/KDE-Neon/index.html`
- **Assets vendor** : `usr/share/capsuleos/assets/images/vendors/neon/`

## Gates H₆ (campagne v2)

```bash
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --id linux-kde-neon --compare
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-firefox.mjs
```

Captures lab :

```bash
python3 -m http.server 5500 --bind 127.0.0.1
node root/tools/lab/capture-capsule-kde-neon.mjs
KDE_NEON_SSH=goupil@192.168.123.52 bash root/tools/lab/vm-kde-neon-capture-host.sh --dolphin-search
```

## Campagne v2 — livré

| Pass | Contenu |
|------|---------|
| 0 | merge upstream, validate-all, baseline |
| 1 | replication-state, docs réouverts |
| 2 | tokens `--kde-neon-*`, assets Dolphin, interactions JSON |
| 3 | captures VM/Capsule recherche + hamburger + filtre |
| 4 | `firefox.skin.css`, `smoke-kde-neon-firefox.mjs` |
| 5 | compare baseline stable (horloge figée), brief |

## Suite — campagne v3

Voir [`linux-kde-neon-roadmap.md`](../inventaires/linux-kde-neon-roadmap.md) (palliers P0→P5).

**Prochaine action** : **P1** — audit assets JS + `smoke-kde-neon-shell-polish.mjs` (voir roadmap § P1).

## Backlog (résumé)

- Menu contextuel Dolphin flyouts complets (diff §9)
- Tray popovers dynamiques (Klipper, réseau)
- Périphériques sidebar Dolphin
- Audit `resolveCapsuleResourceUrl` Discover/tray (CSS `usr/share` restants)
- Inventaire VM Firefox détaillé

## Interdits

- Fork `contentLoader` / `CapsuleWindow`
- Images hors zones autorisées · icônes vendor croisées
- `?.` / `??` / object spread dans JS runtime skin
