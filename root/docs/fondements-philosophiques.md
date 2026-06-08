# Fondements académico-philosophiques — CapsuleOS

> **Statut** : document fondateur (juin 2026) — complète [manifeste-noyau.md](manifeste-noyau.md) et [logique-formelle.md](logique-formelle.md)  
> **Public** : contributeurs, agents, formateurs  
> **Phrase-synthèse** : *CapsuleOS est une **expérience de pensée** (Gedankenexperiment) matérialisée : reproduction **maximale** de l’expérience bureau réelle, dans l’enveloppe **statique + navigateur** — la fidélité est la clé de l’apprentissage.*

---

## 1. Positionnement — ce que CapsuleOS est (et n’est pas)

### 1.1 Nature du projet

CapsuleOS est un **rootfs web statique** : une arborescence de fichiers (HTML, CSS, JS, JSON) qui **simule** des environnements de bureau familiers, exécutable sans hyperviseur, sans compte cloud, sans installation lourde.

| CapsuleOS **est** | CapsuleOS **n’est pas** |
|-------------------|-------------------------|
| Une **expérience de pensée** : bureau réel reproduit au plus près | Un émulateur de noyau (QEMU, Box86…) |
| Un **dispositif où la fidélité fait l’apprentissage** | Une maquette iconographique « inspirée de » |
| Un **modèle** structuré de bureau (slots, chrome, FS, effets, apps) | Une VM conteneurisée dans le navigateur |
| Une **archive active** de conventions UI (GNOME, NT, Darwin…) | Un exécutable système hors navigateur |

**Contrainte d’enveloppe** (non négociable) : 100 % statique, exécutable en navigateur, sans noyau réel. **À l’intérieur de cette enveloppe**, nous poussons la fidélité **au maximum** — pas au minimum.

### 1.2 Thèse centrale — la fidélité comme clé

> **La fidélité n’est pas un enrichissement optionnel : c’est le moteur pédagogique.**

CapsuleOS vise la reproduction d’une **expérience** aussi complète que possible — layout, typographie, transitions, menus, effets, apps, gestes — comme dans une **expérience de pensée très définie** : l’apprenant doit *vivre* le bureau cible, pas seulement le reconnaître de loin.

| Dimension | Statut |
|-----------|--------|
| Gestuelle & sémantique (L2–L3) | Nécessaire, insuffisant seul |
| Parité visuelle pixel (L4, **Vp**) | **Objectif P0** |
| États UI & effets (**VΣ**, apps incluses) | **Objectif P0** — shell **et** applications |
| Ontologie machine (binaire réel) | Hors enveloppe — seule limite structurelle |

Les écarts P1/P2/CapsuleOnly restent **classés et documentés**, mais ils ne définissent pas la cible : ils marquent ce qu’il reste à combler.

---

## 2. Ontologie — qu’est-ce qu’un « OS » ici ?

### 2.1 Strates d’existence

Dans CapsuleOS, un OS n’est pas une entité unique : c’est une **pile de projections** :

```text
Ontologie CapsuleOS (du réel au vécu)

  [R] Référent réel     VM lab, documentation officielle, captures
        ↓ mesure
  [M] Modèle machine    proc/, inventaires JSON, contrats etc/
        ↓ interprétation
  [N] Noyau simulé      usr/lib + usr/share (comportements partagés)
        ↓ stylisation
  [S] Skin vendor       home/ (tokens, chrome, layout)
        ↓ exposition
  [F] Façade URL        OS/ (point d’entrée pick-os)
        ↓ vécu
  [E] Expérience        DOM hydraté dans le navigateur
```

Chaque strate a un **mode d’être** différent :

- **R** existe hors dépôt (monde physique / VM)
- **M** existe comme **vérité documentée** versionnée
- **N, S, F, E** existent comme **artefacts web**

Confondre **M** et **E** (référencer dans le skin un asset non importé) est une **erreur ontologique** — c’est précisément la défaillance observée sur Ubuntu (grille avant import).

### 2.2 Simulacre et transparence

Au sens de la théorie des représentations (Eco, *Lector in fabula* ; Gombrich, *Art and Illusion*), CapsuleOS produit un **simulacre fonctionnel** : l’interface *se comporte comme* un bureau sans *être* le bureau.

**Exigence méthodologique** : lorsque la simulation diverge encore du réel (P1, CapsuleOnly), l’écart doit être **classé, documenté et planifié** — c’est une **dette de fidélité**, pas un choix de design durable. La cible reste la convergence vers l’expérience réelle.

---

## 3. Épistémologie — comment nous connaissons la « vérité »

### 3.1 Hiérarchie des sources

| Rang | Source | Statut épistémique |
|------|--------|-------------------|
| 1 | VM lab observable (SSH, captures, `.desktop`) | **Ground truth** primaire (Linux) |
| 2 | `proc/<registryId>/` dérivé de la VM | **Vérité machine** du dépôt |
| 3 | Inventaires `root/docs/inventaires/` | Interprétation curatée + écarts classés |
| 4 | Documentation officielle (HIG, MSDN-like) | Vérité normative (Windows/macOS/mobile sans VM) |
| 5 | Skin `home/` | **Hypothèse** jusqu’à validation gates |
| 6 | Mémoire agent / intuition | **Inadmissible** sans gate |

**Règle épistémique (R-INV1)** : ¬**I** → pas d’implémentation skin. Ce n’est pas de la bureaucratie : c’est la barrière entre *croire* et *savoir*.

### 3.2 Falsifiabilité

Chaque affirmation de parité doit être **réfutable** par un script :

- `validate-all.mjs` — cohérence structurelle
- smokes lab — comportement slot
- captures VM ↔ Capsule — evidence visuelle

Un skin sans gate vérifiable n’est pas une connaissance : c’est une **opinion esthétique**.

### 3.3 Le rôle de la logique formelle

Les prédicats (**H₂**, **ManΣ**, **AppΣ**, **VΣ**…) ne sont pas un exercice de logique pure. Ils incarnent une **éthique de l’ingénierie** :

> *Ne pas avancer sans avoir rendu la prochaine ignorance visible.*

C’est un pragmatisme à la Peirce : la « vérité » est ce qui **résiste** aux gates, pas ce qui plaît en revue de code.

---

## 4. Finalité pédagogique

### 4.1 Constructionnisme situé

Inspiré de Papert (*Mindstorms*) et des environnements de **situated learning** (Lave & Wenger), CapsuleOS place l’apprenant dans un **bureau reconnaissable** pour ancrer :

- la navigation fichiers ;
- les métaphores fenêtre / application ;
- les conventions terminal / explorateur ;
- la variété des écosystèmes (Debian-like, NT, Plasma…).

Le noyau ne **enseigne** pas la syntaxe `apt` ou `dnf` par théorie : il **expose** un environnement où la syntaxe a un **contexte crédible**.

### 4.2 Niveaux de fidélité — échelle de progression, pas de relâchement

| Niveau | Contenu | Rôle |
|--------|---------|------|
| **L1** | Paradigme bureau navigable | Amorçage catalogue (P3/P4) |
| **L2** | Apps / chrome reconnaissables | Palier intermédiaire |
| **L3** | Parcours checklist structurel | Prérequis avant clôture |
| **L4** | Pixel-parité, animations, **VΣ apps complètes** | **Cible P0 / P1 actifs** |

Un skin **P0** n’est pas « terminé » sans **Vp** et **VΣ** (shell + apps). Les tiers P2/P3 peuvent démarrer plus bas, mais la **trajectoire** du plan maître vise L4/VΣ pour tout registry réactivé.

### 4.3 Dossier `/mnt` — scénarios pédagogiques cross-OS

`/mnt` est le **répertoire d’injection de scénarios pédagogiques** : parcours, missions, contenus didactiques qui peuvent être **déployés sur n’importe quel OS** du catalogue (Ubuntu, Rocky, Windows 11, Sonoma…).

- Ce n’est pas un fork du noyau : les scénarios **s’appuient** sur les bureaux simulés existants.
- La métaphore Linux `mount` reste **utile en doc**, mais la définition opératoire est : *dossier de scénarios poussables sur tous les OS*.
- Données structurées **schema.org** : applicable à `/mnt` **et** à `/OS` (voir §10).

---

## 5. Éthique de la représentation

### 5.1 Principes

1. **Fidélité maximale dans l’enveloppe** — Pousser l’expérience au plus près du réel ; seules limites : statique + navigateur (pas d’hyperviseur, pas de noyau exécuté). Ce n’est pas une invitation à la médiocrité visuelle.
2. **Sécurité opérationnelle** — Distinct de la fidélité : ne pas présenter CapsuleOS comme environnement de production pour opérations sensibles (réseau réel, données critiques). La **ressemblance** est haute ; le **risque système** reste nul.
3. **Non-emprunt** — Les assets d’un vendor ne servent pas un autre (intégrité identitaire des distributions).
4. **Classification des écarts** — P0/P1/P2/CapsuleOnly : dette mesurée vers la fidélité cible, pas excuse permanente.
5. **Accessibilité opt-in** — Une variante orientée accessibilité doit pouvoir être **activée** (`data-font-scale`, contrastes, etc.) ; **par défaut**, le skin reproduit le **comportement VM / vendor** (souvent sans a11y forcée). L’a11y Capsule est une **couche additive**, pas l’état nominal du clone.

### 5.2 Rapport au travail réel des admin / dev

La reproduction fidèle de Rocky ou Ubuntu **respecte** le travail des communautés libres : logos, polices, layouts ne sont pas pastiches génériques. Le **cloisonnement vendor** est une forme de **reconnaissance** des identités techniques, pas seulement du branding.

---

## 6. Esthétique et forme — le CSS comme langage public

### 6.1 Thèse formelle

> **L’interface publique du noyau, ce sont les variables CSS — pas les classes privées du skin.**

Cette thèse évite deux dérives :

- **Dérive décorative** : pixels copiés sans structure ;
- **Dérive framework** : logique UI cachée dans React alors que le contrat est statique.

Les tokens (`--head`, `--win-*`, `--nemo-*`) sont l’équivalent des **API stables** en système distribué : le skin **configure**, il ne **réimplémente** pas.

### 6.2 Statique comme choix moral de portabilité

Le statisme (pas de bundler obligatoire) est un choix **démocratique d’accès** :

- école sans CI ;
- formateur avec clé USB ;
- élève hors ligne.

L’embed offline est une **projection compilée**, pas une dépendance : le source reste lisible.

---

## 7. Agnosticisme — philosophie du cloisonnement

### 7.1 Thèse d’architecture (validée juin 2026)

> **Noyau `core` agnostique → adaptateur `kernelId` → comportements `toolkit` → skin scellé `vendor` → vérité machine `proc/`.**

### 7.2 Justification philosophique

Le cloisonnement n’est pas de la froideur technique : c’est une **séparation des responsabilités** au sens de Simondon (*L’individu et sa genèse physico-biologique*) — chaque couche **individue** un ensemble de propriétés sans absorber la couche inférieure.

| Couche | Question philosophique | Réponse CapsuleOS |
|--------|------------------------|-------------------|
| `core/` | Qu’est-ce qui est universel au navigateur ? | Fenêtre, ressource, bus |
| `shells/<kernel>/` | Qu’est-ce qui est propre à une famille OS ? | Boot, intégration FS |
| Toolkit | Qu’est-ce qui est propre à un DE ? | Chrome GNOME vs Plasma |
| Vendor | Qu’est-ce qui est propre à une distro ? | Dock Ubuntu, Yaru, DNF |
| `proc/` | Qu’est-ce qui est mesuré sur le réel ? | Manifeste, apps, médias |

**Mélanger les couches** (dock Ubuntu sur Rocky) n’est pas une « optimisation » : c’est une **confusion ontologique** qui détruit la crédibilité des deux vendors.

### 7.3 Allowlist + denylist

- **Allowlist** (`skin.profile.json`, `CAPSULE_*`) : ce que le skin **peut** être
- **Denylist** (`skin-vendor-isolation.json`) : ce qu’il **ne doit jamais** charger

La philosophie est **positive** (identité définie) complétée par **garde-fous** (porosité interdite).

---

## 8. Rapport au réel — clone, parité, amélioration continue

### 8.1 Mimesis progressive

La chaîne VM → `proc/` → assets → skin n’est pas un snapshot figé : c’est une **mimesis itérative** (réf. Auerbach, *Mimesis* — représentation fidèle du réel dans l’art occidental, adaptée ici à l’ingénierie).

Chaque passe (ManΣ, AppΣ, VΣ) **rapproche** la projection **E** du modèle **M**, sans prétendre fusionner **E** et **R**.

### 8.2 Amélioration continue multi-vendor

L’universalisation du manifeste n’abolit pas le vendor : elle **formalise** la mesure pour chaque identité. Fedora n’est pas Rocky ; Mint n’est pas Ubuntu. L’outil est commun ; la **vérité** est locale à chaque `registryId`.

---

## 9. Principes non négociables (constitution du projet)

| # | Principe | Implication |
|---|----------|-------------|
| **P1** | Statique d’abord | Pas de dépendance build en lecture |
| **P2** | Vérité machine avant skin | `proc/` / inventaires avant `home/` |
| **P3** | Un noyau, des adaptateurs | Pas de fork `CapsuleWindow` par distro |
| **P4** | Toolkit-first, vendor-sealed | Mutualisation par DE, scellement par distro |
| **P5** | Falsifiabilité | Gate ou ça n’existe pas |
| **P6** | Écarts classés | Dette vers fidélité, pas relâchement |
| **P7** | Ressource sobre | Pas de module sans dette prouvée |
| **P8** | Deux mondes assets | Système (`usr/share`) ≠ utilisateur (`home/public`) |
| **P9** | Fidélité expérientielle | **Vp ∧ VΣ** (apps complètes) pour P0 |
| **P10** | A11y opt-in | Mode accessibilité activable, pas défaut clone |
| **P11** | Vérité locale, pas de fallback cross-vendor | Matrices, manifestes, playbooks, inventaires liés à un `registryId` ; absence = gate rouge explicite — jamais emprunt silencieux à un autre vendor |

---

## 10. Décisions actées (juin 2026)

| Question | Décision |
|----------|----------|
| **Profondeur VΣ** | **Apps complètes** — shell + toutes les apps P0 du registry, pas shell seul |
| **schema.org** | **`/mnt`** (scénarios) **et `/OS`** (entrées catalogue / métadonnées façade) — pas chaque fenêtre interne du bureau |
| **localStorage vs CSS vars** | État visuel dérivé VM → **variables CSS** ; persistance session utilisateur (onglets, préférences) → **localStorage** |
| **Internationalisation** | **FR par défaut** ; **EN** (et QWERTY) en **couche additive** (Lj, Lk) |

---

## 11. Documents du corpus fondateur

| Document | Rôle philosophique |
|----------|-------------------|
| **Ce fichier** | Fondations — pourquoi |
| [manifeste-noyau.md](manifeste-noyau.md) | Vision technique — quoi |
| [manifeste-kernels.md](manifeste-kernels.md) | Taxonomie — qui hérite de qui |
| [logique-formelle.md](logique-formelle.md) | Méthode — comment décider |
| [convention-reproduction-os.md](convention-reproduction-os.md) | Éthique opératoire du clone |
| [plan-maitre-reproduction-os.md](plan-maitre-reproduction-os.md) | Trajectoire — quand / dans quel ordre |

---

## 12. Formule de validation (juin 2026, amendement fondateur)

> Nous construisons une **expérience de pensée matérialisée** : reproduction **maximale** de l’expérience bureau dans l’enveloppe statique navigateur, structurée en couches distinctes, vérifiable par des gates (**Vp**, **VΣ** apps complètes, **Tf**, **H₆**), respectueuse des identités vendor, sobre en modules, avec scénarios **`/mnt`** déployables sur tout OS et amélioration continue mesurée sur le réel.

Cette formule est la base académico-philosophique sur laquelle reposent l’architecture **toolkit-first, vendor-sealed, proc-backed** et le plan maître de reproduction.

---

*Amendement juin 2026 — fidélité maximale, VΣ apps complètes, a11y opt-in, `/mnt` scénarios cross-OS, schema.org `/mnt` + `/OS`.*
