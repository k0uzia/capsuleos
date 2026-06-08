---
name: capsuleos-vm-distribution-manifest
description: Collects and replicates VM distribution ground truth via proc/ manifests — apps, fonts, mimetypes, icons, wallpapers — for any Linux vendor/toolkit. Use when enriching media catalogs, running ManV→ManΣ chain, or onboarding a new registryId from lab VM.
---

# Manifeste distribution VM (ManΣ)

## Quand invoquer

- Nouveau `registryId` avec VM lab (**M**) — avant catalogue apps ou import assets massif
- Enrichissement médias (polices, MIME, places, emblems, symbolic, panel, fonds)
- Utilisateur cite « manifeste », « proc/ », « playbook manifeste », « amélioration continue multi-vendor »
- **Avant** `run-vendor-assets-pipeline.mjs` si le lot médias n'est pas encore structuré

## Prédicats

| Symbole | Gate |
|---------|------|
| **ManV** | `proc/<id>/distribution-manifest.json` collecté |
| **ManS** | `smoke-vm-distribution-manifest.mjs` OK |
| **PbM** | Playbook `*-manifest-playbook.json` généré |
| **ManA** | Approbation humaine (`approve-vm-distribution-manifest.mjs`) |
| **ManSt** | Staging VM (`run-manifest-staging-on-vm.mjs`) |
| **ManI** | Import `import-manifest-staging.mjs` |
| **ManΣ** | ManV ∧ ManS ∧ ManA ∧ ManI |

Contrat : `etc/capsuleos/contracts/vm-distribution-manifest.json`  
Catalogue médias : `etc/capsuleos/contracts/vm-manifest-media-catalog.json` (toolkits + vendors + `extends`)

## Chaîne unique (tous vendors)

```bash
node usr/lib/capsuleos/tools/lab/run-manifest-replication-chain.mjs --id <registryId> --auto --write
```

Étapes internes : `ensure-vm-manifest-vendor` → collecte SSH → smoke → playbook → approbation → staging VM → import.

## Vendor futur (scaffold catalogue)

```bash
node usr/lib/capsuleos/tools/lab/ensure-vm-manifest-vendor.mjs --id linux-<vendor> --write
```

Crée une entrée `vendors.<vendor>` héritant du toolkit du registre ; affiner après première collecte.

## Résolution catalogue (hôte)

- Toolkit : `gnome`, `cinnamon`, `kde` — blocs réutilisables
- Vendor : `ubuntu`, `rocky`, `fedora`, `alma`, `mint`, `popos`, `opensuse`, …
- Héritage : `extends: "toolkit:gnome"` ou `extends: "vendor:rocky"`
- Placeholders : `{vendor}` dans chemins `capsule` / `panel`

Lib : `vm-manifest-media-catalog-lib.mjs` → `resolveVendorMediaSpec()`, `encodeMediaCatalogForVm()`.

## Dérivation AppV

Après **ManV** :

```bash
node usr/lib/capsuleos/tools/lab/collect-vm-apps-inventory.mjs --id <registryId> --write
```

Remplace le scrape bash partiel — source : `manifest.applications`.

## Règles formelles

```
R-MAN0  M ∧ ¬ManV   → run-manifest-replication-chain (ensure + collect)
R-MAN1  ManV ∧ ¬ManS → smoke
R-MAN2  ManS ∧ ¬PbM  → generate-manifest-replication-playbook
R-MAN3  ManS ∧ ¬ManA → approve (manuel)
R-MAN4  ManA ∧ ¬ManSt → staging VM
R-MAN5  ManSt ∧ ¬ManI → import-manifest-staging
R-APP1  ManV ∧ ¬AppV → collect-vm-apps-inventory
```

Résolution : `resolve-agent-action.mjs --scope formal` · alias `manifest-chain`.

## Import : staging vs legacy

| Méthode | Script | Usage |
|---------|--------|-------|
| **Recommandé** | `import-manifest-staging.mjs` | Lot centralisé `proc/<id>/staging/` |
| Legacy | `import-vm-manifest-assets.mjs` | Rsync direct `manifest.import.bundles` |

## Ne pas

- Hardcoder chemins `icons/gnome/yaru` — utiliser `manifest.media.iconPack` et le catalogue vendor
- Importer sans **ManA** (validation humaine sur écarts playbook)
- Dupliquer la logique catalogue dans un script vendor-spécifique

## Pairing

`os-clone-from-vm` · `asset-pipeline` · `os-linux` · `capsuleos-vendor-<vendor>` · `kernel-supervisor`

## Références

- [convention-manifest-vm.md](../../docs/convention-manifest-vm.md)
- [procedure-manifest-playbook.md](../../docs/procedure-manifest-playbook.md)
- [procedure-apps-catalog.md](../../docs/procedure-apps-catalog.md)
