# Rapport d'avancement formel — CapsuleOS

> Généré : `2026-06-08T21:58:19.333Z` · Commit : `f4d2d70 Phase 1d Ubuntu : refs icon-pack manifeste et drift à zéro.`
> Outil : `generate-formal-advancement-report.mjs` · Référence : [logique-formelle.md](../logique-formelle.md)

## 1. Synthèse globale

| Indicateur | État |
|------------|------|
| **H₂** (validate-all) | ✓ exit 0 — 0 gate(s) en échec |
| **M** (lab-inventory) | ✓ |
| Registries évalués | 8 |
| File réactivation | 12 ID(s) |

## 2. Posture par distribution (Linux actives)

| Registry | Tier | Toolkit | Posture | H₆ | ManΣ | AppΣ | Tf | Prochaine règle |
|----------|------|---------|---------|----|------|------|----|-----------------|
| linux-mint | P0 | cinnamon | socle H₂ | ✗ | ✗ | ✗ | ✗ | R-H1 |
| linux-ubuntu | P0 | gnome | amorçage | ✗ | ✓ | ✓ | ✓ | R-A1 |
| linux-fedora | P1 | gnome | H6 sans ManΣ | ✓ | ✗ | ✗ | ✗ | R-SHELL-POLISH |
| linux-opensuse | P1 | kde | socle H₂ | ✗ | ✗ | ✗ | ✗ | R-H1 |
| linux-popos | P2 | cosmic | socle H₂ | ✗ | ✗ | ✗ | ✗ | R-H1 |
| linux-anduinos | P3 | gnome | socle H₂ | ✗ | ✗ | ✗ | ✗ | R-H1 |
| linux-rocky | P1 | gnome | H6 sans ManΣ | ✓ | ✗ | ✓ | ✓ | R-MAN3 |
| linux-alma | P3 | gnome | socle H₂ | ✗ | ✗ | ✗ | ✗ | R-H1 |

## 3. Chaîne manifeste (ManΣ)

| Registry | ManV | ManS | PbM | ManA | ManSt | ManI | proc/ | Playbook pull/drift |
|----------|------|------|-----|------|-------|------|-------|---------------------|
| linux-mint | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — |
| linux-ubuntu | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 1/0/118 |
| linux-fedora | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | 55/44/29 |
| linux-opensuse | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — |
| linux-popos | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — |
| linux-anduinos | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — |
| linux-rocky | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | 9/54/21 |
| linux-alma | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — |

## 4. Zones à ne pas perturber

- **linux-fedora** — H6 atteint via ancienne chaîne — manifeste à collecter sans toucher skin
- **linux-rocky** — Ne pas régresser shell/apps/fidélité — migration ManΣ en voie parallèle uniquement

## 5. Actions admissibles (priorité agent)

### linux-mint (Linux Mint (Cinnamon))

- **Règle** : `R-H1` — ¬H₂ — gate validate-all (socle dépôt)
- **Commande** : `node usr/lib/capsuleos/tools/validate-all.mjs`
- **Playbook général** : `R-PB1` — chaîne manifeste distribution incomplète

### linux-ubuntu (Ubuntu 26.04 LTS)

- **Règle** : `R-A1` — H₂ ∧ ¬A — vérification assets playbook
- **Commande** : `node usr/lib/capsuleos/tools/lab/verify-playbook-assets.mjs --registry linux-ubuntu --strict`
- **Playbook général** : `R-PB2` — toolkit

### linux-fedora (Fedora Workstation)

- **Règle** : `R-SHELL-POLISH` — H6 ∧ ¬Shell₁ — polish top bar / dash / Firefox / Nautilus
- **Commande** : `CAPSULE_HTTP_BASE=http://127.0.0.1:5500 node usr/lib/capsuleos/tools/lab/smoke-rocky-shell-polish.mjs --playwright && node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs`
- **Playbook général** : `R-PB4` — PbΣ — prêt H5 ciblé ou H6

### linux-opensuse (openSUSE Tumbleweed)

- **Règle** : `R-H1` — ¬H₂ — gate validate-all (socle dépôt)
- **Commande** : `node usr/lib/capsuleos/tools/validate-all.mjs`
- **Playbook général** : `R-PB1` — chaîne manifeste distribution incomplète

### linux-popos (Pop!_OS)

- **Règle** : `R-H1` — ¬H₂ — gate validate-all (socle dépôt)
- **Commande** : `node usr/lib/capsuleos/tools/validate-all.mjs`
- **Playbook général** : `R-PB1` — chaîne manifeste distribution incomplète

### linux-anduinos (AnduinOS)

- **Règle** : `R-H1` — ¬H₂ — gate validate-all (socle dépôt)
- **Commande** : `node usr/lib/capsuleos/tools/validate-all.mjs`
- **Playbook général** : `R-PB1` — chaîne manifeste distribution incomplète

### linux-rocky (Rocky Linux (GNOME))

- **Règle** : `R-MAN3` — ManS ∧ PbM ∧ ¬ManA — approbation manifeste (humain)
- **Commande** : `node usr/lib/capsuleos/tools/lab/approve-vm-distribution-manifest.mjs --id linux-rocky --write`
- **Playbook général** : `R-PB4` — PbΣ — prêt H5 ciblé ou H6

### linux-alma (AlmaLinux (GNOME))

- **Règle** : `R-H1` — ¬H₂ — gate validate-all (socle dépôt)
- **Commande** : `node usr/lib/capsuleos/tools/validate-all.mjs`
- **Playbook général** : `R-PB1` — chaîne manifeste distribution incomplète

## 6. Recommandations de séquençage

- Toolkits stub (linux-mint, linux-opensuse, linux-popos) — ne pas forcer PbT avant branchement playbook toolkit.
- Agents : charger `vm-distribution-manifest` pour toute action Man* ; `os-clone-from-vm` pour patch skin post-ManΣ.

## 7. Artefacts

- JSON machine : `root/docs/inventaires/avancement-formel-2026-06-08.json`
- Régénérer : `node usr/lib/capsuleos/tools/lab/generate-formal-advancement-report.mjs --write`

