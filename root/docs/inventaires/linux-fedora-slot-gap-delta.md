# SlotMap / GapΔ — linux-fedora

> Généré : `2026-06-10T22:01:07.293Z` · Toolkit : **gnome** · [convention-reproduction-parfaite.md](../convention-reproduction-parfaite.md) §2c

```bash
node usr/lib/capsuleos/tools/lab/resolve-slot-gap-delta.mjs --id linux-fedora --write
```

## Synthèse

| Indicateur | Valeur |
|------------|--------|
| Apps VM | 33 |
| Slots mappés | 17 |
| Réutilisation Σ (ReuseΣ) | 11 |
| contentGaps ouverts | 8 |
| Écarts catalogue P0 | 0 |
| Apps VM non mappées | 0 |
| **GapΔ structurel vide** | ✗ non — campagne ciblée |
| Dette parité P0 (sans gap ouvert) | 0 |
| **RealΣ** (Vp ∧ VΣ ∧ depth≠partial) | 1/7 slots · registre ✗ |

## Phases CR

- Configurées : CR-0, CR-1, CR-2, CR-3, CR-4, CR-5, CR-6
- Après skip C9 : CR-0, CR-1, CR-2, CR-3, CR-5, CR-6
- Sautées :
  - **CR-4** — StoreG/Σ — byRegistry présent sans gaps catalog/content

## Recommandations (ordre)

1. **Clôturer réalisme vécu — Vp + VΣ + profondeur P0 full** (`RealΣ`)
   `node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --id linux-fedora`
1. **Captures / parité chrome ciblée** (`C9`)
   `CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/capture-capsule-software-views.mjs --id linux-fedora`
1. **Analyse fonctionnelle / scénarios slot** (`C9`)
   `node usr/lib/capsuleos/tools/lab/run-apps-lab.mjs --id linux-fedora`

## SlotMap

| Slot | Priorité | Catalogue | ReuseΣ | visualMatch | depth | RealΣ | Gaps |
|------|----------|-----------|--------|-------------|-------|-------|------|
| calendar | P1 | ok | ✓ | unknown | partial | — | 0 |
| calculator | P0 | ok | — | partial | full | ✗ | 1 |
| snapshot | P1 | ok | ✓ | unknown | partial | — | 0 |
| characters | P2 | ok | ✓ | unknown | partial | — | 0 |
| text_editor | P0 | ok | — | partial | full | ✗ | 1 |
| nemo | P0 | ok | — | partial | full | ✗ | 1 |
| firefox | P0 | ok | — | partial | partial | ✗ | 2 |
| clocks | P1 | ok | ✓ | unknown | partial | — | 0 |
| librewriter | P2 | partiel | ✓ | unknown | full | — | 0 |
| update_manager | P0 | ok | ✓ | ok | full | ✓ | 0 |
| visionneur_images | P1 | ok | ✓ | unknown | partial | — | 0 |
| system_monitor | P2 | ok | ✓ | unknown | partial | — | 0 |
| visionneur_pdf | P1 | ok | ✓ | unknown | partial | — | 0 |
| themes | P0 | ok | — | partial | full | ✗ | 1 |
| terminal | P0 | ok | — | partial | full | ✗ | 1 |
| baobab | P2 | ok | ✓ | unknown | partial | — | 0 |
| tour | P2 | ok | ✓ | unknown | partial | — | 0 |

## GapΔ — contentGaps ouverts

- **—** · Vc · high — VΣ non clôturé — matrice absente
- **calculator** · chrome · high — parityDebt auto — visualMatch=partial ; cible Vp (RealΣ = Vp ∧ VΣ ∧ depth≠partial)
- **text_editor** · chrome · high — parityDebt auto — visualMatch=partial ; cible Vp (RealΣ = Vp ∧ VΣ ∧ depth≠partial)
- **nemo** · chrome · high — parityDebt auto — visualMatch=partial ; cible Vp (RealΣ = Vp ∧ VΣ ∧ depth≠partial)
- **firefox** · chrome · high — parityDebt auto — visualMatch=partial ; cible Vp (RealΣ = Vp ∧ VΣ ∧ depth≠partial)
- **firefox** · interaction · medium — functionalDepth=partial sur P0 — cible profondeur full (RealΣ)
- **themes** · chrome · high — parityDebt auto — visualMatch=partial ; cible Vp (RealΣ = Vp ∧ VΣ ∧ depth≠partial)
- **terminal** · chrome · high — parityDebt auto — visualMatch=partial ; cible Vp (RealΣ = Vp ∧ VΣ ∧ depth≠partial)

