# Roadmap G-coherence — linux-kde-neon

> **Suite** des campagnes v4, ground G1–G8, pass Π=100 et H6 Paramètres KDE (juin 2026).  
> Objectif : **cohérence système** au niveau Mint — anti-régression, Se+ Paramètres, effets shell transversaux.

| Métadonnée | Valeur |
|------------|--------|
| **registryId** | `linux-kde-neon` |
| **Prérequis** | Pipeline `R-PIPELINE-DONE` · G1–G8 ✅ · H6 ✅ · CredΣ 33 scénarios |
| **VM lab** | `goupil@192.168.123.52` |
| **Orchestrateur** | `run-kde-coherence-campaign.mjs` |
| **Contrat** | `etc/capsuleos/contracts/kde-coherence-campaign.json` |
| **État machine** | [linux-kde-neon-replication-state.json](linux-kde-neon-replication-state.json) |

## Succession des phases

| Phase | Pallier | Commit type | Gate orchestrateur |
|-------|---------|-------------|-------------------|
| Gc0 | 0 | `KDE Neon Gc0 : socle anti-régression bundle smokes.` | `--run-next` après Gc0 gates |
| Gc1 | 1 | `KDE Neon Gc1 : Se+ matrice Paramètres KDE (panneaux VM delta).` | SeΣ + H6 settings |
| Gc2 | 2 | `KDE Neon Gc2 : cohérence shell UI state effects KDE.` | shell smokes + ui-state pass |
| Gc3 | 3 | `KDE Neon Gc3 : chaîne install Discover cohérente kickoff.` | discover smokes |
| Gc4 | 4 | `KDE Neon Gc4 : CredΣ étendu themes discover install.` | fidelity-all |
| Gc5 | 5 | `KDE Neon Gc5 : passe intégrale pivot Π cohérent.` | run-kde-neon-pass --write |
| Gc6a | 6 | `KDE Neon Gc6a : cohérence Se openSUSE.` | verify opensuse |
| Gc6b | 7 | `KDE Neon Gc6b : cohérence Se MX-KDE.` | verify mx-kde |
| Gc6c | 8 | `KDE Neon Gc6c : cohérence Se Debian-KDE.` | verify debian-kde |
| Gc7 | 9 | `KDE Neon Gc7 : clôture campagne G-coherence.` | validate-all + Cx |

```bash
node usr/lib/capsuleos/tools/lab/run-kde-coherence-campaign.mjs --status
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/run-kde-coherence-campaign.mjs --run-next --write
node usr/lib/capsuleos/tools/lab/run-kde-coherence-campaign.mjs --record-commit <hash>
```

---

## Gc0 — Socle anti-régression

**Objectif** : bundle smokes durci + contrat/orchestrateur campagne.

- [ ] `run-kde-neon-pass.mjs` inclut `smoke-discover-kde-neon`, `smoke-h6-kde-settings-ready`, `verify-kde-settings-parity-chain`
- [ ] Contrat `kde-coherence-campaign.json` + runner opérationnel
- [ ] Champs `campaignGCoherence*` dans replication-state

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
node usr/lib/capsuleos/tools/lab/smoke-discover-kde-neon.mjs
node usr/lib/capsuleos/tools/lab/smoke-h6-kde-settings-ready.mjs --id linux-kde-neon
node usr/lib/capsuleos/tools/lab/verify-kde-settings-parity-chain.mjs --id linux-kde-neon
```

**Critère sortie** : gates Gc0 vertes · commit enregistré `Gc0Commit`.

---

## Gc1 — Se+ Paramètres

**Objectif** : épaissir matrice Se sans refaire le gabarit — panneaux Espace de travail + effets P0.

**Slots** : `themes` → `systemsettings_kde.html` · `kde-settings-parity.js` · `themes.js`

- [ ] Matrice : accessibilité + workspace P0 (click-to-focus, focus policy)
- [ ] Contrôles HTML workspace (remplace stub)
- [ ] Handlers + sync UI + bus `capsule:*`

```bash
node usr/lib/capsuleos/tools/lab/verify-kde-settings-parity-chain.mjs --id linux-kde-neon
node usr/lib/capsuleos/tools/lab/smoke-h6-kde-settings-ready.mjs --id linux-kde-neon
```

**Commit** : `KDE Neon Gc1 : Se+ matrice Paramètres KDE (panneaux VM delta).`

---

## Gc2 — Shell cohérence transversale

**Objectif** : équivalent Mint C2–C3 — kickoff, panel, tray, desktop.

```bash
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/run-kde-ui-state-effects-pass.mjs --id linux-kde-neon --write
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-shell-polish.mjs
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-kickoff.mjs
```

**Commit** : `KDE Neon Gc2 : cohérence shell UI state effects KDE.`

---

## Gc3 — Discover install chain

**Objectif** : install simulée → session store → kickoff/slot ouvert.

```bash
node usr/lib/capsuleos/tools/lab/smoke-discover-kde-neon.mjs
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-kde-neon-discover.mjs
```

**Commit** : `KDE Neon Gc3 : chaîne install Discover cohérente kickoff.`

---

## Gc4 — CredΣ étendu

**Objectif** : scénarios themes, discover-install, panel-height-effect.

```bash
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/smoke-kde-fidelity-all.mjs --id linux-kde-neon
```

**Commit** : `KDE Neon Gc4 : CredΣ étendu themes discover install.`

---

## Gc5 — Passe intégrale pivot

```bash
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/run-kde-neon-pass.mjs --write
node usr/lib/capsuleos/tools/sync-all-views.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
```

**Commit** : `KDE Neon Gc5 : passe intégrale pivot Π cohérent.`

---

## Gc6 — Propagation dérivés

Ordre : openSUSE → MX-KDE → Debian-KDE (P-OS7).

```bash
node usr/lib/capsuleos/tools/lab/verify-kde-settings-parity-chain.mjs --id linux-opensuse
node usr/lib/capsuleos/tools/lab/verify-kde-settings-parity-chain.mjs --id linux-mx-kde
node usr/lib/capsuleos/tools/lab/verify-kde-settings-parity-chain.mjs --id linux-debian-kde
```

---

## Gc7 — Clôture

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
node usr/lib/capsuleos/tools/lab/run-cross-regression-gates.mjs
node usr/lib/capsuleos/tools/validate-os-reproduction-coherence.mjs
```

Handoff : [linux-kde-neon-g-coherence-handoff.md](linux-kde-neon-g-coherence-handoff.md)

**Commit** : `KDE Neon Gc7 : clôture campagne G-coherence.`

---

## Références

- [ground-truth-kde.md](../ground-truth-kde.md)
- [branche-plasma-kde.md](../branche-plasma-kde.md)
- [processus-branchement-noyau.md](../processus-branchement-noyau.md)
- [linux-kde-neon-vp-residual.md](linux-kde-neon-vp-residual.md)
