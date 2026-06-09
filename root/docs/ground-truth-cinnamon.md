# Ground truth Cinnamon — Linux Mint

> **Pivot** : juin 2026 — retour au cloisonnement Cinnamon (abandon branche KDE active).  
> **Modèle** : miroir de la chaîne Cred* et du schéma ground-truth KDE (prédicats nommés, contrat JSON, orchestrateur lab).  
> **registryId** : `linux-mint` · **VM** : `capsule@192.168.1.146`

**Contrat machine** : [`etc/capsuleos/contracts/cinnamon-ground-truth-chain.json`](../../etc/capsuleos/contracts/cinnamon-ground-truth-chain.json)  
**Cartographie** : `node usr/lib/capsuleos/tools/lab/map-cinnamon-ground-truth-gaps.mjs --id linux-mint --write`  
**Orchestrateur** : `node usr/lib/capsuleos/tools/lab/run-cinnamon-formal-chain.mjs --id linux-mint`

---

## 1. Positionnement

Linux Mint n'utilise **pas** GNOME Shell ni Plasma. Le ground truth opérationnel est **Cinnamon 6.6** (Muffin, Nemo, mint-*). CapsuleOS modélise cela comme toolkit `cinnamon` distinct.

| Dimension | Ground truth | CapsuleOS |
|-----------|--------------|-----------|
| DE | Cinnamon 6.6 / Muffin | `toolkit.cinnamon`, `cinnamon-window-behaviors.js` |
| Explorateur | Nemo | template `nemo`, slot `data-link="nemo"` |
| Menu | mint menu + cs-* | `mainMenu-data-cinnamon.js` |
| Assets shell | `/usr/share/icons`, mint panel | `toolkits/cinnamon/`, `vendors/mint/` |
| Parité structurelle | Campagne C0–C10 | `linux-mint-parity-index.json` |
| Crédibilité | Campagne v3 | Chaîne **Cred*** → **CredΣ** |

Docs liées : [paradigme-toolkit-cinnamon.md](paradigme-toolkit-cinnamon.md) · [recette-clone-mint-integral.md](recette-clone-mint-integral.md) · [campagne-credibilite-pedagogique.md](campagne-credibilite-pedagogique.md)

---

## 2. Prédicats Cin*

| Symbole | Signification | Vérification |
|---------|---------------|--------------|
| **CinI** | Inventaire VM | `linux-mint-vm.json` + `collectedAt` |
| **CinM** | ManΣ proc/ | `integration-pass-*.json`, drift=0 |
| **CinA** | Assets clone | `validate-clone-assets.mjs --id linux-mint` |
| **CinC** | Cloisonnement | `validate-toolkit-paradigm.mjs --id linux-mint` |
| **CinS** | Shell parity | panel 6/6, UI 8/8, géométrie ≤1 px |
| **CinΠ** | Parité globale | `pi_global` ≥ 100 |
| **CinCred** | Crédibilité | **CredΣ** (130 scénarios, 43 apps π=100) |
| **CinΣ** | Clôture Cinnamon | CinI ∧ … ∧ CinCred |

Extension live : **CinCred_live** — batch HTTP `smoke-app-fidelity-all.mjs` (non skip).

---

## 3. Noyau & composants

| Composant | Fichier noyau / skin | Gate |
|-----------|---------------------|------|
| Embed Cinnamon | `contentLoader.js` — `CINNAMON_PANEL_MENU_SKINS` | recette § Phase 3 |
| Panel | `home/Debian/Mint/style/mint-panel.css` | panel browser 6/6 |
| Menu | `mainMenu.skin.css` + data cinnamon | validate-toolkit-paradigm |
| WM | `cinnamon-window-behaviors.js` | ui-state windowChrome |
| Nemo ctx | `bindNemoContextMenu` | paradigm + Cred scénarios |
| Icônes apps | `toolkits/cinnamon/apps/` | ManΣ drift=0 |

---

## 4. Lien Cred*

La chaîne **Cred*** reste le sous-domaine crédibilité pédagogique :

```text
C10 (Π_global=100) → CredV → CredC → CredS → CredΠ → CredΣ
                              ↘
                               CinCred → CinΣ
```

Résolution agent :

```bash
node usr/lib/capsuleos/tools/lab/resolve-agent-action.mjs --scope app-fidelity --id linux-mint
node usr/lib/capsuleos/tools/lab/resolve-agent-action.mjs --scope cinnamon --id linux-mint
```

---

## 5. Écarts résiduels documentés (juin 2026)

| ID | Priorité | État |
|----|----------|------|
| CSS-URL-PHYS | P2 | `url()` physiques dans `windows.css`, `cinnamon-window-chrome.css`, `firefox.skin.css` |
| CLOIS-SCORE | P2 | Score recette 94/100 — exceptions GTK upstream documentées |
| TIER-C-THEMES | P2 | 52 entrées menu → slot `themes` (cs-*) |
| CRED-S-LIVE | P1 | Rejouer smoke batch HTTP si gate skip inventory |

---

## 6. Commandes reprise

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
node usr/lib/capsuleos/tools/lab/map-cinnamon-ground-truth-gaps.mjs --id linux-mint --write --sync-man
node usr/lib/capsuleos/tools/lab/run-cinnamon-formal-chain.mjs --id linux-mint
CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-app-fidelity-all.mjs --id linux-mint --sample 20
node usr/lib/capsuleos/tools/lab/run-app-fidelity-campaign.mjs --id linux-mint --phase formal
```

### Phase interactivité — menus contextuels (clic droit)

Matrice ground truth VM ↔ recette : [`root/docs/inventaires/interactions/linux-mint/context-menus.json`](inventaires/interactions/linux-mint/context-menus.json)

**Cycle** : VM inventaire → `context-menus.json` → impl (`bindNemoContextMenu` + `fileExplorerNemoOps.js`) → smoke → `map-cinnamon-ground-truth-gaps.mjs --write`

| Étape | Commande | Attendu |
|-------|----------|---------|
| Checklist | `node usr/lib/capsuleos/tools/lab/print-mint-context-menu-checklist.mjs` | libellés P0/P1 + P2 documentés |
| **Étape 2 — Nemo P1+** | patch `NEMO_ITEMS` + ops corbeille / renommage / terminal / document | `expectedLabels` matrice alignés VM fr |
| Smoke P0/P1 | `CAPSULE_MINT_URL=http://127.0.0.1:5501/OS/linux/families/debian/mint/index.html node usr/lib/capsuleos/tools/lab/smoke-mint-context-menus.mjs` | exit 0 — libellés + `data-nemo-ctx-action` branchés |
| Nemo intégration | `node usr/lib/capsuleos/tools/lab/smoke-mint-nemo.mjs` | exit 0 — navigation + chrome |
| Gap map | `node usr/lib/capsuleos/tools/lab/map-cinnamon-ground-truth-gaps.mjs --id linux-mint --write` | état formal mis à jour |
| UI state shell | `node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --id linux-mint --shell desktop,mainMenu,panel` | desktop ctx visible |
| Inventaire VM | `ssh -i ~/.ssh/capsuleos-lab capsule@192.168.1.146 'DISPLAY=:0 …'` | relire libellés fr si drift Nemo |

**Critères done étape 2** : fond liste (document, terminal, tout sélectionner) ; fichier/dossier (ouvrir avec…, renommer, corbeille) ; smoke exit 0 ; P2 « Compresser » et sous-menu modèles document restent dans `vmExtraLabels`.

Contextes **P2** documentés (non bloquants CinΣ) : icône bureau, panel, barre titre Muffin, Compresser — voir matrice § `vmExtraLabels` / `capsuleStatus: planned`.
