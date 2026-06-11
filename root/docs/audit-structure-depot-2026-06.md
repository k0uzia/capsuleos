# Audit structure — dépôt CapsuleOS (juin 2026)

> **Périmètre** : dépôt entier · **Référence** : [convention-taxonomie-semantique.md](convention-taxonomie-semantique.md) · [convention-raisonnement-inductif-deductif.md](convention-raisonnement-inductif-deductif.md)

---

## 1. Flux zones Z0→Z4

```text
Z0 contrats/proc  →  Z1 usr/lib + usr/share  →  Z2 home/<Vendor>  →  Z3 OS/.../index.html  →  Z4 var/lib/generated
```

| Zone | Chemins | État audit |
|------|---------|------------|
| **Z0** | `etc/capsuleos/contracts/` (56 JSON), `proc/linux-*/` | Cohérent ; OsRepro + 7 chaînes replication |
| **Z1** | `usr/lib/capsuleos/`, `usr/share/capsuleos/` | Canon ; ground store (`gnome-software-ground.js`) |
| **Z2** | `home/RedHat|Debian|SUSE/...` | 11 skins bureau actifs ; Rocky gel ManA |
| **Z3** | `OS/linux/families/*/index.html` (seul fichier par façade) | Généré ; `<base href>` → `home/` ; gate `validate-linux-facades.mjs` |
| **Z4** | `var/lib/capsuleos/generated/` | 8 artefacts ; régénérer via build/sync |

**Interdit confirmé** : logique commune dans `home/` — noyau `usr/lib` (P12).

---

## 2. Dette chemins

| Signal | Détail | Cible |
|--------|--------|-------|
| Legacy apps | ~~`OS/linux/shared/apps/`~~ → purgé ; canon `usr/share/capsuleos/linux/apps/` | `purge-repo-hygiene.mjs` |
| Legacy kernel | ~~`OS/linux/kernel/js/`~~ → purgé ; canon `usr/lib/capsuleos/shells/linux/` | `purge-repo-hygiene.mjs` |
| Dual lab | `root/tools/lab/` (83 fichiers shell/matrices) + `usr/lib/.../lab/` (~250 Node) | Split intentionnel ; matrices vendor par distro |
| Dual façade | `home/*/index.html` + `OS/.../index.html` uniquement | sync-linux-skin-closure · orphelins Z3 interdits |
| Assets vendor | Doc `vendors/` vs réalité `usr/share/capsuleos/assets/images/vendors/` | Convention assets à jour |

---

## 3. Taxonomie contrats (10 familles)

| Famille | N | Orchestrateur principal |
|---------|---|-------------------------|
| Orchestration | 5 | `run-capsule-pipeline.mjs` |
| Chaînes replication | 7 | `run-*-replication-chain.mjs` |
| Catalogue / slots | 5 | `generate-*-catalog.mjs` |
| UI / chrome | 8 | `validate-ui-contracts-all.mjs` |
| Scénarios GNOME | 17 | `validate-gnome-user-scenarios-all.mjs` |
| Terminal | 4 | `validate-terminal-commands.mjs` |
| Playbook général | 1 | `run-playbook-general.mjs` |
| VM / fidélité | 6 | collectors lab |
| Pédagogie / locale | 2 | `validate-pedagogical-modules.mjs` |
| OsRepro / cohérence | 2 | `validate-os-reproduction-coherence.mjs` |

**Spine** : `os-reproduction-coherence.json` lie pipeline, apps, store, lab-recipe, slots, store-content.

---

## 4. Surface tooling

| Catégorie | Volume |
|-----------|--------|
| Validateurs `validate-*.mjs` | 75 |
| Smokes `smoke-*.mjs` | 107 |
| Orchestrateurs lab `run-*.mjs` | 26 |
| États `*-formal-state.json` | 5 persistés |

**Pyramide H₂** : `validate-all` → assets + links + capsule + quality (dont OsRepro + ui-contracts).

**Redondance** : `validate-css-asset-urls` et `audit-asset-paths` dans assets-all ET links-all (double exécution).

---

## 5. Corpus `root/docs/`

| Tier | Rôle | Exemples |
|------|------|----------|
| Canon §3.1 | Lire avant écrire | fondements, taxonomie, logique-formelle, reproduction-parfaite |
| Procédures | Exécuter campagnes | procedure-*-replication-formelle |
| État | Générer, ne pas éditer | `inventaires/*.json`, `avancement-formel-*.md` |
| Secondaire | Ne pas prioriser | `roadmap.md`, `*-roadmap*.md` |

**Dette** : MD parité parallèles aux JSON inventaires (~240 fichiers inventaires).

---

## 6. Familles OS (structure campagne)

| Famille | Z0 chaîne | Profil recette | VM lab |
|---------|-----------|----------------|--------|
| GNOME triplet | replication + apps + store + OsRepro | `lab-recipe-profiles` | Rocky, Fedora, Alma, Ubuntu |
| Mint Cinnamon | `cinnamon-ground-truth-chain` | `skin-toolkit-recipe` | Mint |
| KDE | `kde-ground-truth-chain` | partiel | KDE-neon, openSUSE |
| Windows/macOS/mobile | proc/ sans manifeste VM | modèle distinct | N/A |

---

## 7. Synthèse structurelle

**Points forts** : zones Z0–Z4 documentées ; 56 contrats ; pipeline unifié déclaré ; OsRepro inscrit.

**Points faibles** : contrats store/CR sans runtime complet (corrigé Phase 5 plan) ; état campagne éclaté ; tooling vendor-centrique (Rocky) ; deux vocabulaires recette (lab-recipe vs skin-toolkit-recipe).

Voir [audit-processus-campagnes-2026-06.md](audit-processus-campagnes-2026-06.md) pour orchestration et hypothèses H1–H6.
