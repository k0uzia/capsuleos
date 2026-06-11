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

## P1 résolus (scénarios overview — juin 2026)

| Écart | Résolution |
|-------|------------|
| Rocky Loupe (`visionneur_images`) — ¬ScΣ | Contrat `loupe-user-scenarios.json` · Li1–Li4 · `syncLoupeGnomeDataset` · smoke + captures |
| Rocky Papers (`visionneur_pdf`) — ¬ScΣ | Contrat `papers-user-scenarios.json` · Pa1–Pa4 · `syncPapersGnomeDataset` · navigation pages |
| Ubuntu Rhythmbox (`lecteur_multimedia`) — ¬ScΣ dash+overview | Contrat `rhythmbox-user-scenarios.json` · Rb1–Rb4 · override `rhythmbox.html` · smoke Ubuntu |
| KDE Discover store (`linux-kde-neon`) | `storeCatalogStatus: active` · **11** apps magasin · section « À découvrir » dans `discover-kde.js` · smoke `smoke-discover-kde-neon.mjs` |

Manifeste scénarios GNOME : **18 → 21** contrats (`gnome-user-scenarios-index.json`).

## P1 restants

| Domaine | Détail |
|---------|--------|
| Rocky Loupe / Papers | Polish visuel Vc ground truth (captures VM dédiées Papers) |
| Vc VM | Captures ground truth manquantes pour distros P1+ |
| KDE Discover store (openSUSE) | `storeCatalogStatus: deferred` — 0 apps magasin (priorité neon levée) |
| KDE neon VM lab | `192.168.123.52` hors réseau au 2026-06-11 — réinventaire plasma-discover/flatpak à reprendre |
| Pop!_OS COSMIC | Toolkit `cosmic` sans `slotSpecs` dédiés — résolution via `storeToolkit: gnome` |
| Inventaires VM | `*-vm-apps-installed.json` absent hors rocky/ubuntu/mint |

## P2 / maintenance

- Étendre `collect-vm-apps-inventory.mjs` pour KDE et COSMIC
- Parité `text_editor` Kate/COSMIC polish
- Formal-state `AppΣ` par distro après inventaires VM

## Références

- [architecture-catalogue-apps.md](architecture-catalogue-apps.md) § bootstrap overrides
- [procedure-apps-catalog.md](procedure-apps-catalog.md)
- [inventaires/linux-kde-neon-discover-closure.md](inventaires/linux-kde-neon-discover-closure.md)
- Contrat lab : `etc/capsuleos/contracts/linux-kde-neon-vm.json`
