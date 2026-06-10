# CapsuleOS — corpus documentation & vision technique

> **Document d’entrée unique** pour agents IA et contributeurs humains (juin 2026).  
> **Obligation** : toute écriture respecte [convention-clean-code.md](convention-clean-code.md) (**P12**) — ce README en fait partie intégrante par référence.

---

## 1. Vision commune

CapsuleOS est une **expérience de pensée matérialisée** : reproduction **maximale** d’un bureau réel dans une enveloppe **100 % statique** (HTML5, CSS3, ES6, navigateur, `file://` ou HTTP minimal).

| Dimension | Choix |
|-----------|--------|
| **Finalité** | Pédagogie terrain — illectronisme, autonomie face aux démarches en ligne |
| **Méthode** | Sandbox + parité documentée VM ↔ Capsule |
| **Limite structurelle** | Pas de noyau exécuté, pas d’hyperviseur dans le navigateur |
| **Moteur** | Fidélité expérientielle (**Vp**, **VΣ**, **Tf**) — pas une maquette décorative |

Phrase d’architecture (validée) :

```text
Noyau core agnostique → adaptateur kernelId → comportements toolkit
  → skin vendor scellé → vérité machine proc/ → façade OS/ → expérience navigateur
```

Référence philosophique : [fondements-philosophiques.md](fondements-philosophiques.md).

---

## 2. Cloisonnement — cinq zones (ne pas mélanger)

| Zone | Chemin | Contient | Qui écrit |
|------|--------|----------|-----------|
| **Z0** | `etc/`, `proc/` | Contrats, registre, manifestes VM | Pipeline lab |
| **Z1** | `usr/lib/`, `usr/share/` | Noyau, gabarits, assets système | Intégrateur kernel |
| **Z2** | `home/<Vendor>/` | Skin source (HTML/CSS/JS distro) | Clone VM post-gates |
| **Z3** | `OS/.../index.html` | Façades pick-os (`<base href>`) | `sync-linux-skin-closure` |
| **Z4** | `var/.../generated/` | Embeds offline | Build opt-in |

**Flux épistémique** : Z0 → Z1/Z2 → Z3 → navigateur. **Jamais** Z2 → Z0 (le skin ne devine pas la VM).

**Agnosticisme (P3, P4)** : comportement commun → `usr/lib/` ; chrome toolkit → `themes/clusters/toolkit-*` ; identité distro → `home/` + `vendors/<vendor>/` uniquement.

---

## 3. Paradigme d’exécution singulier

Une seule chaîne de décision. Pas de roadmap parallèle, pas d’inventaire JSON comme ordre de travail.

### 3.1 Canon (lire avant d’écrire)

| # | Document | Rôle |
|---|----------|------|
| 1 | [fondements-philosophiques.md](fondements-philosophiques.md) | Constitution **P1–P12** |
| 2 | [convention-taxonomie-semantique.md](convention-taxonomie-semantique.md) | **Pierre angulaire** — identités, zones, slot/variant/skin |
| 3 | [logique-formelle.md](logique-formelle.md) | Prédicats, **R-LOC1**, **R-IMP1**, **Tax** / **TaxΣ**, **OsRepro** |
| 3b | [convention-reproduction-parfaite.md](convention-reproduction-parfaite.md) | Cohérence, déduction, grille argumentation, critères reproduction parfaite |
| 3c | [convention-raisonnement-inductif-deductif.md](convention-raisonnement-inductif-deductif.md) | Induction VM → déduction gates (campagnes) |
| 3d | [audit-structure-depot-2026-06.md](audit-structure-depot-2026-06.md) · [audit-processus-campagnes-2026-06.md](audit-processus-campagnes-2026-06.md) | Audits architecture et processus |
| 4 | [plan-maitre-reproduction-os.md](plan-maitre-reproduction-os.md) | Phases, backlog §16, recette économe |
| 5 | [plan-phase-1-gnome-triplet.md](plan-phase-1-gnome-triplet.md) | Détail phase active (1e) |
| 6 | [convention-clean-code.md](convention-clean-code.md) | **Obligation d’écriture** |

### 3.2 Décision (exécuter)

```bash
node usr/lib/capsuleos/tools/lab/run-capsule-pipeline.mjs --id <registryId>
# ou inspection :
node usr/lib/capsuleos/tools/lab/resolve-agent-action.mjs --id <registryId> --scope pipeline
```

### 3.3 État (générer, ne pas éditer à la main)

```bash
node usr/lib/capsuleos/tools/lab/generate-formal-advancement-report.mjs --write
node usr/lib/capsuleos/tools/validate-all.mjs   # H₂
```

### 3.4 Grille de maturité cible

```text
M → ManΣ → AppΣ → PbΣ → Vp → VΣ → Tf → H₆
```

---

## 4. Clean code — écriture dans le bon contexte (**P12**)

[convention-clean-code.md](convention-clean-code.md) **intègre ce README** : avant tout commit ou patch, vérifier zone Z0–Z4, `registryId`, toolkit, et compatibilité plan maître.

Résumé obligatoire :

| Surface | Règle |
|---------|--------|
| **Code** | Noyau agnostique ; pas de fork par distro ; extension avant nouveau module (**P7**) |
| **Doc** | Pas de plan d’exécution parallèle ; pas de priorité depuis `roadmap.md` |
| **Données** | `proc/<registryId>/` ; **P11** — pas de fallback cross-vendor |
| **Git** | Pas de `*-resolve.json` ni sortie pipeline partielle |

Checklist commit : convention-clean-code §5.

---

## 5. Opérationnel — spécialisations (sous le plan maître)

| Domaine | Documents |
|---------|-----------|
| Accueil nouvel OS (participatif) | [convention-accueil-os.md](convention-accueil-os.md) |
| ManΣ / clone VM | [convention-manifest-vm.md](convention-manifest-vm.md) · [convention-reproduction-os.md](convention-reproduction-os.md) |
| GNOME design (réf.) | [branche-redhat-gnome.md](branche-redhat-gnome.md) · [procedure-lab-linux-rocky-gnome.md](procedure-lab-linux-rocky-gnome.md) |
| Cinnamon collecte (réf.) | [procedure-clonage-os-depuis-vm.md](procedure-clonage-os-depuis-vm.md) |
| Apps | [procedure-apps-catalog.md](procedure-apps-catalog.md) · [convention-composants-ui.md](convention-composants-ui.md) · [convention-composants-gnome.md](convention-composants-gnome.md) |
| Paramètres GNOME | [procedure-creation-playbook-gnome-settings.md](procedure-creation-playbook-gnome-settings.md) |
| Assets VM | [convention-assets-depuis-vm.md](convention-assets-depuis-vm.md) |
| Styles / JS navigateur | [contrib.md](../../contrib.md) · `writing.md` |

En cas de conflit entre procédure et plan maître → **plan maître prime**.

---

## 6. Données — inventaires (`inventaires/`)

| Type | Exemples | Usage |
|------|----------|-------|
| État persisté | `*-formal-state.json`, `avancement-formel-*` | Gates |
| VM / parité | `*-vm.json`, `inventaire-parite-*.md` | Mesure P0/P1/P2 |
| Clôture | `*-h6-closure.json` | Domaine terminé |

**Éphémères (gitignorés)** : `*-pipeline-resolve.json`, `*-formal-resolve.json`, `*-playbook-general-resolve.json`.

---

## 7. Documents secondaires — ne pas prioriser

| Document | Rôle |
|----------|------|
| [point-etape-2026-06.md](point-etape-2026-06.md) | **État transversal** juin 2026 — Alma C30, classification apps, gates |
| [roadmap.md](roadmap.md) | Vision pédagogique, % maturité — **pas** l’ordre d’exécution |
| [architecture-globale.md](architecture-globale.md) | Navigation dépôt |
| [manifeste-noyau.md](manifeste-noyau.md) | Hydratation technique noyau |
| `briefs/*.md` | Fiches distro générées |

---

## 8. Références légales et conduite

| Document | Rôle |
|----------|------|
| [../../CODE_OF_CONDUCT.md](../../CODE_OF_CONDUCT.md) | Communauté + standards techniques |
| [../../LICENSE.md](../../LICENSE.md) | Licence logicielle (résumé) · texte intégral `LICENSE` |

---

## 9. Points d’entrée par profil

| Profil | Chemin |
|--------|--------|
| **Humain** | [../../contrib.md](../../contrib.md) → ce README → plan maître |
| **Agent Cursor** | [../AGENTS.md](../AGENTS.md) · `.cursor/rules/` |
| **Racine dépôt** | [../../README.md](../../README.md) (vue publique + pédagogie) |

---

*Dernière mise à jour : juin 2026 — corpus singulier, P11/P12, Phase 1e, [point-etape-2026-06.md](point-etape-2026-06.md).*
