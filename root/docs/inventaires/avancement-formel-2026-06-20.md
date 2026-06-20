# Rapport d'avancement formel — CapsuleOS

> Généré : `2026-06-20T16:21:30.793Z` · Commit : `02eb9bc8 Update capsule-app-embed.js version across multiple Debian and Red Hat family distributions, and remove obsolete image references from KDE Neon inventory JSON files. Adjust timestamps and paths in various state and manifest files for consistency and accuracy.`
> Outil : `generate-formal-advancement-report.mjs` · Référence : [logique-formelle.md](../logique-formelle.md)

## 1. Synthèse globale

| Indicateur | État |
|------------|------|
| **H₂** (validate-all) | ✓ exit 0 — 0 gate(s) en échec |
| **M** (lab-inventory) | ✓ |
| Registries évalués | 9 |
| File réactivation | 13 ID(s) |

## 2. Posture par distribution (Linux actives)

| Registry | Tier | Toolkit | Posture | H₆ | ManΣ | AppΣ | Tf | Prochaine règle |
|----------|------|---------|---------|----|------|------|----|-----------------|
| linux-mint | P0 | cinnamon | clôturé | ✓ | ✓ | ✓ | ✓ | R-A1 |
| linux-ubuntu | P0 | gnome | clôturé | ✓ | ✓ | ✓ | ✓ | R-A1 |
| linux-fedora | P1 | gnome | clôturé | ✓ | ✓ | ✓ | ✓ | R-A1 |
| linux-kde-neon | P1 | kde | clôturé | ✓ | ✓ | ✓ | ✓ | R-H6-DONE |
| linux-opensuse | P1 | kde | amorçage | ✗ | ✗ | ✗ | ✗ | R-A1 |
| linux-popos | P2 | cosmic | clôturé | ✓ | ✓ | ✓ | ✓ | R-H6-DONE |
| linux-anduinos | P3 | gnome | clôturé | ✓ | ✓ | ✓ | ✓ | R-A1 |
| linux-rocky | P1 | gnome | clôturé | ✓ | ✓ | ✓ | ✓ | R-H6-DONE |
| linux-alma | P3 | gnome | clôturé | ✓ | ✓ | ✓ | ✓ | R-A1 |

## 3. Chaîne manifeste (ManΣ)

| Registry | ManV | ManS | PbM | ManA | ManSt | ManI | proc/ | Playbook pull/drift |
|----------|------|------|-----|------|-------|------|-------|---------------------|
| linux-mint | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 134/0/43 |
| linux-ubuntu | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 1/0/118 |
| linux-fedora | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 0/0/128 |
| linux-kde-neon | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 0/15/16 |
| linux-opensuse | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — |
| linux-popos | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 0/0/92 |
| linux-anduinos | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 0/35/63 |
| linux-rocky | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 0/0/84 |
| linux-alma | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 0/0/72 |

## 4. Zones à ne pas perturber

- **linux-fedora** — H6 atteint via ancienne chaîne — manifeste à collecter sans toucher skin
- **linux-rocky** — Ne pas régresser shell/apps/fidélité — migration ManΣ en voie parallèle uniquement

## 5. Actions admissibles (priorité agent)

### linux-mint (Linux Mint (Cinnamon))

- **Règle** : `R-A1` — H₂ ∧ ¬A — vérification assets playbook
- **Commande** : `node usr/lib/capsuleos/tools/lab/verify-playbook-assets.mjs --registry linux-mint --strict`
- **Playbook général** : `R-PB4` — PbΣ — prêt H5 ciblé ou H6

### linux-ubuntu (Ubuntu 25.10)

- **Règle** : `R-A1` — H₂ ∧ ¬A — vérification assets playbook
- **Commande** : `node usr/lib/capsuleos/tools/lab/verify-playbook-assets.mjs --registry linux-ubuntu --strict`
- **Playbook général** : `R-PB4` — PbΣ — prêt H5 ciblé ou H6

### linux-fedora (Fedora Workstation)

- **Règle** : `R-A1` — H₂ ∧ ¬A — vérification assets playbook
- **Commande** : `node usr/lib/capsuleos/tools/lab/verify-playbook-assets.mjs --registry linux-fedora --strict`
- **Playbook général** : `R-PB4` — PbΣ — prêt H5 ciblé ou H6

### linux-kde-neon (KDE neon User Edition)

- **Règle** : `R-H6-DONE` — Chaîne formelle complète (shell + apps P0 + fidélité visuelle) — maintenance validate-all
- **Commande** : `node usr/lib/capsuleos/tools/validate-all.mjs`
- **Playbook général** : `R-PB4` — PbΣ — prêt H5 ciblé ou H6

### linux-opensuse (openSUSE Tumbleweed)

- **Règle** : `R-A1` — H₂ ∧ ¬A — vérification assets playbook
- **Commande** : `node usr/lib/capsuleos/tools/lab/verify-playbook-assets.mjs --registry linux-opensuse --strict`
- **Playbook général** : `R-PB1` — chaîne manifeste distribution incomplète

### linux-popos (Pop!_OS)

- **Règle** : `R-H6-DONE` — Chaîne formelle complète (shell + apps P0 + fidélité visuelle) — maintenance validate-all
- **Commande** : `node usr/lib/capsuleos/tools/validate-all.mjs`
- **Playbook général** : `R-PB4` — PbΣ — prêt H5 ciblé ou H6

### linux-anduinos (AnduinOS)

- **Règle** : `R-A1` — H₂ ∧ ¬A — vérification assets playbook
- **Commande** : `node usr/lib/capsuleos/tools/lab/verify-playbook-assets.mjs --registry linux-anduinos --strict`
- **Playbook général** : `R-PB4` — PbΣ — prêt H5 ciblé ou H6

### linux-rocky (Rocky Linux (GNOME))

- **Règle** : `R-H6-DONE` — Chaîne formelle complète (shell + apps P0 + fidélité visuelle) — maintenance validate-all
- **Commande** : `node usr/lib/capsuleos/tools/validate-all.mjs`
- **Playbook général** : `R-PB4` — PbΣ — prêt H5 ciblé ou H6

### linux-alma (AlmaLinux (GNOME))

- **Règle** : `R-A1` — H₂ ∧ ¬A — vérification assets playbook
- **Commande** : `node usr/lib/capsuleos/tools/lab/verify-playbook-assets.mjs --registry linux-alma --strict`
- **Playbook général** : `R-PB4` — PbΣ — prêt H5 ciblé ou H6

## 6. Recommandations de séquençage

- Agents : charger `vm-distribution-manifest` pour toute action Man* ; `os-clone-from-vm` pour patch skin post-ManΣ.

## 7. Artefacts

- JSON machine : `root/docs/inventaires/avancement-formel-2026-06-20.json`
- Régénérer : `node usr/lib/capsuleos/tools/lab/generate-formal-advancement-report.mjs --write`

