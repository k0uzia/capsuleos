# Convention — clean code CapsuleOS

> **Statut** : **obligatoire** (juin 2026) — agents, contributeurs, revues · principe constitutionnel **P12**  
> **Intègre par référence** : [README.md](README.md) (corpus & vision technique) — toute clause du README s’applique comme si elle figurait ici  
> **Cloisonnement** : [fondements-philosophiques.md](fondements-philosophiques.md) §7 · zones [convention-reproduction-os.md](convention-reproduction-os.md) §2 · **P11** / **R-LOC1**

**Objectif** : écrire **dans le bon contexte** — bonne zone Z0–Z4, bon `registryId`, bon toolkit — avec le **minimum de lignes** vérifiables par gates. Éviter doc, code et données **hors couche** qui parasitent agents et humains.

**Règle Cursor** : `.cursor/rules/capsuleos-redaction.mdc` (`alwaysApply`).

---

## 1. Portée — trois surfaces

| Surface | Où | Règle clean |
|---------|-----|-------------|
| **Code** | `usr/lib/`, `usr/share/`, `home/`, outils `usr/lib/capsuleos/tools/` | Zone + toolkit ; pas de fork par distro |
| **Documentation** | `root/docs/` | Corpus [README.md](README.md) ; pas de priorité parallèle |
| **Données** | `proc/`, `etc/`, `root/docs/inventaires/` | Vérité locale **P11** ; pas d’instantané éphémère versionné |

Clean code CapsuleOS = **cloisonnement respecté** + **corpus respecté** + **gate avant merge**.

---

## 2. Obligation corpus — contenu du README.md

Toute écriture (code, doc, JSON, règle Cursor) doit être **compatible** avec [README.md](README.md). En résumé obligatoire :

### 2.1 Avant d’écrire

1. Lire **Canon** README §1 (fondements → logique → plan maître → phase active).
2. Résoudre la tâche : `run-capsule-pipeline.mjs --id <registryId>` ou `resolve-agent-action.mjs --scope pipeline`.
3. Identifier **zone** (Z0–Z4 plan maître §1 bis) et **couche** (core / toolkit / vendor / proc).

### 2.2 Documentation — interdit hors contexte

| Interdit | À la place |
|----------|------------|
| Nouvelle « roadmap » ou plan d’exécution parallèle | Entrée backlog §16 plan maître |
| Prioriser depuis `roadmap.md` ou un inventaire JSON | `generate-formal-advancement-report.mjs --write` |
| Committer `*-resolve.json` | Régénérer en session ; voir `.gitignore` |
| MD de procédure sans lien plan maître | Spécialisation listée README §2 |
| Commentaires TODO non classés P0/P1/P2 | Écart dans inventaire parité ou backlog |

### 2.3 Code — interdit hors contexte

| Interdit | À la place |
|----------|------------|
| Logique commune dans `home/<Vendor>/` | `usr/lib/capsuleos/` ou cluster `toolkit-*` |
| Asset d’un vendor dans un autre skin | `vendors/<vendor>/` + **P11** |
| Matrice / playbook / manifeste emprunté | Artefact local ou FAIL (**R-LOC1**) |
| Script lab `smoke-<vendor>-<app>.mjs` dupliqué | Smoke paramétré + contrat `apps-catalog.json` |
| Module parallèle au lieu d’étendre l’existant | Enrichir chaîne documentée (plan maître §0) |
| Patch skin sans `proc/` / gate **I** | Chaîne ManΣ ou inventaire VM |

### 2.4 Données — interdit hors contexte

| Interdit | À la place |
|----------|------------|
| Vérité VM inventée dans le skin | `proc/<registryId>/` |
| JSON d’état partiel de pipeline raté | Re-run ou ne pas versionner |
| Catalogue apps sans `registryId` | `apps-catalog.json` + overrides |

---

## 3. Clean code et agnosticisme (P3, P4, P7)

### 3.1 Noyau agnostique

- **`usr/lib/capsuleos/common/`** : aucune mention vendor, aucun chemin `vendors/ubuntu` en dur.
- **Comportement partagé** ≥ 2 distros même toolkit → noyau ou `shells/linux/`, pas copie dans deux `home/`.

### 3.2 Toolkit-first

- Cinnamon, GNOME, KDE : variables et chrome dans `usr/share/capsuleos/themes/clusters/toolkit-<id>/`.
- Le skin **configure** (tokens, `skin.profile.json`), il ne **réimplémente** pas le DE.

### 3.3 Vendor-sealed

- `home/<Vendor>/<Distro>/` : layout, overrides CSS, refs assets **locaux** uniquement.
- Pas de « fallback » vers un autre vendor pour combler un trou (**P11**).

### 3.4 Sobre (**P7**)

Avant d’ajouter un fichier :

1. Une gate ou un prédicat l’exige-t-il ?
2. Un fichier existant peut-il être **étendu** ?
3. La ligne ajoutée est-elle **donnée** (JSON/proc) plutôt que logique ?

Si non aux trois → ne pas ajouter.

---

## 4. Recette économe (code)

Alignée plan maître §4.4 :

```text
Donnée (proc/, inventaire, contrat JSON)
  → génération ou binding (tokens, refs, grille)
  → skin minimal
  → smoke / validate-all
```

- **Diff minimal** : une intention, une zone, un gate vert.
- **Pas de commentaire narratif** : le code et le contrat portent la vérité ; commenter seulement invariant non évident.
- **ES modules** : outils lab Node ; noyau navigateur reste script classique sauf `import()` lazy documenté.

---

## 5. Checklist avant commit (humain ou agent)

- [ ] Tâche traçable au **plan maître** ou backlog §16 ?
- [ ] Zone Z0–Z4 correcte ?
- [ ] Pas d’écriture cross-vendor (**P11**) ?
- [ ] Pas de doc/inventaire parasite (README §3–§5) ?
- [ ] `validate-all.mjs` vert sur la zone touchée (**H₂**) ?
- [ ] Pas de nouveau module si extension possible (**P7**) ?
- [ ] Pas de tiret cadratin `—` dans les textes portail / parcours / UI (**P13**) ?

---

## 6. Rédaction (P13)

**Interdit** : le caractère `—` (U+2014, tiret cadratin).

**Périmètre prioritaire** : portail, `parcours-pedagogique.md`, chaînes utilisateur, contrats `portal-*.json` (libellés).

**Substituts** : deux-points, virgule, parenthèses, ` · `, tiret ASCII `-` en contexte technique.

**Gate** : `node usr/lib/capsuleos/tools/validate-no-em-dash.mjs` (aussi via `validate-portal-contracts.mjs`).

**Règle Cursor** : `.cursor/rules/capsuleos-redaction.mdc`.

---

## 7. Liens normatifs

| Document | Lien |
|----------|------|
| [README.md](README.md) | Corpus — **inclus par référence** dans cette convention |
| [fondements-philosophiques.md](fondements-philosophiques.md) | **P12** |
| [logique-formelle.md](logique-formelle.md) | **R-LOC1**, **R-IMP1**, **R-AGN1** |
| [plan-maitre-reproduction-os.md](plan-maitre-reproduction-os.md) | Zones §1 bis, recette §4.4 |
| `.cursor/rules/logique-formelle-capsuleos.mdc` | Application agent |

---

*Clean code ici ne désigne pas un style esthétique arbitraire : c’est l’**alignement des écritures sur les couches et le corpus**, au service de l’agnosticisme du noyau et du scellement vendor.*
