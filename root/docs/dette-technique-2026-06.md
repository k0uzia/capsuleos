# Dette technique — juin 2026

Registre vivant des écarts connus CapsuleOS. Mis à jour à chaque cycle P0/P1.

## P0 résolus (cycle registryOverrides — juin 2026)

| Écart | Résolution |
|-------|------------|
| `registryOverrides` absent — `linux-popos`, `linux-anduinos`, `linux-opensuse`, `linux-kde-neon` | Générateurs `generate-registry-overrides.mjs` + skin scan |
| `linux-mint` — 5 apps P0 seulement | `generate-mint-registry-overrides.mjs` → **102** entrées depuis inventaire |
| `audit-gnome-overview-scenarios.mjs` crash | Contrat présent ; audit cinnamon/KDE documenté (skip overview GNOME) |
| Gate `validate-app-catalog-integrity.mjs` manquante | Ajoutée + intégrée `validate-ui-contracts-all.mjs` |
| Ubuntu store UI — smoke S5–S12 `deferred` | **Option A** : `CAPSULE_TEMPLATE_OVERRIDES.update_manager` → `update_manager_gnome.html` (comme Pop!_OS) ; branding snap-store conservé dans `presentation-bindings` (Centre d'applications, sources snap/deb/flatpak) ; smoke `smoke-gnome-software-scenarios.mjs --id linux-ubuntu` |

### Comptage overrides (post-cycle)

| registryId | apps |
|------------|------|
| linux-mint | 102 |
| linux-rocky | 22 |
| linux-alma | 25 |
| linux-fedora | 22 |
| linux-ubuntu | 12 |
| linux-popos | 26 |
| linux-anduinos | 23 |
| linux-kde-neon | 13 |
| linux-opensuse | 10 |

## P1 restants

| Domaine | Détail |
|---------|--------|
| Rocky Loupe / Papers | Parité P1 overview — slots ok, polish visuel Vc |
| Vc VM | Captures ground truth manquantes pour distros P1+ |
| KDE Discover store | `storeCatalogStatus: deferred` — neon + openSUSE (0 apps magasin) |
| Pop!_OS COSMIC | Toolkit `cosmic` sans `slotSpecs` dédiés — résolution via `storeToolkit: gnome` |
| Inventaires VM | `*-vm-apps-installed.json` absent hors rocky/ubuntu/mint |

## P2 / maintenance

- Étendre `collect-vm-apps-inventory.mjs` pour KDE et COSMIC
- Parité `text_editor` Kate/COSMIC polish
- Formal-state `AppΣ` par distro après inventaires VM

## Références

- [architecture-catalogue-apps.md](architecture-catalogue-apps.md) § bootstrap overrides
- [procedure-apps-catalog.md](procedure-apps-catalog.md)
