---
name: capsuleos-visual-parity-lab
description: Runs autonomous VM ↔ Capsule visual parity passes with PNG captures and JSON event journals. Use when comparing lab VM screenshots to Capsule skins, running capture-capsule-*, vm-*-capture-host, compare-*-visual-pass, or when the user asks for visual parity, lab captures, or event logging without manual bash steps.
---

# Passe visuelle lab (autonome)

## Quand invoquer

- Utilisateur cite **captures visuelles**, **parité VM/Capsule**, **compare visual pass**
- Après refonte skin GNOME (Rocky, Fedora, Ubuntu…)
- **Ne pas** demander à l'utilisateur de lancer les scripts bash à la main — **exécuter** l'orchestrateur

## Commande unique (imposée)

```bash
node usr/lib/capsuleos/tools/lab/run-visual-parity-pass.mjs --id <registryId>
```

Exemples :

```bash
node usr/lib/capsuleos/tools/lab/run-visual-parity-pass.mjs --id linux-ubuntu
node usr/lib/capsuleos/tools/lab/run-visual-parity-pass.mjs --id linux-fedora
node usr/lib/capsuleos/tools/lab/run-visual-parity-pass.mjs --id linux-rocky
```

Options utiles :

| Option | Effet |
|--------|--------|
| `--force-remote-vm` | VM via SSH + D-Bus screenshot (sans virsh) |
| `--capsule-only` | Playwright uniquement |
| `--vm-only` | VM uniquement |
| `--skip-compare` | Pas de rapport paires |

## Ce que l'orchestrateur fait seul

1. Vérifie `etc/capsuleos/lab-inventory.json` (gitignoré)
2. Démarre `python3 -m http.server` sur `CAPSULE_HTTP_BASE` si le port est fermé
3. **VM** : `vm-*-capture-host.sh` (virsh) → repli `vm-gnome-visual-capture-remote.sh` (SSH)
4. **Capsule** : `capture-capsule-<vendor>.mjs` (Playwright)
5. **Compare** : `compare-<vendor>-visual-pass.mjs`
6. Écrit le **journal événements** : `root/docs/inventaires/<registryId>-visual-parity-events.json`

## Prérequis (vérifier avant d'abandonner)

| Prérequis | Commande diagnostic |
|-----------|---------------------|
| Inventaire lab | `node usr/lib/capsuleos/tools/lab/lab-ssh.mjs --id <registryId>` |
| Bootstrap VM | `ssh … 'bash -s' < root/tools/lab/vm-<vendor>-lab-bootstrap.sh` |
| Playwright | `PLAYWRIGHT_CHROME` ou Chromium dans `~/.cache/ms-playwright/` |
| virsh (optionnel) | `virsh -c qemu:///system list --all` — si timeout → `--force-remote-vm` |

## Échecs fréquents → action agent

| Symptôme | Action autonome |
|----------|-----------------|
| `virsh` timeout | Relancer ; si échec persistant → `--force-remote-vm` (D-Bus screenshot, souvent bloqué en SSH) |
| 0 PNG VM | SSH bootstrap + `wmctrl`/`xdotool` sur la VM |
| Playwright introuvable | `npx playwright install chromium` ou `PLAYWRIGHT_CHROME=/usr/bin/chromium` |
| Paires incomplètes | Lire journal JSON + rapport `linux-*-comparaison-visuelle.md`, corriger skin puis relancer |

## Fichiers produits

| Type | Chemin |
|------|--------|
| PNG VM | `usr/share/capsuleos/assets/images/vendors/<vendor>/inventory/<vendor>-vm/` |
| PNG Capsule | `…/inventory/<vendor>-capsule/` |
| Rapport paires | `root/docs/inventaires/linux-<vendor>-comparaison-visuelle.md` |
| Journal événements | `root/docs/inventaires/linux-<vendor>-visual-parity-events.json` |
| Manifest scripts | `root/tools/lab/visual-parity-manifest.json` |

## Registres supportés

`linux-rocky` · `linux-fedora` · `linux-ubuntu` — ajouter une entrée dans `visual-parity-manifest.json` pour un nouveau vendor.

## Suite logique (après Vp)

Quand l'utilisateur exige **menus, transitions, ombres à 100 %** :

```bash
node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --id <registryId>
```

Skill : `ui-state-effects-replication` — prédicats **Ve → Vx → Vm → Vμ → VΣ**.

## Pairing

`os-clone-from-vm` · `ui-state-effects-replication` · `capsuleos-vendor-*` · `gnome-hig-replication`

## Références

- [procedure-lab-linux-ubuntu-gnome.md](../../docs/procedure-lab-linux-ubuntu-gnome.md)
- [inventaire-parite-ubuntu.md](../../docs/inventaire-parite-ubuntu.md)
- [lab-vm-rhel-wayland.md](../../docs/lab-vm-rhel-wayland.md) — virsh vs SSH screenshot
