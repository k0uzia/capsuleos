# Rapport d'avancement formel — CapsuleOS

> Généré : `2026-06-08T19:32:36.996Z` · Commit : `7a53b42 Manifeste distribution VM multi-vendor et chaîne ManΣ réutilisable.`
> Outil : `generate-formal-advancement-report.mjs` · Référence : [logique-formelle.md](../logique-formelle.md)

## 1. Synthèse globale

| Indicateur | État |
|------------|------|
| **H₂** (validate-all) | ✗ exit 1 — 22 gate(s) en échec |
| **M** (lab-inventory) | ✓ |
| Registries évalués | 8 |
| File réactivation | 12 ID(s) |

### Blocages H₂ (ne pas merger sans plan)

- validate-link-integrity : 16 erreur(s)
- OS/linux/families/debian/ubuntu/index.html: cible introuvable ../../../usr/share/capsuleos/assets/images/toolkits/gnome/apps/overview/firmware-updater_firmware-updater.svg
- OS/linux/families/debian/ubuntu/index.html: cible introuvable ../../../usr/share/capsuleos/assets/images/toolkits/gnome/apps/overview/nm-connection-editor.svg
- OS/linux/families/debian/ubuntu/index.html: cible introuvable ../../../usr/share/capsuleos/assets/images/toolkits/gnome/apps/overview/snap-store_snap-store.svg
- OS/linux/families/debian/ubuntu/index.html: cible introuvable ../../../usr/share/capsuleos/assets/images/toolkits/gnome/apps/overview/desktop-security-center_desktop-security-center.svg
- OS/linux/families/debian/ubuntu/index.html: cible introuvable ../../../usr/share/capsuleos/assets/images/toolkits/gnome/apps/overview/baobab.png
- OS/linux/families/debian/ubuntu/index.html: cible introuvable ../../../usr/share/capsuleos/assets/images/toolkits/gnome/apps/overview/disks.png
- OS/linux/families/debian/ubuntu/index.html: cible introuvable ../../../usr/share/capsuleos/assets/images/toolkits/gnome/apps/overview/firefox_firefox.svg
- OS/linux/families/debian/ubuntu/index.html: cible introuvable ../../../usr/share/capsuleos/assets/images/toolkits/gnome/apps/overview/fonts.png
- OS/linux/families/debian/ubuntu/index.html: cible introuvable ../../../usr/share/capsuleos/assets/images/toolkits/gnome/apps/overview/gnome-language-selector.svg
- OS/linux/families/debian/ubuntu/index.html: cible introuvable ../../../usr/share/capsuleos/assets/images/toolkits/gnome/apps/overview/logs.png
- OS/linux/families/debian/ubuntu/index.html: cible introuvable ../../../usr/share/capsuleos/assets/images/toolkits/gnome/apps/overview/seahorse.png
- OS/linux/families/debian/ubuntu/index.html: cible introuvable ../../../usr/share/capsuleos/assets/images/toolkits/gnome/apps/overview/net.nokyan.Resources.svg
- OS/linux/families/debian/ubuntu/index.html: cible introuvable ../../../usr/share/capsuleos/assets/images/toolkits/gnome/apps/overview/update-manager.svg
- OS/linux/families/debian/ubuntu/index.html: cible introuvable ../../../usr/share/capsuleos/assets/images/toolkits/gnome/apps/overview/sysprof.png
- OS/linux/families/debian/ubuntu/index.html: cible introuvable ../../../usr/share/capsuleos/assets/images/toolkits/gnome/apps/overview/info.svg
- OS/linux/families/debian/ubuntu/index.html: cible introuvable ../../../usr/share/capsuleos/assets/images/toolkits/gnome/apps/overview/vim.svg
- validate-all : échec sur validate-assets-all.mjs
- 27 url(s) statique(s) introuvable(s)
- validate-all : échec sur validate-links-all.mjs

## 2. Posture par distribution (Linux actives)

| Registry | Tier | Toolkit | Posture | H₆ | ManΣ | AppΣ | Tf | Prochaine règle |
|----------|------|---------|---------|----|------|------|----|-----------------|
| linux-mint | P0 | cinnamon | socle H₂ | ✗ | ✗ | ✗ | ✗ | R-H1 |
| linux-ubuntu | P0 | gnome | manifeste en revue | ✗ | ✗ | ✓ | ✗ | R-H1 |
| linux-fedora | P1 | gnome | H6 sans ManΣ | ✓ | ✗ | ✗ | ✗ | R-H1 |
| linux-opensuse | P1 | kde | socle H₂ | ✗ | ✗ | ✗ | ✗ | R-H1 |
| linux-popos | P2 | cosmic | socle H₂ | ✗ | ✗ | ✗ | ✗ | R-H1 |
| linux-anduinos | P3 | gnome | socle H₂ | ✗ | ✗ | ✗ | ✗ | R-H1 |
| linux-rocky | P1 | gnome | H6 sans ManΣ | ✓ | ✗ | ✓ | ✓ | R-MAN0 |
| linux-alma | P3 | gnome | socle H₂ | ✗ | ✗ | ✗ | ✗ | R-H1 |

## 3. Chaîne manifeste (ManΣ)

| Registry | ManV | ManS | PbM | ManA | ManSt | ManI | proc/ | Playbook pull/drift |
|----------|------|------|-----|------|-------|------|-------|---------------------|
| linux-mint | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — |
| linux-ubuntu | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✓ | 60/54/5 |
| linux-fedora | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — |
| linux-opensuse | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — |
| linux-popos | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — |
| linux-anduinos | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — |
| linux-rocky | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — |
| linux-alma | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ | — |

## 4. Zones à ne pas perturber

- **linux-ubuntu** — Grille Aperçu référencée — import staging bloqué jusqu’à ManA
- **linux-fedora** — H6 atteint via ancienne chaîne — manifeste à collecter sans toucher skin
- **linux-rocky** — Ne pas régresser shell/apps/fidélité — migration ManΣ en voie parallèle uniquement

## 5. Actions admissibles (priorité agent)

### linux-mint (Linux Mint (Cinnamon))

- **Règle** : `R-H1` — ¬H₂ — gate validate-all (socle dépôt)
- **Commande** : `node usr/lib/capsuleos/tools/validate-all.mjs`
- **Playbook général** : `R-PB1` — chaîne manifeste distribution incomplète

### linux-ubuntu (Ubuntu 26.04 LTS)

- **Règle** : `R-H1` — ¬H₂ — gate validate-all (socle dépôt)
- **Commande** : `node usr/lib/capsuleos/tools/validate-all.mjs`
- **Playbook général** : `R-PB1` — chaîne manifeste distribution incomplète

### linux-fedora (Fedora Workstation)

- **Règle** : `R-H1` — ¬H₂ — gate validate-all (socle dépôt)
- **Commande** : `node usr/lib/capsuleos/tools/validate-all.mjs`
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

- **Règle** : `R-MAN0` — M ∧ ¬ManV — assurer catalogue vendor + collecte manifeste distribution
- **Commande** : `node usr/lib/capsuleos/tools/lab/run-manifest-replication-chain.mjs --id linux-rocky --write --max-steps 2`
- **Playbook général** : `R-PB4` — PbΣ — prêt H5 ciblé ou H6

### linux-alma (AlmaLinux (GNOME))

- **Règle** : `R-H1` — ¬H₂ — gate validate-all (socle dépôt)
- **Commande** : `node usr/lib/capsuleos/tools/validate-all.mjs`
- **Playbook général** : `R-PB1` — chaîne manifeste distribution incomplète

## 6. Recommandations de séquençage

- **H₂ rouge** — traiter les échecs validate-all avant toute extension skin transverse.
- **linux-ubuntu** — revue humaine playbook manifeste (ManA) puis staging/import ; évite les patchs overview/icônes manuels.
- **linux-rocky** — collecte manifeste en **voie parallèle** (R-MAN0) sans modifier `home/RedHat/Rocky/` tant que H₆ est la référence.
- Infrastructure ManΣ déployée — étendre à **linux-rocky** puis **linux-fedora** avant les toolkits stub (cinnamon, kde, cosmic).
- Toolkits stub (linux-mint, linux-opensuse, linux-popos) — ne pas forcer PbT avant branchement playbook toolkit.
- Agents : charger `vm-distribution-manifest` pour toute action Man* ; `os-clone-from-vm` pour patch skin post-ManΣ.

## 7. Artefacts

- JSON machine : `root/docs/inventaires/avancement-formel-2026-06-08.json`
- Régénérer : `node usr/lib/capsuleos/tools/lab/generate-formal-advancement-report.mjs --write`

