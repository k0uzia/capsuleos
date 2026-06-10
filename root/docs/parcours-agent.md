# Parcours agent — formation avant action

Chemin logique pour qu’un agent Cursor **comprenne CapsuleOS** avant de modifier le dépôt, puis **scale** le catalogue (distros, versions, bureaux, vendors) sans fork noyau.

**Guide racine** : [`contrib.md`](../../contrib.md)  
**Logique formelle** : [logique-formelle.md](logique-formelle.md) — **document fondateur** des gates et de la décision agent  
**Skill associé** : [`../skills/onboarding/SKILL.md`](../skills/onboarding/SKILL.md)  
**Gate release** : `node usr/lib/capsuleos/tools/validate-all.mjs`  
**Discrimination par type de changement** : [agent-validation-discipline.md](agent-validation-discipline.md) · `print-validation-plan.mjs`

---

## Logique formelle ↔ hydratation H0–H6

Les phases H ci-dessous sont des **instances** des prédicats du [manifeste logique formelle](logique-formelle.md) :

| Phase | Prédicat | Gate typique |
|-------|----------|--------------|
| H0 | **H₀** | Lecture contrat |
| H2 | **H₂** | `validate-all.mjs` |
| H5 | implémentation | **R-IMP1** : interdit si ¬**H₂** |
| H6 | **H₆** | `validate-all.mjs` clôture |

**Décision autonome** : après **H₂**, résoudre le pipeline :

```bash
node usr/lib/capsuleos/tools/lab/resolve-agent-action.mjs --id <registryId> --scope pipeline
```

Puis §4 de `logique-formelle.md` si le domaine n’est pas couvert par le pipeline — ne pas demander à l’utilisateur si **R-AUTO** / `autoExecute` s’applique.

**Ne pas** lire `roadmap.md` pour choisir la prochaine tâche — voir [plan-maitre-reproduction-os.md](plan-maitre-reproduction-os.md) §14 et [README.md](README.md).

---

## Principe de scalabilité

```
Une vérité machine-lisible  →  N projections (façade, skin, pick-os, embed, docs)
         │                              │
         ▼                              ▼
  os-registry.json              skin.profile.json
  assets/manifest.json          toolkit + vendor packs
```

**Ajouter un OS** = enregistrer + réutiliser un **toolkit** existant + pack **vendor** — pas dupliquer `CapsuleWindow`, `contentLoader`, ni les assets sous `OS/*/media/`.

Référence détaillée : [ajouter-os-scalable.md](ajouter-os-scalable.md) · [repertoire-os.md](repertoire-os.md) · [scalabilite-noyau.md](scalabilite-noyau.md)

---

## Hydratation agent (H0 → H6)

| Phase | Objectif | Actions agent | Gate / livrable |
|-------|----------|---------------|-----------------|
| **H0** | Contexte & contrat | Lire [AGENTS.md](../AGENTS.md), [checklist contrat](../../contrib.md#checklist-contrat-avant-merge-ou-release), [arborescence.md](arborescence.md) | Compréhension chemins `CapsuleOS/` vs `root/` |
| **H1** | Vérité catalogue | Lire [manifeste-noyau.md](manifeste-noyau.md) § registres ; parcourir `etc/capsuleos/os-registry.json` ; [politique-assets.md](politique-assets.md) | Savoir où vivent façade / skin / assets |
| **H2** | Santé dépôt | Exécuter `validate-all.mjs` (baseline locale) | **exit 0** ou plan de correction avant tout patch |
| **H3** | Routage compétence | Choisir skill : [onboarding](../skills/onboarding/SKILL.md) → `kernel-supervisor` **ou** `os-<famille>` + `role-*` ; voir [equipe-agentique.md](equipe-agentique.md) | Brief avec `id` registre + `tier` |
| **H4** | Conception scalable | Toolkit existant ? Vendor pack ? Miroir `home/` ? Profil `skin.profile.json` | Fiche [ajouter-os-scalable.md](ajouter-os-scalable.md) remplie ; si clone VM : [procedure-clonage-os-depuis-vm.md](procedure-clonage-os-depuis-vm.md) phases 0–1 |
| **H5** | Implémentation | Patch minimal ; assets dans `usr/share/capsuleos/assets/` ; boot `capsule-resource.js` → `capsule-skin-boot.js` | Pas d’images sous `OS/*/media/` |
| **H6** | Clôture | `validate-all.mjs` ; regen embed si templates/strings ; smoke `file://` sur façade | PR / merge autorisé |

> **Règle** : ne pas commencer H5 si H2 échoue sur la zone touchée (sauf tâche dédiée « fix CI »).

---

## Arbre de décision (avant d’agir)

```mermaid
flowchart TD
  start([Demande utilisateur])
  start --> h0[H0 Contrat + arborescence]
  h0 --> h2[H2 validate-all baseline]
  h2 -->|échec assets| ks[kernel-supervisor + asset-pipeline]
  h2 -->|échec quality| cq[code-quality]
  h2 -->|échec capsule| kg[kernel-guardian / role-developer]
  h2 -->|OK| route{Type de changement ?}
  route -->|Nouveau OS / vendor / version| add[ajouter-os-scalable + os-linux ou os-stub]
  route -->|Skin / parité UX| os[os-family + role-integrator]
  route -->|JS noyau / fenêtres| kg
  route -->|Icônes / packs| ks
  route -->|Multi-familles| coord[coordinator]
  add --> h4[H4 Registre + profil]
  h4 --> h5[H5 Implémentation]
  os --> h5
  kg --> h5
  ks --> h5
  h5 --> h6[H6 validate-all + smoke]
```

---

## Matrice « je veux… » → lecture → gate → skills

| Intention | Lire d’abord | Gate après patch | Skills |
|-----------|--------------|------------------|--------|
| Nouvelle **distro Linux** (ex. Zorin) | [ajouter-os-scalable.md](ajouter-os-scalable.md), [procedure-clonage-os-depuis-vm.md](procedure-clonage-os-depuis-vm.md), [contrib.md § toolkits](../../contrib.md#bibliotheques-graphiques-linux-toolkits-gui) | `validate-all` + regen embed Linux | `os-linux`, `role-integrator`, `code-quality` |
| Nouvelle **version** Windows / macOS | [repertoire-os.md](repertoire-os.md), façade existante | `validate-all` | `os-windows` / `os-macos`, `role-integrator` |
| Nouveau **vendor** (thème icônes) | [politique-assets.md](politique-assets.md), `assets/manifest.json` | `validate-assets-all` | `kernel-supervisor`, `role-graphic-artist` |
| Nouveau **environnement de bureau** (toolkit) | [contrib.md § toolkits](../../contrib.md#bibliotheques-graphiques-linux-toolkits-gui), explorateurs README | `validate-all` + manifest | `os-linux`, `role-developer`, `role-graphic-artist` |
| Nouvelle **famille** OS (ChromeOS…) | [os-stub/SKILL.md](../skills/os-stub/SKILL.md) | `validate-all` | `os-stub` → skill dédié, `coordinator` |
| Correctif **JS** skin | [passe-vanilla-json.md](passe-vanilla-json.md) | `validate-quality-all` | `role-developer`, `code-quality` |
| Migration **assets** | [roadmap.md](roadmap.md) §0.5 | `validate-assets-all` | `kernel-supervisor`, `asset-pipeline` |

---

## Modèle vendor / toolkit / version (Linux)

| Concept | Fichier / zone | Agent doit |
|---------|----------------|------------|
| **Entrée catalogue** | `etc/capsuleos/os-registry.json` | `id`, `tier`, `status`, `facade`, `toolkit`, `embedKey`, `bodyId` |
| **Profil boot** | `skin.profile.json` + `etc/capsuleos/profiles/` | `assets.assetsBase`, `toolkitPack`, pas de `CAPSULE_MEDIA_BASE` dans profil |
| **Toolkit** | `assets/images/toolkits/<id>/` | Choisir cinnamon / kde / gnome / cosmic — pas de fork Dolphin |
| **Vendor** | `assets/images/vendors/<id>/` | Thème, fond d’écran, identité distro |
| **Façade URL** | `OS/linux/families/.../index.html` | Scripts noyau dans le bon ordre |
| **Miroir pédagogique** | `home/<Vendor>/` | Aligné sur la façade ; `content/strings.json` optionnel |
| **Version OS** | Nouvelle entrée registre | Souvent **nouvelle entrée** + même toolkit (ex. `linux-ubuntu-2510`) |

---

## Commandes gate (ordre release)

```bash
# Plan selon fichiers modifiés (éviter validate-all sur typo doc)
node usr/lib/capsuleos/tools/print-validation-plan.mjs

# Gate complet (obligatoire avant merge significatif — H₆)
node usr/lib/capsuleos/tools/validate-all.mjs

# Ciblés (patch minimal)
node usr/lib/capsuleos/tools/validate-assets-all.mjs
node usr/lib/capsuleos/tools/validate-capsule.mjs
node usr/lib/capsuleos/tools/validate-quality-all.mjs
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs   # skin Linux
```

Brief agent pour une entrée catalogue (P2+ planifié) :

```bash
node usr/lib/capsuleos/tools/print-agent-brief.mjs <id> --write
```

Après changement templates Linux :

```bash
node usr/lib/capsuleos/tools/generate-public-manifest.mjs
node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs
```

---

## Anti-patterns (bloquants culturellement)

1. Agent **sans** skill OS sur un skin multi-toolkit.
2. Nouvelles images hors `usr/share/capsuleos/assets/` et `home/public/Images/`.
3. Fork `contentLoader` / `CapsuleWindow` par distro.
4. `CAPSULE_*` non documentés dans le registre ou le profil.
5. Merge sans `validate-all` vert sur la zone modifiée.
6. Utiliser `rewrite-es6-strict.mjs` (codemod fragile) — ES6 strict manuel + `validate-vanilla-js`.

---

## Liens

- [agent-validation-discipline.md](agent-validation-discipline.md) — matrice gates par type de changement
- [logique-formelle.md](logique-formelle.md) — paradigme agent (référence canonique)
- [equipe-agentique.md](equipe-agentique.md) — staffing
- [manifeste-noyau.md](manifeste-noyau.md) — hydratation technique H0–H6 noyau
- [kernel-supervisor/SKILL.md](../skills/kernel-supervisor/SKILL.md) — migration assets
- [code-quality/SKILL.md](../skills/code-quality/SKILL.md) — ES6 + JSON

---

## Scénarios pédagogiques GNOME (tous vendors)

Pattern reproductible Rocky · Fedora · Alma · Ubuntu :

| Document | Contenu |
|----------|---------|
| [procedure-scenarios-pedagogiques-gnome.md](procedure-scenarios-pedagogiques-gnome.md) | Pattern contrat → validateur → smoke → capture |
| [procedure-playbook-gnome-apps-overview.md](procedure-playbook-gnome-apps-overview.md) | Overview → slot → contrat → gates |
| [procedure-lab-linux-gnome-scenarios.md](procedure-lab-linux-gnome-scenarios.md) | Procédure lab générique |
| [`gnome-user-scenarios-index.json`](../etc/capsuleos/contracts/gnome-user-scenarios-index.json) | Manifeste **17 contrats** · backlog vide · [point-etape-2026-06.md](point-etape-2026-06.md) |

```bash
# Audit gaps overview P0
node usr/lib/capsuleos/tools/lab/audit-gnome-overview-scenarios.mjs --id linux-alma

# Gate agrégée scénarios
node usr/lib/capsuleos/tools/validate-gnome-user-scenarios-all.mjs

# Smoke (paramétrable --id)
CAPSULE_HTTP_BASE=http://127.0.0.1:5501 \
  node usr/lib/capsuleos/tools/lab/smoke-gnome-themes-scenarios.mjs --id linux-alma
```

## AlmaLinux GNOME — campagne clone (juin 2026)

Référence dédiée `linux-alma` (cycles C0–C30, Π priority = 96, overview **15/15**) :

| Document | Contenu |
|----------|---------|
| [procedure-lab-linux-alma-gnome.md](procedure-lab-linux-alma-gnome.md) | VM, cycles, gates, commandes |
| [inventaire-parite-alma.md](inventaire-parite-alma.md) | État Π, clôture overview C30 |
| [point-etape-2026-06.md](point-etape-2026-06.md) | Audit transversal post C30 |
| [`linux-alma-parity-index.json`](inventaires/linux-alma-parity-index.json) | Indice machine Π par slot |

**17 contrats scénarios** (C15–C30) · backlog manifeste **vide** · prochaine priorité : réplication vers Rocky / Fedora / Ubuntu.
