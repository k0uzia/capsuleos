# Équipe agentique CapsuleOS — staffing à l'échelle

Modèle d'organisation des agents Cursor pour faire grandir le catalogue OS **sans chaos**.

**Références** : [AGENTS.md](../AGENTS.md) · [repertoire-os.md](repertoire-os.md) · [scalabilite-noyau.md](scalabilite-noyau.md)

---

## Principe

> **Un orchestrateur route, un skill OS possède, vendor/distribution/version/langage précisent, un rôle exécute.**

Hiérarchie générée : [skills-hierarchie.md](skills-hierarchie.md) — `seed-agent-skills.mjs --write`.

Pas d'agent « généraliste » sur un skin KDE + checklist + assets — découper en tâches avec contrats JSON vérifiables.

**Formation avant action** : skill [`onboarding`](../skills/onboarding/SKILL.md) + [parcours-agent.md](parcours-agent.md) (H0–H6) ; gate [`validate-all.mjs`](../../usr/lib/capsuleos/tools/validate-all.mjs). Extension catalogue : [ajouter-os-scalable.md](ajouter-os-scalable.md).

---

## Organigramme

```
                    ┌─────────────────────┐
                    │     onboarding      │
                    │ H0–H6, validate-all │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │ kernel-supervisor   │
                    │ (migration noyau,   │
                    │  assets, hydratation)│
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │  os-orchestrator    │
                    │  (routage demande)  │
                    └──────────┬──────────┘
                               │
       ┌───────────────────────┼───────────────────────┐
       ▼                       ▼                       ▼
┌─────────────┐        ┌─────────────┐        ┌─────────────┐
│  os-linux   │        │ os-windows  │        │  os-macos   │
│  os-android │        │  os-ios     │        │  os-bsd     │
│ os-chromeos*│        │             │        │             │
└──────┬──────┘        └──────┬──────┘        └──────┬──────┘
       │                      │                      │
       └──────────────────────┼──────────────────────┘
                              ▼
              ┌───────────────────────────────┐
              │ Rôles (1 par tâche dominante)  │
              │ role-integrator               │
              │ role-developer                │
              │ role-web-designer             │
              │ role-graphic-artist           │
              │ role-designer                   │
              │ role-manager                    │
              └───────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │ coordinator         │
                    │ (multi-familles)    │
                    └─────────────────────┘
```

\* `os-chromeos`, `os-harmonyos`, `os-unix` : stubs → copier `os-stub/SKILL.md`.

---

## Matrice d'affectation par type de tâche

| Tâche | Skill OS | Rôle | Entrées obligatoires |
|-------|----------|------|----------------------|
| Nouveau skin Linux dérivé KDE | `os-linux` | `role-integrator` | `os-registry.json`, toolkit `kde` |
| Correctif Dolphin / Nemo | `os-linux` | `role-developer` | `contrib.md`, explorateurs README |
| Tokens CSS distro | `os-linux` | `role-web-designer` | `body#`, variables-linux |
| Pack icônes FOSS | `os-linux` | `role-graphic-artist` + `asset-pipeline` | `assets/manifest.json`, licence |
| Migration assets → noyau | **`kernel-supervisor`** | `asset-pipeline` + `kernel-guardian` | `validate-asset-zones.mjs`, [roadmap §0.5](roadmap.md) |
| Noyau CapsuleWindow | `kernel-guardian` | `role-developer` | `common/window/README.md` |
| Version Windows historique | `os-windows` | `role-integrator` | kernel `OS/windows/` |
| Parcours checklist pédagogique | `os-orchestrator` | `role-designer` | missions, vocabulaire local |
| Release / roadmap | — | `role-manager` | `roadmap.md`, checklist dans `contrib.md` |
| Portail pick-os | `coordinator` | `role-developer` | `os-registry.json` |

---

## Staffing par tier OS

| Tier | Équipe minimale | Durée indicative | Gate qualité |
|------|-----------------|------------------|--------------|
| **P0** | integrator + developer + designer | continu | Régression Mint 0 tolérance |
| **P1** | integrator + web-designer | 1–2 sem / OS | DoD skin abouti (roadmap) |
| **P2** | integrator seul (toolkit existant) | 3–5 j | Shell + explorateur + 3 apps |
| **P3** | integrator + graphic-artist | 1 sem | L1 maturité |
| **P4** | os-stub + manager | spike 1 j | Faisabilité doc only |

---

## Superviseur noyau (formel)

### [`kernel-supervisor`](../skills/kernel-supervisor/SKILL.md)

Orchestre Phase 0.5 roadmap, séquence les vagues de migration, bloque les skins tant que `validate-asset-zones` échoue. Délègue à :

| Skill fils | Rôle |
|------------|------|
| [`asset-pipeline`](../skills/asset-pipeline/SKILL.md) | Copie, rewrite chemins, manifest, pick-os |
| [`kernel-guardian`](../skills/kernel-guardian/SKILL.md) | JS noyau, embeds, régression Mint P0 |

Le `coordinator` reste le routeur **produit multi-familles** ; il renvoie au superviseur dès qu’assets/noyau sont en jeu.

## Rôles émergents (recommandés)

### Curateur registre (`registry-curator`)

**Non-skill formel aujourd'hui** — fonction assignée à `role-manager` ou `coordinator` :

- Maintenir `os-registry.json` et `build-os-registry.mjs`
- Vérifier sync pick-os ↔ registre (jusqu'à génération auto S7)
- Valider `sources[]` et licences assets

---

## Brief type pour lancer un agent

Génération automatique depuis le registre :

```bash
node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-elementary --write
node usr/lib/capsuleos/tools/print-agent-brief.mjs --list --tier P2 --status planned
```

Sortie : `root/docs/briefs/<id>.md`. Modèle manuel ci-dessous si besoin.

```markdown
## Contexte
- Entrée registre : `linux-elementary` (P2, planned)
- Toolkit : pantheon
- Référence visuelle : elementary HIG

## Fichiers canon
- etc/capsuleos/os-registry.json
- usr/share/capsuleos/linux/explorers/
- root/docs/manifeste-noyau.md § Hydratation

## Livrables
1. Façade OS/linux/families/debian/elementary/ + home miroir
2. skin.profile.json
3. style/imports.css + tokens pantheon
4. Entrée status → beta dans build-os-registry.mjs
5. Checklist DoD roadmap § skin abouti

## Interdits
- Fork contentLoader
- Assets dans home/public/
- @import dans CSS injecté
```

---

## Parallélisation sûre

| Peut paralléliser | Ne pas paralléliser |
|-------------------|---------------------|
| Skins Linux de toolkits différents | 2 agents sur même skin |
| Assets pack + doc registre | 2 agents sur CapsuleWindow |
| Windows version + macOS version | embed regen concurrent |
| CSS skin + JS app métier | contentLoader + windowContainer même PR |

---

## Escalade

| Situation | Agent |
|-----------|-------|
| Famille OS inconnue | `os-orchestrator` |
| Toucher > 2 familles | `coordinator` |
| Conflit toolkit (GNOME vs KDE) | `role-manager` tranche |
| Régression P0 Mint | stop — `kernel-guardian` |
| Migration assets bloquée / 45+ violations | `kernel-supervisor` planifie vague |

---

## Skills à créer (backlog)

| Skill | Quand |
|-------|-------|
| `os-chromeos` (réel) | Entrée chromeos → beta |
| `registry-curator` | S4 validate-capsule en place |

Copier depuis [`skills/os-stub/SKILL.md`](../skills/os-stub/SKILL.md).

**Créés juin 2026 :** `kernel-supervisor`, `asset-pipeline`, `kernel-guardian`.

---

## Checklist onboarding nouvel agent

- [ ] Lire [manifeste-noyau.md](manifeste-noyau.md)
- [ ] Lire skill OS + rôle assignés
- [ ] Identifier entrée `os-registry.json`
- [ ] Confirmer tier et maturité cible
- [ ] Lister `CAPSULE_*` existants du toolkit de référence
- [ ] Ne pas créer README sous `OS/` (règle projet)

*Staffing vivant — ajuster après retours terrain conseillers numériques.*
