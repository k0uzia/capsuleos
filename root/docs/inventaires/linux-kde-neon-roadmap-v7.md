# Roadmap v7 — clôture post-v6 KDE Neon

> Campagne **v7-closure** · pivot `linux-kde-neon` · dérivés P4

## Objectifs

| P | Livrable | Outil |
|---|----------|-------|
| P0 | Smoke calendrier tray (grille 6×7, nav mois, Escape) | `smoke-kde-neon-calendar.mjs` |
| P1 | Baselines captures Capsule dérivés KDE | `capture-derived-kde-baselines.mjs` |
| P2 | Cred* échantillon dérivés (kickoff + Discover) | `smoke-kde-derived-cred-sample.mjs` |
| P3 | Π pivot 95 → **98** (CredΣ + calendrier + v6) | `refresh-kde-neon-parity-v7.mjs` |
| Σ | Clôture campagne | `smoke-kde-v7-closure.mjs` |

## Prérequis

```bash
python3 -m http.server 5500 --bind 127.0.0.1
CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-kde-v7-closure.mjs
```

## Backlog post-v7

- Captures **VM** dérivés (ground truth openSUSE / MX / Debian-KDE) — VM refresh
- Π 98 → 100 (Konversation kickoff, raccourcis clavier résiduels)
- Inventaire Cred* complet par dérivé (optionnel)

## Références

- v6 : [linux-kde-neon-roadmap-v6.md](linux-kde-neon-roadmap-v6.md)
- Écarts Vp : [linux-kde-neon-vp-residual.md](linux-kde-neon-vp-residual.md)
