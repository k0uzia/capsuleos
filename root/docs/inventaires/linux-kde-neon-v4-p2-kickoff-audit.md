# Audit V4-P2 — Kickoff batches B2/B3

> **Prérequis** : V4-P1 clôturé (2026-06-09)  
> **registryId** : `linux-kde-neon`

## État actuel

| Gate | Résultat |
|------|----------|
| `smoke-kde-neon-kickoff.mjs` | ✅ 30/30 apps · 11 slots · toutes ouvertures OK |
| `generate-kde-neon-kickoff-data.mjs` | ✅ données VM → `mainMenu-data.js` |
| Icônes kickoff | ✅ `./assets/images/vendors/neon/kickoff/` |

Le smoke **structurel** passe : chaque app a un `dataLink`. L’écart V4-P2 est la **fidélité par app** : beaucoup de raccourcis B2/B3 ouvrent un slot générique (`profile`, `checklist`, `nemo`, `themes`) au lieu d’une surface reconnaissable VM.

## Mapping actuel → slot générique

| App (batch) | Desktop | Slot actuel | Cible V4-P2 |
|-------------|---------|-------------|-------------|
| **B2 — Utilitaires** |
| Spectacle | `org.kde.spectacle.desktop` | `profile` | slot `spectacle` ou stub capture |
| Ark | `org.kde.ark.desktop` | `nemo` | stub archive ou nemo OK |
| Sélecteur émoticônes | `org.kde.plasma.emojier.desktop` | `profile` | stub léger |
| TeXInfo / Help / Vim | divers | `profile` / `text_editor` | P2 backlog |
| **B3 — Système** |
| Centre d'informations | `org.kde.kinfocenter.desktop` | `profile` | slot `kinfocenter` |
| Surveillance système | `org.kde.plasma-systemmonitor.desktop` | `profile` | slot `systemmonitor` |
| KWallet / KeepSecret | kwallet* | `themes` | redirect Paramètres OK |
| Partition Manager | `partitionmanager` | `nemo` | stub disques |
| DrKonqi | `drkonqi` | `checklist` | stub crash viewer |
| KDEConnect (×3) | kdeconnect* | `profile` | stub connect |

**Absent du catalogue 30** (roadmap mentionne) : KCalc, KFind — à inventorier VM si ajout kickoff.

## Stratégie recommandée

1. **Inventaire VM** : `bash root/tools/lab/vm-kde-neon-inventory.sh` + refresh kickoff JSON
2. **Par app B2** : gabarit stub enrichi (titlebar Breeze + icône VM + 1 écran statique) sous `usr/share/capsuleos/linux/apps/`
3. **Profil** : enregistrer slot dans `etc/capsuleos/profiles/linux-kde-neon.json` + override skin si besoin
4. **dataLink** : pointer `mainMenu-data.js` vers le nouveau slot
5. **Smoke** : étendre `smoke-kde-neon-kickoff.mjs` — vérifier titre fenêtre / sélecteur app par batch B2/B3

## Ordre de priorité suggéré

| # | App | Effort | Impact visuel |
|---|-----|--------|---------------|
| 1 | Spectacle | ~2 h | capture écran = métier CapsuleOS |
| 2 | Info-centre (kinfocenter) | ~2 h | fiche matériel VM |
| 3 | System Monitor | ~1,5 h | graphes CPU/RAM |
| 4 | KDEConnect | ~2 h | appairage UI |
| 5 | KCalc / KFind | ~2 h chacun | si présents VM |

## Gates P2

```bash
node root/tools/lab/generate-kde-neon-kickoff-data.mjs
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-kickoff.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
```

**Critère sortie** : apps B2/B3 listées ouvrent un slot **documenté** (pas seulement `profile`) · smoke étendu vert.
