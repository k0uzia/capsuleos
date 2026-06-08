# `proc/` — manifestes ground truth VM (CapsuleOS)

> **Ce n’est pas** le pseudo-système Linux `/proc`. Ici **proc** = *procedure cache* : dumps bruts et **manifestes distribution** collectés depuis les VM lab.

## Manifeste distribution (référence unique)

Chaque distribution lab possède un manifeste nommé d’après l’OS (`ubuntu-manifest.json`, `rocky-manifest.json`, …) plus le fichier canonique `distribution-manifest.json`.

| Fichier | Contenu |
|---------|---------|
| `proc/<registryId>/distribution-manifest.json` | Référence canonique |
| `proc/<registryId>/<distribution.slug>.json` | Alias lisible (ex. `ubuntu-manifest.json`) |
| `proc/<registryId>/desktop-entries-raw.json` | Vue apps brute (dérivée du manifeste) |
| `root/docs/inventaires/*-vm-apps-installed.json` | **AppV** curaté (contrat + manifeste) |

Le manifeste couvre :

- **Applications** : deb, snap, flatpak, user (`~/.local`) — multi-toolkit (GNOME, KDE, Cinnamon)
- **Médias réplication** : icônes apps résolues, fonds, thèmes, cibles `capsuleTarget`
- **Plan import** : bundles rsync vers `usr/share/capsuleos/assets/`

## Chaîne agentique

```bash
# 1. Collecte VM (script Python sur la VM via SSH)
node usr/lib/capsuleos/tools/lab/collect-vm-distribution-manifest.mjs --id linux-ubuntu --write --ssh

# 2. Gate structure + P0 contrat
node usr/lib/capsuleos/tools/lab/smoke-vm-distribution-manifest.mjs --id linux-ubuntu

# 3. Approbation (débloque import)
node usr/lib/capsuleos/tools/lab/approve-vm-distribution-manifest.mjs --id linux-ubuntu --write

# 4. Dérivation AppV + catalogue
node usr/lib/capsuleos/tools/lab/collect-vm-apps-inventory.mjs --id linux-ubuntu --write
node usr/lib/capsuleos/tools/lab/generate-apps-catalog.mjs --id linux-ubuntu --write
node usr/lib/capsuleos/tools/lab/generate-overview-apps-grid.mjs --id linux-ubuntu --write

# 5. Import lot médias (rsync)
node usr/lib/capsuleos/tools/lab/import-vm-manifest-assets.mjs --id linux-ubuntu --write
```

Prédicats : **ManV → ManS → ManA → ManI** — voir `etc/capsuleos/contracts/vm-distribution-manifest.json`.

## Moteur

- Script VM : `root/tools/lab/vm-distribution-manifest.py`
- Orchestration : `usr/lib/capsuleos/tools/lab/vm-manifest-lib.mjs`

Ne pas y placer de secrets. Committer après re-collecte VM validée.
