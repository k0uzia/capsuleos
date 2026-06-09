# Guide agents — sélection des skills `/root`

## Principe

CapsuleOS est un **rootfs web** : le code applicatif vit sous `CapsuleOS/` (`home/`, `usr/`, `OS/`, `var/`, `index.html`). Le dossier `root/` documente **comment** travailler sur ce dépôt, pas du code utilisateur final.

## Fondements et logique formelle

**Philosophie du projet** : [`docs/fondements-philosophiques.md`](docs/fondements-philosophiques.md) — mimesis pédagogique, ontologie des couches, épistémologie `proc/`, éthique de la représentation.

**Référence canonique** : [`docs/logique-formelle.md`](docs/logique-formelle.md) — prédicats (**H₂**, **A**, **S**, **I**, **L**, **V**…), règles d’inférence, procédure de décision autonome.

**Corpus unique (obligatoire P12)** : [`docs/README.md`](docs/README.md) · [`docs/convention-taxonomie-semantique.md`](docs/convention-taxonomie-semantique.md) · [`docs/convention-clean-code.md`](docs/convention-clean-code.md)

**Roadmap exécution** : [`docs/plan-maitre-reproduction-os.md`](docs/plan-maitre-reproduction-os.md) — seule source d’ordre des phases · Phase 1 détail : [`plan-phase-1-gnome-triplet.md`](docs/plan-phase-1-gnome-triplet.md).

**Décision pipeline** : `node usr/lib/capsuleos/tools/lab/run-capsule-pipeline.mjs --id <registryId>` ou `resolve-agent-action.mjs --scope pipeline`.

| Règle agent | Comportement |
|-------------|--------------|
| **R-H1** | ¬**H₂** → corriger les gates avant tout patch |
| **R-INV1** | ¬**I** → inventaire VM avant code skin |
| **R-A1** | ¬**A** → `pull-vm-assets.sh`, jamais d’asset inventé |
| **R-AUTO** | Une seule action admissible → exécuter sans demander |
| **R-LOC1** / **P11** | Artefact local manquant → FAIL visible ; jamais fallback cross-vendor |
| **Tax** | Profils `extends` + variants + embed cohérents → `validate-taxonomy.mjs` |

Règle Cursor projet : `.cursor/rules/logique-formelle-capsuleos.mdc` (`alwaysApply`).

## Formation avant action (obligatoire si doute)

1. Skill [`onboarding`](skills/onboarding/SKILL.md) — parcours H0→H6 + logique formelle.
2. Doc [`docs/logique-formelle.md`](docs/logique-formelle.md) puis [`docs/parcours-agent.md`](docs/parcours-agent.md) + [`docs/ajouter-os-scalable.md`](docs/ajouter-os-scalable.md) pour nouveau vendor / distro / toolkit.
3. Gate : `node usr/lib/capsuleos/tools/validate-all.mjs` (baseline puis clôture).

## Workflow de sélection

```
Demande utilisateur
       │
       ▼
  Premier contact / nouvel OS / merge ? ──oui──► onboarding (H0–H2)
       │
       ▼
  Migration assets / validate-asset-zones / noyau ? ──oui──► kernel-supervisor
       │ non                                                      │
       ▼                                                          ├─ asset-pipeline
  Clone / parité VM ? ──oui──► os-clone-from-vm                     └─ kernel-guardian
       │
       ▼
  OS ciblé clair ? ──non──► skills/os-orchestrator
       │ oui
       ▼
  skills/os-<famille>
       │
       ▼
  Vendor / distro / version ? ──► capsuleos-vendor-* → capsuleos-distro-* → capsuleos-version-*
       │                              (voir root/skills/_index, docs/skills-hierarchie.md)
       ▼
  Langage (JS, CSS, JSON, HTML) ? ──► capsuleos-lang-*
       │
       ▼
  Type de travail ?
       ├─ UI/parcours      → role-designer (+ role-web-designer si mise en page)
       ├─ code JS/HTML/CSS → role-developer
       ├─ assets visuels   → role-graphic-artist (+ asset-pipeline si déplacement pack)
       ├─ skin / façade    → role-integrator (+ os-*)
       ├─ planning/livrable → role-manager
       └─ multi-domaines   → coordinator
```

## Règles

1. **Contrat** : avant toute modification app, lire les sections pertinentes de [`writing.md`](../../writing.md) (workspace parent). Checklist : [contrib.md § Checklist contrat](../contrib.md#checklist-contrat-avant-merge-ou-release).
2. **Un skill OS + un skill rôle** suffisent en général ; ajouter `coordinator` si la tâche touche plusieurs familles ou plusieurs rôles ; **`kernel-supervisor`** si migration assets ou gate `validate-asset-zones`.
3. **Chemins** : éditer uniquement sous `CapsuleOS/` ; ne pas confondre `CapsuleOS/root/` avec `/root` de l’OS hôte.
4. **Doc développeur** : pas de nouveaux `README.md` sous `OS/` (règle projet) ; notes agents ici ou sous `root/docs/`.
5. **Français** : docs humaines en français ; skills en français pour cohérence équipe.
6. **Concision** : les `SKILL.md` sont des fiches opérationnelles, pas des encyclopédies — approfondir via les liens `docs/` et les README existants (`usr/share/capsuleos/linux/explorers/README.md`, etc.).

## Invocations explicites

L’utilisateur peut nommer un skill : « utilise le skill os-linux et role-integrator ». Sinon, déduire depuis la demande (ex. « icônes Fedora » → `os-linux` + `role-graphic-artist`).

## Fichiers de référence rapide

| Besoin | Fichier |
|--------|---------|
| **Manifeste noyau & hydratation** | [`root/docs/manifeste-noyau.md`](docs/manifeste-noyau.md) |
| **Catalogue OS (57 entrées, gel noyau)** | [`root/docs/manifeste-kernels.md`](docs/manifeste-kernels.md), [`etc/capsuleos/kernels.json`](../etc/capsuleos/kernels.json), [`etc/capsuleos/os-registry.json`](../etc/capsuleos/os-registry.json) |
| **Scalabilité statique** | [`root/docs/scalabilite-noyau.md`](docs/scalabilite-noyau.md) · **Lj_fr** défaut, **Lj_en**/QWERTY prévus (§7, `locale-scalability.json`) |
| **Staffing agents** | [`root/docs/equipe-agentique.md`](docs/equipe-agentique.md) |
| **Logique formelle (gates & décision)** | [`root/docs/logique-formelle.md`](docs/logique-formelle.md), `.cursor/rules/logique-formelle-capsuleos.mdc` |
| **Réplication formelle (tous vendors)** | [`root/docs/procedure-replication-formelle.md`](docs/procedure-replication-formelle.md) |
| **Socle shell global (terminal)** | [`root/docs/convention-shell-global.md`](docs/convention-shell-global.md), prédicats **Ti–TΣ′** |
| **Rendu sorties terminal** | [`root/docs/convention-terminal-rendu-sortie.md`](docs/convention-terminal-rendu-sortie.md), **To**, **Tb**, bashrc |
| **Modules pédagogiques `/mnt`** | [`root/docs/convention-modules-mnt.md`](docs/convention-modules-mnt.md), **Pm**, `mnt/catalog.json` |
| **Parcours agent (H0–H6)** | [`root/docs/parcours-agent.md`](docs/parcours-agent.md), skill [`onboarding`](skills/onboarding/SKILL.md) |
| **Ajouter distro / vendor** | [`root/docs/ajouter-os-scalable.md`](docs/ajouter-os-scalable.md) |
| **Hiérarchie skills** | [`root/docs/skills-hierarchie.md`](docs/skills-hierarchie.md), `seed-agent-skills.mjs --write` |
| **Taxonomie (pierre angulaire)** | [`docs/convention-taxonomie-semantique.md`](docs/convention-taxonomie-semantique.md), `etc/capsuleos/contracts/taxonomy.json` |
| **Gate taxonomie** | `node usr/lib/capsuleos/tools/validate-taxonomy.mjs` |
| **Recette skin/toolkit** | `node usr/lib/capsuleos/tools/linux/run-toolkit-skin-recipe.mjs` |
| **Gate release complète** | `node usr/lib/capsuleos/tools/validate-all.mjs` |
| **Liens & médias (file:// + HTTP)** | [`root/docs/routage-donnees-medias.md`](docs/routage-donnees-medias.md), skill [`link-routing`](skills/link-routing/SKILL.md) |
| Toolkits GUI Linux (GTK/Qt/Cinnamon/COSMIC) | [contrib.md § toolkits](../contrib.md#bibliotheques-graphiques-linux-toolkits-gui) |
| Home simulé partagé | `home/public/`, `usr/lib/capsuleos/common/user-home.js` |
| Assets système (icônes noyau) | `usr/share/capsuleos/assets/`, `assets/manifest.json` |
| Migration / supervision noyau | [`skills/kernel-supervisor`](skills/kernel-supervisor/SKILL.md), [roadmap §0.5](docs/roadmap.md) |
| Explorateurs Linux | `usr/share/capsuleos/linux/explorers/`, `usr/lib/capsuleos/shells/linux/explorers/` |
| Embeds offline | `var/lib/capsuleos/generated/`, outils `usr/lib/capsuleos/tools/` |
| Facades URL | `OS/<famille>/` |
| Skins dérivés | `home/<Vendor>/` miroir des entrées sous `OS/linux/families/` |

## Extension

Nouvelle famille d’OS : copier la logique de [skills/os-stub/SKILL.md](skills/os-stub/SKILL.md), créer `skills/os-<nom>/`, mettre à jour [docs/familles-os.md](docs/familles-os.md) et [README.md](README.md).
