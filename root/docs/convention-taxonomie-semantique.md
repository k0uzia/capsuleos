# Convention — taxonomie et sémantique CapsuleOS

> **Statut** : **pierre angulaire** (juin 2026) — obligatoire pour agents IA et contributeurs humains.  
> **Contrat machine** : [`etc/capsuleos/contracts/taxonomy.json`](../../etc/capsuleos/contracts/taxonomy.json)  
> **Gate** : `node usr/lib/capsuleos/tools/validate-taxonomy.mjs`

Complète : [convention-reproduction-os.md](convention-reproduction-os.md) · [paradigme-toolkit-de.md](paradigme-toolkit-de.md) · [convention-composants-ui.md](convention-composants-ui.md) · [skin-toolkit-recipe](../../etc/capsuleos/contracts/skin-toolkit-recipe.json)

En cas de conflit entre une procédure locale et cette convention sur **l'identité** ou le **cloisonnement** → **cette convention prime**.

---

## 1. Pourquoi une taxonomie

CapsuleOS simule plusieurs distributions qui **partagent des scripts** mais **ne partagent pas** le même environnement graphique. Les collisions naissent quand :

- un **slot logique** (`update_manager`) est confondu avec un **fichier gabarit** (`update_manager.html` = Cinnamon, pas GNOME) ;
- un **skin Rocky** importe du chrome ou des tokens **Mint** ;
- un **embed** injecte le HTML d'un toolkit et le CSS d'un autre.

La taxonomie fixe **qui nomme quoi**, **où ça vit**, et **comment résoudre** sans fallback silencieux (**R-LOC1** / **P11**).

---

## 2. Hiérarchie de résolution (ordre strict)

```text
kernelId   → linux | windows | android | …
  └── branchId   → rhel | debian | ubuntu | mint | fedora | opensuse | arch | …
        └── toolkitId  → gnome | cinnamon | kde | cosmic | …
              └── registryId → linux-rocky | linux-mint | linux-ubuntu | …
                    └── vendor → rocky | mint | ubuntu | …
```

| Dimension | Exemple Rocky | Exemple Mint | Rôle |
|-----------|---------------|--------------|------|
| **kernelId** | `linux` | `linux` | Famille noyau simulée |
| **branchId** | `rhel` | `mint` | Lignée packaging (≠ marque) |
| **toolkitId** | `gnome` | `cinnamon` | Paradigme DE (Adwaita vs Mint-Y) |
| **registryId** | `linux-rocky` | `linux-mint` | Instance feuille (clé `proc/`, lab, profil) |
| **vendor** | `rocky` | `mint` | Pack assets `vendors/{vendor}/` |
| **bodyId** | `rocky` | `mint` | Scope CSS `body#` |
| **embedKey** | `rocky` | `mint` | Clé `CAPSULE_APP_EMBED.skins` |

**Clé `extends`** (profil) — forme normative :

```text
kernel:{kernelId}/branch:{branchId}/toolkit:{toolkitId}
```

Exemple : `kernel:linux/branch:rhel/toolkit:gnome` pour Rocky et Alma.

---

## 3. Cinq zones (où écrire quoi)

| Zone | Chemin | Contient | N'écrit pas |
|------|--------|--------|-------------|
| **Z0** | `etc/`, `proc/` | Contrats, registre, manifestes VM | Tokens visuels vendor |
| **Z1** | `usr/lib/`, `usr/share/` | Scripts partagés, gabarits **multi-variants**, clusters | Couleur dock Rocky |
| **Z2** | `home/<Vendor>/` | Skin : HTML bureau, `style/`, tokens `*.skin.css` | Logique métier dupliquée |
| **Z3** | `OS/.../index.html` | Façades pick-os (générées) | CSS métier |
| **Z4** | `var/.../generated/` | Embeds, profils sérialisés | Source de vérité |

**Règle scripts vs skins** :

| Couche | Partagé entre distros ? | Exemple |
|--------|-------------------------|---------|
| **Scripts** (`usr/lib/capsuleos/`) | Oui (agnostique vendor) | `contentLoader.js`, `update-manager.js` |
| **Variant** (`usr/share/.../apps/`) | Par **toolkit**, pas par vendor | `update_manager_gnome.html` vs `update_manager.html` |
| **Skin** (`home/.../style/`) | Non — un vendor = un skin | `Rocky/.../update_manager.skin.css` (tokens Adwaita) |

---

## 4. Couches sémantiques (ne pas confondre)

### 4.1 Slot logique

- **Définition** : ancre DOM stable `data-link="…"`.
- **Exemples** : `nemo`, `update_manager`, `themes`, `firefox`.
- **Règle** : même nom fonctionnel sur toutes les distros du même rôle (explorateur, logiciels, paramètres).
- **Anti-pattern** : renommer le slot par distro (`logiciels_rocky`).

### 4.2 Variant (gabarit toolkit)

- **Définition** : couple HTML + `*.base.css` pour un slot **dans un toolkit**.
- **Nommage** :
  - `{slot}.html` — variant **canon** du toolkit quand slot = fichier (Cinnamon `update_manager.html`) ;
  - `{slot}_{toolkit}.html` — variant explicite (`update_manager_gnome.html`) ;
  - `{slot}_{flavor}.html` — variante registry (`update_manager_ubuntu.html`).
- **Catalogue** : `apps-catalog.json` → `toolkits.{toolkitId}.slotSpecs`.
- **Runtime** : `CAPSULE_TEMPLATE_OVERRIDES` quand le variant ≠ `{slot}.html`.
- **Explorateurs** : résolus via `CAPSULE_EXPLORER_TEMPLATE` + `cluster-registry.json`, pas via overrides slot classiques.

### 4.3 Cluster

- **Définition** : enregistrement structuré gabarit + CSS (`cluster-registry.json`).
- **ID** : `toolkit.gnome`, `explorer.nautilus.gnome`, `cluster.app.firefox`.
- **Profil** : `clusterIds[]` doit référencer des clusters existants et compatibles `toolkitId`.

### 4.4 Chrome provider

- **Définition** : comportement fenêtre (SSD/CSD, drag, headerbar).
- **Source** : `window-chrome-contexts.json` + `chrome.js`.
- **Exemples** : `libadwaita-gnome`, `nemo-gnome`, `cinnamon`, `update-manager-ubuntu`.

### 4.5 Skin CSS (vendor)

- **Définition** : `home/.../style/apps/{slot}.skin.css` — **tokens** (couleurs, tailles fenêtre, icônes vendor).
- **Règle** : pas de grille/layout structurel copié d'un autre toolkit ; structure dans `*.base.css` du variant.

### 4.6 Composant UI (N1)

- **ID** : `{toolkit}.{nom}` — ex. `gnome.adw-header-bar`, `cinnamon.xapp-window`.
- **Contrat** : `ui-components-{toolkit}.json`.

---

## 5. Collisions interdites

| ID | Interdit | Gate |
|----|----------|------|
| **cross-toolkit-chrome** | `toolkit-gnome/chrome.css` dans un skin Cinnamon | `validate-toolkit-chrome-isolation` |
| **cross-toolkit-variant** | Profil GNOME → `update_manager.html` (Cinnamon) | `validate-slot-variant-wiring` |
| **cross-vendor-assets** | `vendors/mint/` dans `home/RedHat/Rocky/` | `validate-skin-vendor-isolation` |
| **slot-default-assumption** | Charger `{slot}.html` sans résoudre le toolkit | `validate-taxonomy` |
| **embed-css-mismatch** | HTML variant A + cssBase variant B dans l'embed | `validate-taxonomy` |
| **z2-in-kernel** | Layout GNOME Software entier dans `home/` sans base partagée | revue + `validate-ui-components-*` |

---

## 6. Résolution opératoire (agents)

### 6.1 Avant tout patch skin/app

```bash
# 1. Identifier la feuille
registryId=linux-rocky   # proc/, profil, lab

# 2. Lire le profil effectif
# etc/capsuleos/profiles/linux-rocky.json → toolkitId, branchId, extends

# 3. Résoudre le variant d'un slot
# apps-catalog.json → toolkits.gnome.slotSpecs.update_manager

# 4. Gates taxonomie
node usr/lib/capsuleos/tools/validate-taxonomy.mjs
node usr/lib/capsuleos/tools/validate-slot-variant-wiring.mjs
```

### 6.2 Recette complète (rien au hasard)

```bash
node usr/lib/capsuleos/tools/linux/run-toolkit-skin-recipe.mjs
```

### 6.3 Prédicats

| Symbole | Signification |
|---------|---------------|
| **Tax** | Profils, extends, clusterIds, toolkitPack cohérents |
| **TaxV** | Variants sans collision toolkit |
| **TaxΣ** | Tax ∧ TaxV ∧ isolation chrome |

---

## 7. Matrice sémantique — exemple `update_manager`

| Entité | Rocky (GNOME) | Mint (Cinnamon) | Ubuntu (GNOME retail) |
|--------|---------------|-----------------|------------------------|
| Slot | `update_manager` | `update_manager` | `update_manager` |
| Variant | `update_manager_gnome.html` | `update_manager.html` | `update_manager_ubuntu.html` |
| Base CSS | `update_manager_gnome.base.css` | `update_manager.base.css` | `update_manager_ubuntu.base.css` |
| Chrome | `libadwaita-gnome` | `cinnamon` | `update-manager-ubuntu` |
| Skin CSS | `Rocky/.../update_manager.skin.css` | `Mint/.../update_manager.skin.css` | `Ubuntu/.../update_manager.skin.css` |
| Libellé FR | Logiciels | Gestionnaire de mises à jour | Snap Store |

---

## 8. Checklist commit (taxonomie)

- [ ] `extends` aligné sur `kernelId` + `branchId` + `toolkit.id`
- [ ] Slot touché : variant déclaré dans `apps-catalog` pour le bon `toolkitId`
- [ ] Pas de CSS structurel d'un autre toolkit dans le skin
- [ ] `validate-taxonomy.mjs` OK
- [ ] `run-toolkit-skin-recipe.mjs` OK si Z1/Z2/embed touchés
- [ ] `skin.profile.json` miroir synchronisé avec `etc/capsuleos/profiles/`

---

## 9. Références croisées

| Besoin | Document / outil |
|--------|------------------|
| Cloisonnement chrome | [inventaires/toolkit-cloisonnement-audit.md](inventaires/toolkit-cloisonnement-audit.md) |
| Composants N1/N2 | [convention-composants-ui.md](convention-composants-ui.md) |
| Catalogue apps | [procedure-apps-catalog.md](procedure-apps-catalog.md) |
| Zones Z0–Z4 détaillées | [plan-maitre-reproduction-os.md](plan-maitre-reproduction-os.md) §1 bis |
| R-LOC1 | [logique-formelle.md](logique-formelle.md) |
