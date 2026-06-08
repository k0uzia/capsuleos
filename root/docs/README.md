# Documentation CapsuleOS — corpus unique

> **Un seul paradigme d’exécution** (juin 2026). Tout agent ou contributeur lit **d’abord** la colonne **Canon**, puis exécute via le **pipeline** — pas via des roadmaps parallèles ni des inventaires JSON comme instructions.

---

## 1. Canon — pourquoi et quoi faire maintenant

| Priorité | Document | Rôle |
|----------|----------|------|
| 1 | [fondements-philosophiques.md](fondements-philosophiques.md) | Constitution (**P1–P11**) |
| 2 | [logique-formelle.md](logique-formelle.md) | Prédicats, règles **R-***, décision (**R-LOC1**) |
| 3 | [plan-maitre-reproduction-os.md](plan-maitre-reproduction-os.md) | **Roadmap exécution** — phases, backlog §16, recette économe §4.4 |
| 4 | [plan-phase-1-gnome-triplet.md](plan-phase-1-gnome-triplet.md) | Détail Phase 1 (vague **1e** en cours) |

**Commande unique de décision** :

```bash
node usr/lib/capsuleos/tools/lab/resolve-agent-action.mjs --id <registryId> --scope pipeline
# ou exécution directe :
node usr/lib/capsuleos/tools/lab/run-capsule-pipeline.mjs --id <registryId>
```

**État hebdomadaire** (généré, pas édité à la main) :

```bash
node usr/lib/capsuleos/tools/lab/generate-formal-advancement-report.mjs --write
```

---

## 2. Opérationnel — comment (spécialisations du plan)

| Domaine | Document | Quand |
|---------|----------|-------|
| Clone VM Linux | [convention-manifest-vm.md](convention-manifest-vm.md) · [convention-reproduction-os.md](convention-reproduction-os.md) | ManΣ, nouveau `registryId` |
| GNOME RHEL référence design | [branche-redhat-gnome.md](branche-redhat-gnome.md) · [procedure-lab-linux-rocky-gnome.md](procedure-lab-linux-rocky-gnome.md) | Parité shell Rocky |
| Cinnamon référence collecte | [procedure-clonage-os-depuis-vm.md](procedure-clonage-os-depuis-vm.md) | Mint — **Phase 3** plan maître |
| Apps | [procedure-apps-catalog.md](procedure-apps-catalog.md) | AppΣ |
| Paramètres GNOME | [procedure-creation-playbook-gnome-settings.md](procedure-creation-playbook-gnome-settings.md) | PbΣ / H₆ settings |
| Assets VM | [convention-assets-depuis-vm.md](convention-assets-depuis-vm.md) | Pull / WebP |

Ces procédures **ne contredisent pas** le plan maître : elles en sont des **spécialisations**. En cas de doute, le plan maître prime.

---

## 3. Données — inventaires (ground truth, pas instructions)

Répertoire : [`inventaires/`](inventaires/)

| Type | Exemples | Usage |
|------|----------|-------|
| **État persisté** | `*-formal-state.json`, `avancement-formel-*.json` | Gates enregistrés |
| **VM / parité** | `*-vm.json`, `inventaire-parite-*.md` | Mesure, écarts P0/P1/P2 |
| **Playbook / closure** | `*-h6-closure.json`, `*-playbook-tail.json` | Clôture domaine |

### Artefacts éphémères — ne pas versionner

Les fichiers `*-pipeline-resolve.json`, `*-formal-resolve.json`, `*-playbook-general-resolve.json` sont des **instantanés** de `resolve-agent-action` : utiles en session, **parasites** dans git (dates et prédicats obsolètes → agents induits en erreur).

Régénérer à la volée :

```bash
node usr/lib/capsuleos/tools/lab/resolve-agent-action.mjs --id linux-ubuntu --scope pipeline
```

---

## 4. Documents secondaires — ne pas utiliser pour prioriser

| Document | Statut |
|----------|--------|
| [roadmap.md](roadmap.md) | **Vision pédagogique** et maturité estimée — pas l’ordre d’exécution |
| [scalabilite-noyau.md](scalabilite-noyau.md) | Jalons techniques noyau (S2–S6) |
| [architecture-globale.md](architecture-globale.md) | Navigation dépôt |
| `briefs/*.md` | Fiches distro générées |

---

## 5. Règle anti-parasite (agents & humains)

1. **Une** roadmap d’exécution : `plan-maitre-reproduction-os.md`.
2. **Une** décision : `run-capsule-pipeline` / `resolve-agent-action --scope pipeline`.
3. **P11** : pas de fallback cross-vendor (matrice, manifeste, playbook).
4. Les inventaires JSON **décrivent** l’état ; ils **ne remplacent pas** le plan.
5. Ne pas committer les `*-resolve.json` ni les sorties partielles de pipeline interrompu.

---

*Point d’entrée agents : [../AGENTS.md](../AGENTS.md) · Règle Cursor : `.cursor/rules/logique-formelle-capsuleos.mdc`*
