# Roadmap v11 — parité visuelle apps (post-instrumentation)

> **Suite** du commit post-Gc (Se+ 10 effets, CredΣ 56, AppVc PNG) — objectif **diff visible** VM ↔ Capsule.  
> Prédicats cibles : **AppVv+Vm**, comparaison réelle **AppVp→ok**, baseline **KdVp** sans drift.

| Métadonnée | Valeur |
|------------|--------|
| **registryId** | `linux-kde-neon` |
| **Prérequis** | AppVc ✅ · SeΣ ✅ · CredΣ 56 smokeOk |
| **VM lab** | `capsule@192.168.122.48` (inventaire) · `goupil@192.168.123.52` (virsh) |
| **HTTP lab** | `CAPSULE_HTTP_BASE=http://127.0.0.1:8765` |

## Phases

| Phase | Pallier | Action | Gate / artefact |
|-------|---------|--------|-----------------|
| V11a | 0 | Captures VM apps P0 | `collect-vm-apps-visual-investigation.mjs --id linux-kde-neon --filter P0 --ssh` |
| V11b | 1 | Re-collect Capsule + enrich | `collect-capsule-apps-visual-investigation.mjs` · `enrich-apps-visual-investigation-parity.mjs` |
| V11c | 2 | Compare baseline shell | `capture-clone-surfaces.mjs --id linux-kde-neon --compare` |
| V11d | 3 | Clôture écarts P0 (CSS/HTML) | `linux-kde-neon-vp-residual.md` · patch skin par slot |
| V11e | 4 | Passe intégrale | `run-kde-neon-pass.mjs --write` vert |

## Apps P0 (7)

`themes`, `nemo`, `firefox`, `terminal`, `text_editor`, `update_manager`, `lecteur_multimedia`

Captures Capsule : `captures/linux-kde-neon/apps-visual-capsule/` (commit post-Gc).

## Critère de succès visible

Pour chaque app P0 : **capture VM + capture Capsule + `visualMatch` classé `ok` ou `accepted`** après patch skin, pas seulement `partial` heuristique.

## Hors scope v11

- Cred 149 scénarios Mint (Cred profondeur comportementale, pas pixel)
- Se matrice Cinnamon 516 lignes (campagnes Se VM ultérieures)
- Propagation dérivés v10 (openSUSE, MX-KDE, Debian-KDE)

## Recette

```bash
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/collect-vm-apps-visual-investigation.mjs --id linux-kde-neon --filter P0 --ssh
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/collect-capsule-apps-visual-investigation.mjs --id linux-kde-neon
node usr/lib/capsuleos/tools/lab/enrich-apps-visual-investigation-parity.mjs --id linux-kde-neon --filter P0
CAPSULE_HTTP_BASE=http://127.0.0.1:8765 node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --id linux-kde-neon --compare
```

## Références

- Post-Gc : commit `d6dc5b65`
- G-coherence : [linux-kde-neon-roadmap-g-coherence.md](linux-kde-neon-roadmap-g-coherence.md)
- Écarts historiques : [linux-kde-neon-vp-residual.md](linux-kde-neon-vp-residual.md)
