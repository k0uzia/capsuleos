# Convention — accueil d’un nouvel OS (contributeur)

> **Statut** : obligatoire (juin 2026) — humains et agents IA qui **branchent** une distribution sans impacter le noyau.  
> **Public** : contributeur OS (leaf) · intégrateur noyau (PR Z1) · mainteneur recette.

Complète sans remplacer : [ajouter-os-scalable.md](ajouter-os-scalable.md) (catalogue) · [convention-reproduction-os.md](convention-reproduction-os.md) (clone VM) · [processus-branchement-noyau.md](processus-branchement-noyau.md) (hooks noyau ↔ skin) · [logique-formelle.md](logique-formelle.md) (**R-LOC1**, **P11**).

En cas de conflit → [plan-maitre-reproduction-os.md](plan-maitre-reproduction-os.md) prime.

---

## 1. Objectif

Permettre à un humain ou à un agent IA d’**accueillir** un nouvel OS dans CapsuleOS :

- en recevant un **espace dédié** et une **recette** (ordre, gates, fin de travail) ;
- sans **modifier le noyau** (`usr/lib/`, `usr/share/`) pour contourner un manque de contrat ;
- en remontant vers l’intégrateur uniquement quand le **contrat public** du noyau doit évoluer.

**Phrase-synthèse** :

```text
Registre + profil recette → espace home/ + proc/<id>/ → hooks documentés → gates leaf → PR intégrateur si Z1
```

---

## 2. Espace contributeur (où écrire)

| Zone | Chemin | Contributeur OS | Rôle |
|------|--------|-----------------|------|
| **Z2 — skin** | `home/<Vendor>/<Distro>/` | **Libre** (HTML, CSS, JS vendor, tokens, chrome) | Source de vérité UI de la distro |
| **Z0 — vérité** | `proc/<registryId>/` | Via **pipeline lab** uniquement | Manifestes, playbooks, assets VM importés |
| **Z0 — déclaration** | `etc/capsuleos/profiles/<registryId>.json` | **1 entrée** + miroir `skin.profile.json` | `CAPSULE_*`, packs assets, chrome context |
| **Z0 — catalogue** | `etc/capsuleos/os-registry.json` | **1 entrée** (ou générateur) | Identité leaf : `id`, `toolkit`, `facade`, `skin` |
| **Z0 — recette** | `etc/capsuleos/contracts/lab-recipe-profiles.json` | **1 profil** si toolkit lab couvert | Matrices, scripts collecte, `upstreamId`, bootstrap |
| **Z0 — inventaires** | `root/docs/inventaires/<registryId>-*` | Générés / versionnés | État parité, clôture formelle |
| **Assets vendor** | `usr/share/capsuleos/assets/images/vendors/<vendor>/` | Pack **propre** au vendor | Logos, fonds — jamais empruntés à un autre vendor |
| **Matrices lab** | `root/tools/lab/*-matrix-<vendor>.json` | Si GNOME Paramètres / campagnes | R-LOC1 — pas de matrice d’un autre vendor |

**Z3 (`OS/...`)** : façade pick-os — **ne pas éditer à la main**. Régénérer :

```bash
node usr/lib/capsuleos/tools/linux/build-linux-facades.mjs
# ou clôture globale :
node usr/lib/capsuleos/tools/sync-all-views.mjs
```

---

## 3. Zones interdites au contributeur OS (PR intégrateur)

| Zone | Chemin | Pourquoi |
|------|--------|----------|
| **Z1 — noyau JS** | `usr/lib/capsuleos/` | Comportements partagés — régression cross-toolkit |
| **Z1 — gabarits système** | `usr/share/capsuleos/` (apps, explorers, themes) | Vérité embed — impacte toutes les distros du toolkit |
| **Z4 — embeds** | `var/lib/capsuleos/generated/` | Projection build — regen globale |
| **Contrats globaux** | `etc/capsuleos/contracts/*.json` (hors profil dédié) | Sauf PR avec `run-cross-regression-gates.mjs` |
| **Noyau archivé** | `OS/linux/kernel/` | **DEPRECATED** — ne pas étendre |

**Règle** : si le besoin se résout par `if (registryId === '…')` dans `usr/lib/`, **stop** → ouvrir une PR intégrateur ou étendre le **contrat** (`skin.profile.json`, `window-chrome-contexts.json`, `cluster-registry.json`).

**Signal d’escalade** (issue ou PR intégrateur) :

- nouveau toolkit DE non couvert ;
- nouveau type d’explorateur (gabarit `usr/share/`) ;
- comportement WM / panel / menu absent des hooks [processus-branchement-noyau.md](processus-branchement-noyau.md) ;
- extension `CAPSULE_*` non listée dans le profil type.

---

## 4. Deux chemins d’accueil

### 4.1 Accueil à froid (sans VM)

Objectif : **enregistrer** le leaf et livrer un skin **navigable minimal** (shell squelette, pick-os, smoke statique).

| Étape | Action |
|-------|--------|
| 1 | Choisir **upstream** : même `toolkit` qu’une référence ([repertoire-os.md](repertoire-os.md)) |
| 2 | Entrée registre + profil — voir [ajouter-os-scalable.md §2–4](ajouter-os-scalable.md) |
| 3 | Copier skin proche sous `home/` ; adapter `bodyId`, tokens CSS, `strings.json` |
| 4 | Profil recette : `upstreamId` + `bootstrap` matrices — `bootstrap-gnome-settings-matrices.mjs` si GNOME |
| 5 | Gates **leaf** (pas `validate-all` global tant que `status: planned` si politique équipe) |

```bash
node usr/lib/capsuleos/tools/print-agent-brief.mjs <registryId> --write
node usr/lib/capsuleos/tools/lab/resolve-lab-recipe.mjs --id <registryId> --human
node usr/lib/capsuleos/tools/lab/resolve-agent-action.mjs --id <registryId> --scope pipeline
```

**Definition of Done (froid)** : façade + home miroir · `skin.profile.json` valide · pick-os affiche l’entrée · ouverture `file://` sans 404 critiques · profil recette sans gap bloquant (R-LOC1).

### 4.2 Maturation (avec VM ground truth)

Objectif : parité documentée VM ↔ Capsule — workflow complet [convention-reproduction-os.md](convention-reproduction-os.md).

| Étape | Action |
|-------|--------|
| 1 | `lab-inventory.json` + SSH VM |
| 2 | Inventaire `root/docs/inventaires/<registryId>-vm.json` |
| 3 | Pipeline : `run-capsule-pipeline.mjs --id <registryId>` |
| 4 | Chaîne maturité : **M → ManΣ → AppΣ → PbΣ → Vp → VΣ → Tf → H₆** |

**Definition of Done (maturation)** : prédicats du plan maître pour le `tier` cible · `validate-all.mjs` exit 0 · pas de fuite toolkit (`validate-toolkit-paradigm`, `validate-skin-vendor-isolation`).

---

## 5. Recette = cadre de contribution

La recette n’est **pas** le noyau : c’est la **politique d’orchestration** pour un `registryId`.

| Source | Rôle |
|--------|------|
| `etc/capsuleos/contracts/lab-recipe-profiles.json` | Matrices, scripts collecte, bootstrap, `upstreamId` |
| `resolve-lab-recipe.mjs` | Gaps explicites — **P11** : pas de fallback silencieux vers un autre vendor |
| `resolve-agent-action.mjs` | Prochaine action pipeline admissible |
| `lab-recipe-resolver.mjs` | Algorithme **R-LOC1** |

**Ajouter un profil recette** (contributeur autorisé sur Z0 dédié) :

```json
"linux-exemple": {
  "toolkit": "gnome",
  "vendor": "exemple",
  "upstreamId": "linux-ubuntu",
  "matrices": {
    "parity": "root/tools/lab/gnome-settings-parity-matrix-exemple.json",
    "assets": "root/tools/lab/gnome-settings-assets-matrix-exemple.json",
    "visual": "root/tools/lab/gnome-settings-visual-investigation-matrix-exemple.json"
  },
  "bootstrap": {
    "parity": "toolkit:gnome+upstream:linux-ubuntu",
    "assets": "upstream:linux-ubuntu",
    "visual": "toolkit:gnome+skinRewrite+upstream:linux-ubuntu"
  }
}
```

Puis :

```bash
node usr/lib/capsuleos/tools/lab/bootstrap-gnome-settings-matrices.mjs --id linux-exemple
node usr/lib/capsuleos/tools/lab/resolve-lab-recipe.mjs --id linux-exemple --human
```

---

## 6. Branchement noyau ↔ skin (sans toucher Z1)

Le contributeur **branche** via :

| Mécanisme | Fichier / lieu |
|-----------|----------------|
| Profil skin | `skin.profile.json` — `CAPSULE_*`, `assetsBase`, `toolkitPack`, `vendorPack` |
| DOM | `body#<bodyId>`, slots `data-link`, structure panel/tray |
| CSS | Tokens sous `body#<bodyId>` — variables, pas fork de modules noyau |
| JS vendor | `home/.../content/*.js` — tray, chrome, strings — **garde toolkit** |
| Registre apps | `etc/capsuleos/contracts/apps-catalog.json` → `registryOverrides.<registryId>` si besoin |

Table complète comportement → noyau → hook : [processus-branchement-noyau.md](processus-branchement-noyau.md).

**Anti-patterns** (rejet PR) :

- fork `contentLoader.js` ou `capsule-window.js` dans `home/` ;
- import du tray Mint sur un skin GNOME ;
- chemins `../../../usr/lib/` en dur dans le JS runtime skin ;
- édition manuelle des façades `OS/` ;
- assets empruntés à un autre vendor ([convention-assets-depuis-vm.md](convention-assets-depuis-vm.md)).

---

## 7. Séquence agent (résumé)

```bash
# 0 — baseline (intégrateur ou avant gros patch global)
node usr/lib/capsuleos/tools/validate-all.mjs

# 1 — brief + recette
node usr/lib/capsuleos/tools/print-agent-brief.mjs <registryId> --write
node usr/lib/capsuleos/tools/lab/resolve-lab-recipe.mjs --id <registryId> --human

# 2 — décision pipeline
node usr/lib/capsuleos/tools/lab/resolve-agent-action.mjs --id <registryId> --scope pipeline

# 3 — implémentation sous home/ + proc/ + profils (§2)

# 4 — clôture vues
node usr/lib/capsuleos/tools/sync-all-views.mjs

# 5 — gates
node usr/lib/capsuleos/tools/validate-skin-profiles.mjs
node usr/lib/capsuleos/tools/validate-skin-icon-paths.mjs --id <registryId>
node usr/lib/capsuleos/tools/validate-all.mjs
```

Serveur local : `python3 -m http.server 8765 --bind 127.0.0.1` depuis la racine du dépôt.

---

## 8. Revue PR — périmètre attendu

### PR « accueil OS » (contributeur)

**Autorisé** :

- `home/<Vendor>/…`
- `proc/<registryId>/…`
- `etc/capsuleos/profiles/<registryId>.json` + entrée registre + `lab-recipe-profiles` (bloc du leaf)
- `usr/share/capsuleos/assets/images/vendors/<vendor>/…`
- `root/docs/inventaires/<registryId>-*`
- `root/tools/lab/*-<vendor>.json` (matrices du vendor)

**Refusé sans label intégrateur** :

- tout diff sous `usr/lib/capsuleos/` ou `usr/share/capsuleos/` hors pack vendor ;
- modification de contrats globaux partagés ;
- `var/lib/capsuleos/generated/` commité manuellement.

### PR « extension noyau » (intégrateur)

Obligatoire si §3 · exécuter :

```bash
node usr/lib/capsuleos/tools/lab/run-cross-regression-gates.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
```

---

## 9. Checklist copiable — accueil leaf

```
[ ] registryId choisi (1 identité utilisateur = 1 leaf)
[ ] toolkit existant confirmé — upstream documenté
[ ] Entrée os-registry + profil etc/capsuleos/profiles/<id>.json
[ ] skin.profile.json miroir sous home/
[ ] Profil lab-recipe-profiles (si GNOME lab) + matrices bootstrap
[ ] home/<Vendor>/ squelette depuis upstream toolkit
[ ] vendor pack sous assets/images/vendors/<vendor>/ (pas d’emprunt)
[ ] Aucune édition manuelle OS/ — sync-linux-facades ou sync-all-views
[ ] resolve-lab-recipe sans gap bloquant (R-LOC1)
[ ] validate-skin-profiles + validate-skin-icon-paths --id <registryId>
[ ] Smoke file:// : shell, 1 app, explorateur si slot présent
[ ] validate-all exit 0 (maturation) ou accord équipe (accueil froid planned)
[ ] Issue ou PR séparée si besoin Z1 (§3)
```

---

## 10. Documents liés

| Besoin | Document |
|--------|----------|
| Catalogue & façade | [ajouter-os-scalable.md](ajouter-os-scalable.md) |
| Clone VM détaillé | [procedure-clonage-os-depuis-vm.md](procedure-clonage-os-depuis-vm.md) |
| Zones Z0–Z4 | [README.md](README.md) §2 |
| Clean code P12 | [convention-clean-code.md](convention-clean-code.md) |
| Gates par changement | [agent-validation-discipline.md](agent-validation-discipline.md) |
| Guide racine | [contrib.md](../../contrib.md) |

---

*Un OS accueilli correctement n’élargit pas le noyau : il remplit son espace et consomme les services déjà publiés.*
