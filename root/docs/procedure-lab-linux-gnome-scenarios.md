# Procédure lab — scénarios pédagogiques GNOME (tous vendors)

> **Objectif** : appliquer le pattern **contrat → validateur → smoke → capture** sur tout skin toolkit GNOME, sans dupliquer la procédure par distro.

**Référence modèle Alma (C15–C25)** : [procedure-lab-linux-alma-gnome.md](procedure-lab-linux-alma-gnome.md)  
**Pattern technique** : [procedure-scenarios-pedagogiques-gnome.md](procedure-scenarios-pedagogiques-gnome.md)  
**Overview → slot** : [procedure-playbook-gnome-apps-overview.md](procedure-playbook-gnome-apps-overview.md)

---

## 1. Périmètre

| Vendor GNOME | `registryId` | Procédure lab VM |
|--------------|--------------|------------------|
| Rocky Linux 10 | `linux-rocky` | [procedure-lab-linux-rocky-gnome.md](procedure-lab-linux-rocky-gnome.md) |
| AlmaLinux 10 | `linux-alma` | [procedure-lab-linux-alma-gnome.md](procedure-lab-linux-alma-gnome.md) |
| Fedora | `linux-fedora` | [procedure-lab-linux-rocky-gnome.md](procedure-lab-linux-rocky-gnome.md) (infra identique) |
| Ubuntu GNOME | `linux-ubuntu` | [procedure-lab-linux-rocky-gnome.md](procedure-lab-linux-rocky-gnome.md) + overrides catalogue |

Cette procédure couvre **uniquement la couche scénarios** — complémentaire aux procédures clone VM ci-dessus.

---

## 2. Prérequis

| Critère | Vérification |
|---------|--------------|
| **AppΣ** structurel | `run-apps-lab.mjs --id <registryId>` vert |
| Π slot ≥ 85 | `linux-<distro>-parity-index.json` |
| HTTP local | `python3 -m http.server 5500` ou 5501 |
| Playwright | Chromium headless (smokes scénarios) |
| VM SSH (optionnel) | Inventaire ground truth — [lab-vm-rhel-wayland.md](lab-vm-rhel-wayland.md) |

```bash
node usr/lib/capsuleos/tools/lab/audit-gnome-overview-scenarios.mjs --id linux-alma
```

---

## 3. Cycle type (un slot)

| # | Action | Livrable |
|---|--------|----------|
| 1 | Sonde VM SSH | `linux-<distro>-<slot>-vm-inventory.json` |
| 2 | Contrat scénarios | `etc/capsuleos/contracts/<slot>-user-scenarios.json` |
| 3 | Kernel + gabarit | `data-<prefix>-gnome-*` dans toolkit partagé |
| 4 | Validateur | `validate-<slot>-user-scenarios.mjs` |
| 5 | Smoke | `smoke-gnome-<slot>-scenarios.mjs` |
| 6 | Captures | `capture-capsule-<slot>-views.mjs` |
| 7 | Index manifeste | entrée dans `gnome-user-scenarios-index.json` |
| 8 | Parity index | champ `scenarios` sur le slot |
| 9 | Gates | `validate-gnome-user-scenarios-all` + `validate-all` |

---

## 4. Commandes copy-paste

### Audit overview (début de cycle)

```bash
node usr/lib/capsuleos/tools/lab/audit-gnome-overview-scenarios.mjs --id linux-alma
```

### Gate contrats (tous slots)

```bash
node usr/lib/capsuleos/tools/validate-gnome-user-scenarios-all.mjs
```

### Smoke un scénario

```bash
CAPSULE_HTTP_BASE=http://127.0.0.1:5501 \
  node usr/lib/capsuleos/tools/lab/smoke-gnome-software-scenarios.mjs \
  --id linux-alma --scenario S1
```

### Captures Capsule

```bash
CAPSULE_HTTP_BASE=http://127.0.0.1:5501 \
  node usr/lib/capsuleos/tools/lab/capture-capsule-software-views.mjs --id linux-alma
```

### Clôture skin Linux

```bash
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
```

---

## 5. Slots livrés (manifeste juin 2026)

Voir `etc/capsuleos/contracts/gnome-user-scenarios-index.json` — **12 contrats** :

`update_manager`, `text_editor`, `calculator`, `themes`, `clocks`, `calendar`, `baobab`, `tour`, `snapshot`, `characters`, `system_monitor`, `screenshot`.

---

## 6. Backlog P0 overview (C26+)

| Cycle | Slot | Priorité |
|-------|------|----------|
| C26 | `nemo` (Fichiers) | P0 dash |
| C27 | `firefox` | P0 dash |
| C28 | `terminal` | P0 dash + grid |
| C29 | `librewriter` | P0 dock + grid |
| C30 | `checklist` | P0 capsuleOnly |

Détail gaps : [procedure-playbook-gnome-apps-overview.md §6](procedure-playbook-gnome-apps-overview.md#6-alma--tableau-overview-juin-2026).

---

## 7. Distinction domaines

| Domaine | Orchestrateur | Ne pas fusionner |
|---------|---------------|------------------|
| Apps structurel | `run-apps-lab.mjs` | — |
| Scénarios pédagogiques | cette procédure | Paramètres GNOME |
| Paramètres GNOME | `run-gnome-settings-lab.mjs` | Apps scénarios |
| Terminal commandes | `terminal-replication-chain` | Ptyxis chrome seul |
