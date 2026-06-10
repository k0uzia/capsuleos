# Introspection ontologique — CapsuleOS (juin 2026)

> **Statut** : note de synthèse — complète [fondements-philosophiques.md](fondements-philosophiques.md) §2 et [logique-formelle.md](logique-formelle.md) §2  
> **Contexte** : clôture vague store GNOME GS50, Logithèque Mint, alignement KDE deferred, branchement Pop!_Shop  
> **Public** : agents, intégrateurs, relecteurs architecture

---

## 1. Objet de cette introspection

CapsuleOS avance vite sur la **structure** (contrats, générateurs, smokes). L’erreur récurrente n’est pas technique au sens « bug CSS » : c’est une **confusion de strate** — traiter une projection **E** comme une vérité **M**, ou un prédicat **StoreΣ** comme une parité **StoreVp**.

Cette note fixe, après la campagne magasin juin 2026, **ce qui existe réellement** dans le dépôt, **à quelle strate**, et **quels couples de notions ne doivent jamais être identifiés**.

---

## 2. Carte ontologique — strates et zones

### 2.1 Deux vocabulaires, une même réalité

| Strate (fondements) | Zone (taxonomie) | Mode d’être | Exemple store juin 2026 |
|---------------------|------------------|-------------|---------------------------|
| **R** Référent réel | (hors dépôt) | VM, `.desktop`, captures | Pop Shop sur VM Pop!_OS |
| **M** Modèle machine | **Z0** `etc/`, `proc/` | JSON versionné, gates | `store-installable-apps.json`, `gnome-software-store-content.json` |
| **N** Noyau simulé | **Z1** `usr/lib/`, `usr/share/` | JS/CSS partagés | `gnome-software-ground.js`, `mintinstall.js`, `update-manager.js` |
| **S** Skin vendor | **Z2** `home/` | HTML/CSS/JS scellé | Scripts `capsule-store-catalog.js` chargés dans `home/Debian/Mint/` |
| **F** Façade URL | **Z3** `OS/.../index.html` | Miroir `<base href>` | `OS/linux/families/debian/mint/` |
| **E** Expérience | Navigateur | DOM hydraté | Grille « À découvrir », Logithèque, Pop Shop ouvert |

**Règle** : la connaissance descend **R → M → N → S → F → E**. Remonter **E → M** (déduire le contrat depuis ce qu’on voit à l’écran) est une **induction non falsifiée** — interdite sans gate.

### 2.2 Flux épistémique du magasin (juin 2026)

```text
Z0  store-installable-apps.json + presentation-bindings + slots-manifest
      ↓ generate-store-catalog.mjs
Z4  capsule-store-catalog.js (+ capsule-gnome-software-content.js)
      ↓ <script> dans Z2
N   gnome-store-catalog.js | mint-store-catalog.js | gnome-software-ground.js
      ↓ init runtime
E   Cartes installables, hero explore, fiche détail
```

**Ce qui n’est pas dans ce flux** : `roadmap.md`, matrices JSON ad hoc, catalogue hardcodé de secours dans le runtime (fallback pédagogique = **dette**, pas source de vérité).

---

## 3. Prédicats homonymes — ne pas fusionner

### 3.1 Structure ≠ parité

| Prédicat | Question ontologique | Ce qu’il **est** | Ce qu’il **n’est pas** |
|----------|----------------------|------------------|-------------------------|
| **StoreG** | Le ground store est-il **branché** ? | Kernel + contrat contenu + référence Fedora | « Le store ressemble à la VM » |
| **StoreΣ** | Le catalogue est-il **cohérent** ? | N apps, slots, générateur, smokes S5–S12 | Parité pixel Pop Shop |
| **StoreVc** | Avons-nous des **captures** Capsule ? | PNG multi-vues documentées | Preuve que l’UI est correcte |
| **StoreVp** | La parité est-elle **classée** ? | `visualMatch` vs VM | « Le smoke passe » |

**Leçon juin 2026** : atteindre **StoreΣ** sur 5 registres GNOME + catalogue Pop!_OS **sans** **StoreVp** est **normal** — ce sont deux modes d’être de la connaissance (structure vs evidence visuelle).

### 3.2 `active` ≠ « expérience complète »

| Signal contrat | Signification ontologique | Piège observé |
|----------------|---------------------------|---------------|
| `storeCatalogStatus: active` | Le **générateur** produit un catalogue pour ce `registryId` | Confondre avec « UI Discover aboutie » |
| `storeCatalogStatus: deferred` | Catalogue **vide volontairement** — UI ou toolkit non prêts | Laisser `active` dans un binding alors que l’UI ne consomme pas le catalogue (KDE) |
| `storeInstallable: true` | Extension **pédagogique** — install simulée post-slot | Confondre avec apps VM `defaultInstalled: true` |
| `defaultInstalled: true` | Ground truth **pré-installé** — présent dans le shell par défaut | Afficher dans « À découvrir » (Mint) |

**Correction Mint** : 21 entrées catalogue = mostly VM ; **une seule** extension discover (`Snapshot`) alimente « À découvrir » via `getDiscoverApps()`. Le reste est **navigation**, pas extension magasin.

### 3.3 Toolkit store ≠ toolkit shell

| registryId | `toolkit` (shell) | `storeToolkit` / front | Conséquence |
|------------|-------------------|------------------------|---------------|
| linux-popos | `cosmic` | `gnome` (Pop Shop = GS50) | Shell COSMIC + **contenu** GNOME Software — pas de confusion de couche |
| linux-mint | `cinnamon` | slot `mintinstall` | Registre global **N**, UI Logithèque **E** propre — pas le gabarit `update_manager_gnome` |
| linux-kde-neon | `kde` | Discover (deferred) | Prédicats GNOME (**G**, **Vc** settings) **inapplicables** tels quels |

Pop!_OS a montré l’erreur ontologique typique : **StoreG** supposé vrai parce que `capsule-store-catalog.js` était présent, alors que **`gnome-software-ground.js`** et **`capsule-gnome-software-content.js`** manquaient — **E** sans **M→N** complet.

---

## 4. Erreurs ontologiques observées (et remèdes)

| Erreur | Symptôme | Strate confondue | Remède |
|--------|----------|------------------|--------|
| **M ≠ E** | Grille overview avant import assets | Skin référence absent du dépôt | **A** / `pull-vm-assets.sh` avant patch (**R-A1**) |
| **Catalogue sans runtime** | `validate-store-catalog-generated` vert, UI vide | Z4 sans N branché | Checklist scripts Z2 = triplet Alma |
| **Doc ≠ contrat** | « 0 apps Mint » alors que générateur en produit 19 | Doc **E** stale vs **M** actuel | Gates + doc canonique `analyse-magasins-apps-cross-os.md` |
| **Façade ≠ skin** | `OS/linux/.../js/` orphelins | Z3 copié comme Z2 | Façades = `<base href>` seulement ; `sync-linux-skin-closure` |
| **Fallback = vérité** | Smoke VLC sur catalogue contrat | Fallback **N** traité comme **M** | Smokes alignés sur contrat ; fallback = dernier recours explicite |
| **Cross-vendor asset** | Icône Rocky sur skin GNOME Mint | **S** vendor A sur **S** vendor B | **P11** / **R-LOC1** |
| **Structure = parité** | « Store terminé » sans VM | **StoreΣ** ≡ **StoreVp** | Chaîne **StoreG → StoreΣ → StoreVc → StoreVp** respectée |

---

## 5. Registre global vs identité locale

Le registre **`store-installable-apps.json`** est **universel en forme**, **local en interprétation** :

- **Une entrée** `slot` + `sources.<registryId>` = assertion **M** locale (« Firefox sur Mint est apt + defaultInstalled »).
- **`includeInStoreCatalog`** (Mint actif) inclut le ground truth VM — Logithèque liste **tout le catalogue contrat**, pas seulement les extensions.
- **LibreOffice** : une suite, `relatedSlots` — une carte magasin, plusieurs slots **E** déverrouillés ; confondre Writer seul et suite = erreur de **granularité ontologique**.

**Fedora** reste `groundReferenceRegistryId` pour le **chrome** GS50 — héritage de contenu, pas copie d’identité vendor (**P11**).

---

## 6. Ordre d’être (conséquences pour l’action)

Ordre **non négociable** dérivé de la ontologie + plan maître :

1. **H₂** — le dépôt est **un seul individu** cohérent avant toute projection locale.
2. **StoreG → StoreΣ** (GNOME + Pop Shop) — branchement **N** + catalogue **M** avant smokes structurels.
3. **ManΣ / AppΣ** par toolkit — Mint cinnamon, GNOME étendu (Alma, AnduinOS) — **vérité manifeste** avant polish **Vp**.
4. **StoreVc → StoreVp** — evidence **R** requise ; sans VM, le prédicat reste **non instancié**, pas « false par paresse ».
5. **KDE Discover** — Phase 4 : `toolkitVariants.kde` + UI **E** avant `storeCatalogStatus: active`.

Sauter une strate (ex. catalogue KDE actif sans UI) crée un **être incomplet** — artefact Z4 sans vécu **E** correspondant.

---

## 7. Questions-guides (checklist agent)

Avant d’écrire ou de déclarer « fait » :

1. **Quelle strate** touche-t-on (Z0–Z4, R–E) ?
2. **Quel prédicat** débloque-t-on — et lequel **ne** débloque-t-on **pas** ?
3. La modification est-elle **falsifiable** par un gate nommé ?
4. Confondons-nous **structure** (JSON compile, smoke DOM) et **parité** (capture VM) ?
5. Un asset ou un slot est-il **référencé** sans exister (**M→E** sans **A**) ?
6. Le vendor est-il **respecté** (**P11**) ou empruntons-nous un gabarit d’un autre toolkit ?

---

## 8. Synthèse en une phrase

> CapsuleOS ne reproduit pas des fichiers : il maintient une **chaîne de projections** du réel mesurable (**R**) jusqu’à l’expérience vécue (**E**), où chaque strate a son propre mode d’être — et où **confondre deux strates**, même avec de bonnes intentions, produit un simulacre **crédible en gate** mais **fausse en ontologie**.

---

## Références

| Document | Lien |
|----------|------|
| Constitution | [fondements-philosophiques.md](fondements-philosophiques.md) |
| Prédicats | [logique-formelle.md](logique-formelle.md) |
| Magasins (état juin 2026) | [analyse-magasins-apps-cross-os.md](analyse-magasins-apps-cross-os.md) |
| Architecture catalogue | [architecture-catalogue-apps.md](architecture-catalogue-apps.md) |
| Chaîne store | [procedure-store-replication-formelle.md](procedure-store-replication-formelle.md) |
| Plan d’exécution | [plan-maitre-reproduction-os.md](plan-maitre-reproduction-os.md) |
