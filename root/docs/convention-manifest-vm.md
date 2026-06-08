# Convention — manifeste distribution VM

> Complète [convention-assets-depuis-vm.md](convention-assets-depuis-vm.md) et [procedure-apps-catalog.md](procedure-apps-catalog.md).

## Objectif

Un **manifeste par distribution** (`proc/<registryId>/ubuntu-manifest.json`, etc.) sert de **référence unique** ground truth :

- applications (deb, snap, flatpak, user) ;
- **médias v2** : polices, mimetypes, places, emblems, symbolic, panel, branding, fonds, icônes apps ;
- catalogue vendor : `etc/capsuleos/contracts/vm-manifest-media-catalog.json` ;
- plan d’import rsync groupé vers `usr/share/capsuleos/assets/`.

Le moteur est **multi-toolkit** (GNOME, KDE, Cinnamon) et **multi-vendor** (chemins snap/flatpak/deb).

## Prédicats

| Symbole | Gate |
|---------|------|
| **ManV** | `collect-vm-distribution-manifest.mjs --write --ssh` |
| **ManS** | `smoke-vm-distribution-manifest.mjs` |
| **ManA** | `approve-vm-distribution-manifest.mjs --write` |
| **PbM** | `generate-manifest-replication-playbook.mjs --write` |
| **ManSt** | `run-manifest-staging-on-vm.mjs --write` |
| **ManI** | `import-manifest-staging.mjs --write` (recommandé) |
| **ManΣ** | ManV ∧ ManS ∧ ManA ∧ ManI |
| **ManΣ′** | ManV ∧ PbM ∧ ManS ∧ ManA ∧ ManSt ∧ ManI |

Contrat : `etc/capsuleos/contracts/vm-distribution-manifest.json`.

## Chaîne

```bash
node usr/lib/capsuleos/tools/lab/run-manifest-replication-chain.mjs --id <registryId> --auto --write
# ou étape par étape :
node usr/lib/capsuleos/tools/lab/ensure-vm-manifest-vendor.mjs --id <registryId> --write
node usr/lib/capsuleos/tools/lab/collect-vm-distribution-manifest.mjs --id <registryId> --write --ssh
node usr/lib/capsuleos/tools/lab/smoke-vm-distribution-manifest.mjs --id <registryId>
node usr/lib/capsuleos/tools/lab/generate-manifest-replication-playbook.mjs --id <registryId> --write
node usr/lib/capsuleos/tools/lab/approve-vm-distribution-manifest.mjs --id <registryId> --write
node usr/lib/capsuleos/tools/lab/run-manifest-staging-on-vm.mjs --id <registryId> --write
node usr/lib/capsuleos/tools/lab/import-manifest-staging.mjs --id <registryId> --write
```

Catalogue médias v2 : blocs `toolkits` + `vendors` avec héritage `extends` — voir `vm-manifest-media-catalog-lib.mjs`.

**AppV** est dérivé du manifeste (plus de scrape bash partiel) :

```bash
node usr/lib/capsuleos/tools/lab/collect-vm-apps-inventory.mjs --id <registryId> --write
```

## Import rsync

Remplace le SCP fichier-par-fichier pour les lots définis dans `manifest.import.bundles` :

- icônes apps (`media.appIcons[].vmPaths`) ;
- fonds (`media.wallpapers`) ;
- extensions futures : mimetypes, emblems, fonts.

Traçabilité : `usr/share/capsuleos/assets/images/vendors/<vendor>/SOURCE-VM.txt`.

## Écarts contrat vs VM

Les apps **P0 simulées** (absentes VM lab) portent `onVm: false` dans `apps-catalog.json`. Le smoke manifeste les signale en **avertissement**, pas en erreur.
