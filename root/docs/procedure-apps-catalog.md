# Procédure — catalogue strict applications (tous OS)

> **Statut** : spécialisation de [logique-formelle.md](logique-formelle.md) §2.9 · **Référence Rocky** : [`linux-rocky-apps-catalog.json`](inventaires/linux-rocky-apps-catalog.json)

**Objectif** : établir pour **chaque** `registryId` une liste **stricte et vérifiable** des applications présentes sur la VM ground truth, leurs **spécificités** (slot, chrome, profondeur fonctionnelle, emplacements shell), et enchaîner les étapes via les prédicats **AppV → AppC → AppP0 → AppΣ**.

---

## 1. Prédicats

| Symbole | Signification | Gate |
|---------|---------------|------|
| **AppV** | Inventaire VM apps | `*-vm-apps-installed.json` |
| **AppC** | Catalogue strict généré + smoke structurel | `*-apps-catalog.json` + `smoke-apps-catalog.mjs` |
| **AppP0** | Toutes les apps **P0 onVm** exigeant un slot sont `ok` | `summary.p0Gaps === 0` |
| **AppL** | Lab apps (smokes structure) | `run-apps-lab.mjs` |
| **AppΣ** | **AppV ∧ AppC ∧ AppP0 ∧ AppL** | Clôture catalogue structurelle |

Parité visuelle app-par-app : [procedure-apps-replication-formelle.md](procedure-apps-replication-formelle.md) (**AppVv → AppVp**).

---

## 2. Chaîne formelle (règles)

```
R-MAN0   M ∧ ¬ManV   →  run-manifest-replication-chain.mjs (ensure vendor + collect)
R-MAN1   ManV ∧ ¬ManS  →  smoke-vm-distribution-manifest.mjs
R-MAN2   ManS ∧ ¬PbM  →  generate-manifest-replication-playbook.mjs --write
R-MAN3   ManS ∧ ¬ManA  →  approve-vm-distribution-manifest.mjs --write
R-MAN4   ManA ∧ ¬ManSt  →  run-manifest-staging-on-vm.mjs --write
R-MAN5   ManSt ∧ ¬ManI  →  import-manifest-staging.mjs --write
R-APP1   ManV ∧ ¬AppV  →  collect-vm-apps-inventory.mjs --write  (dérivé manifeste → inventaires)
R-APP2   AppV ∧ ¬AppC  →  generate-apps-catalog.mjs --write && smoke-apps-catalog.mjs
R-APP3   AppC ∧ ¬AppΣ  →  implémentation H5 ciblée (prochain écart catalogue)
R-H6-DONE  … ∧ AppΣ  →  maintenance validate-all
```

Résolution :

```bash
node usr/lib/capsuleos/tools/lab/resolve-agent-action.mjs --id <registryId> --scope formal
```

---

## 3. Procédure par nouveau registryId

### 3.1 Prérequis

- **H₆** clôturé (ou au minimum **M** + skin `index.html` existant)
- Entrée `etc/capsuleos/os-registry.json` + profil `etc/capsuleos/profiles/<id>.json`
- VM lab documentée dans `etc/capsuleos/lab-inventory.json`

### 3.2 Ajouter le contrat

Éditer `etc/capsuleos/contracts/apps-catalog.json` :

1. Bloc `registryOverrides.<registryId>` avec `toolkit` (`gnome`, `cinnamon`, `kde`, …)
2. Une entrée `apps.<vmId>` par application installée VM :
   - `labelFr`, `priorite` (P0/P1/P2), `slot`, `statut`, `requiresSlot`, `placement`
   - `note` pour écarts documentés
3. `capsuleOnly` (missions, à propos, etc.)
4. `notOnVmOverview` (icônes décoratives hors VM)

Les **spécificités techniques** par slot GNOME sont dans `toolkits.gnome.slotSpecs` (provider chrome, template, skin CSS, `functionalDepth`).

**Compositions UI réutilisables** (composants N1 + assemblage N2, sources HIG officielles) : [`etc/capsuleos/contracts/ui-components-gnome.json`](../../etc/capsuleos/contracts/ui-components-gnome.json) · [convention-composants-gnome.md](convention-composants-gnome.md) · validateur `validate-ui-components-gnome.mjs`.

### 3.3 Collecte VM

```bash
# Depuis inventaire existant (hors ligne)
node usr/lib/capsuleos/tools/lab/collect-vm-apps-inventory.mjs --id linux-rocky --write

# Rafraîchir depuis VM lab
node usr/lib/capsuleos/tools/lab/collect-vm-apps-inventory.mjs --id linux-rocky --write --ssh
```

Livrable : `root/docs/inventaires/<id>-vm-apps-installed.json`

### 3.4 Génération catalogue

```bash
node usr/lib/capsuleos/tools/lab/generate-apps-catalog.mjs --id <registryId> --write
node usr/lib/capsuleos/tools/lab/smoke-apps-catalog.mjs --id <registryId>
```

Livrables :

- `root/docs/inventaires/<id>-apps-catalog.json` (vérité machine)
- `root/docs/inventaires/<id>-apps-catalog.md` (lecture humaine)

### 3.5 Implémentation des écarts (R-APP3)

Lire `summary.nextGap` dans le catalogue JSON. Pour chaque écart :

1. Créer ou compléter le slot (`usr/share/capsuleos/linux/apps/`, `style/apps/*.skin.css`)
2. Lier dans `index.html` (`data-link`, `data-overview-link`)
3. Mettre à jour `statut` dans `registryOverrides` → `ok` ou `partiel`
4. Regénérer `--write` + smoke

### 3.6 Dérivés même branche

Skins dérivés (ex. Alma depuis Rocky) :

```bash
node usr/lib/capsuleos/tools/linux/bootstrap-alma-from-rocky.mjs
# Puis registryOverrides.linux-alma (copie adaptée ou extends rocky)
```

---

## 4. Toolkits

| Toolkit | Collecte | Générateur |
|---------|----------|------------|
| **gnome** | `collect-vm-apps-inventory.mjs` | `generate-apps-catalog.mjs` |
| **cinnamon** | `collect-mint-inventory.mjs` | `generate-apps-catalog.mjs --id linux-mint` → délègue `generate-mint-apps-catalog.mjs` |
| **kde** | (à étendre) | ajouter `registryOverrides` + collecteur |
| **cosmic** | inventaire Pop!_OS | `cosmic-apps-catalog.js` (grille dédiée) |

---

## 5. Gates exécutables

```bash
node usr/lib/capsuleos/tools/lab/smoke-apps-catalog.mjs --id linux-rocky
node usr/lib/capsuleos/tools/validate-gnome-chrome-apps.mjs   # chrome / gabarits GNOME
node usr/lib/capsuleos/tools/validate-all.mjs
```

---

## 6. Anti-patterns

1. **Inventer** une app absente de la VM sans la marquer `notOnVm` ou `decorative`.
2. **P0 absent** — une app dash/overview VM P0 doit avoir un slot `ok`.
3. **Catalogue sans contrat** — `registryOverrides` obligatoire avant `generate`.
4. **Dupliquer** la logique Mint : utiliser `generate-apps-catalog.mjs` comme point d’entrée unique.

---

## 7. Documents liés

- [apps-linux-par-distro.md](apps-linux-par-distro.md) — vue produit par skin
- [procedure-replication-formelle.md](procedure-replication-formelle.md) — chaîne Paramètres GNOME
- [convention-reproduction-os.md](convention-reproduction-os.md) — ground truth VM
- [linux-gnome-capsule-slots.md](inventaires/linux-gnome-capsule-slots.md) — mapping Nautilus ↔ `nemo`
