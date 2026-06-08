# Convention — rafraîchissement des vues (réel vs irréel)

> **Statut** : contrat validé (`etc/capsuleos/contracts/view-refresh-vigilance.json`).  
> **Condition sine qua non** de la reproduction OS au plus près du réel : toute action utilisateur doit laisser la **vue** alignée sur l’**état modèle** attendu, sans refresh parasite.

**Références** : [logique-formelle.md](logique-formelle.md) (prédicats **Rv₁**, **Rv₂**, **Rv**) · [convention-reproduction-os.md](convention-reproduction-os.md) · Playbook : [view-refresh-vigilance-playbook.json](inventaires/view-refresh-vigilance-playbook.json)

---

## 1. Problème

En CapsuleOS, l’**irréel** n’est pas l’absence de VM : c’est tout état où la surface visible (**V**) diverge du modèle (**M**) après une action admissible, ou se met à jour sans que **M** ait changé.

| Symbole | Définition |
|---------|------------|
| **M** | Session, manifest VFS, chemins, onglets, cwd terminal, sélection, historique **runtime** |
| **V** | DOM rendu (grille, libellés onglets, bandeau, sortie terminal, chrome) |
| **Réel** | `V = projection(M)` une fois `completion(A_user)` stabilisée |
| **Irréel** | `V ≠ projection(M)` ou `refresh(V)` sans `ΔM` |

La **logique formelle** sert à trancher réel / irréel pendant les phases de reproduction : on ne corrige pas « au feeling » — on vérifie **Rv₁** (post-action) et **Rv₂** (pas de parasite).

---

## 2. Prédicats

| Symbole | Signification | Vérification |
|---------|---------------|--------------|
| **Rv₁** | Vue cohérente **après** action | Checklist playbook + smokes ciblés |
| **Rv₂** | Pas de refresh **parasite** pendant / hors action | Revue des listeners focus, timers, races |
| **Rv** | **Rv₁ ∧ Rv₂** | Admissible pour clôture slot interactif P0 |

Contrat machine : `etc/capsuleos/contracts/view-refresh-vigilance.json`.

---

## 3. Déclencheurs légitimes

Un refresh est **admis** seulement si l’un des cas suivants s’applique :

1. **Post-action** — navigation, mutation FS, renommage, changement d’onglet initié par l’utilisateur.
2. **Événement inter-surfaces** — le modèle a changé sur une autre surface (`capsule:fs-changed`, fermeture fenêtre).
3. **Activation fenêtre avec Δ état** — autre instance Nautilus active (snapshot différent), pas un simple refocus.
4. **Changement d’onglet** — restauration path / label / surface de l’onglet cible.

Tout autre re-render est un candidat **P0** (irréel) jusqu’à preuve du contraire dans l’inventaire VM.

---

## 4. Patterns noyau (référence)

### 4.1 Nautilus

| Besoin | Mécanisme |
|--------|-----------|
| Grille à jour après commande terminal | `capsule:fs-changed` → `renderDirectory` si path courant affecté |
| Titre bandeau onglets après navigation | `syncNautilusTabs()` en fin de `navigateToFileExplorerDirectory` |
| Pas de race focus / navigation | `fileExplorerWindowState.js` — `activateExplorerWindow` ne refresh que si `activeNemoRoot` change |
| Fermeture fenêtre | Purge SESSION onglets + `resetTabRuntimeState` |

Vigilance liée : `focus-refresh-race` dans [nautilus-interactions-playbook.json](inventaires/nautilus-interactions-playbook.json).

### 4.2 Terminal

| Besoin | Mécanisme |
|--------|-----------|
| Onglets / cwd cohérents après commande | `syncTerminalTabs()` |
| Sortie éphémère (comme Ptyxis session) | Pas de `outputHtml` / `history` en localStorage ; `resetTerminalVisualSurface` à fermeture |
| Réouverture | Vue vide, historique flèche ↑ limité à la session fenêtre ouverte |

### 4.3 FS terminal ↔ explorateur

Playbook dédié : [fs-sync-playbook.json](inventaires/fs-sync-playbook.json) · smoke `smoke-fs-terminal-explorer-sync.mjs` (assertions **Rv₁** sur la grille).

---

## 5. Workflow agent (reproduction)

À intégrer dans toute implémentation **H5** touchant un slot interactif :

| # | Action | Gate |
|---|--------|------|
| 1 | Identifier `A_user` et la surface **V** impactée | Inventaire / playbook slot |
| 2 | Définir `projection(M)` attendu (VM ou spec playbook) | **I** ou phase VM |
| 3 | Implémenter sync **post-action** (pas seulement à l’ouverture) | Code noyau |
| 4 | Auditer listeners focus / async pour **Rv₂** | Checklist playbook |
| 5 | Smoke ou test manuel documenté | **Rv₁** sur le scénario |

**Interdit** : considérer la reproduction terminée si un scénario P0 du playbook laisse **V** stale.

---

## 6. Classification écarts

| Tag | Exemple |
|-----|---------|
| **P0** | Grille non rafraîchie après `rm` ; titre onglet faux ; terminal réaffiche l’ancienne sortie à réouverture |
| **P1** | Délai visible avant refresh sans incohérence finale documentée |
| **P2** | Animation de transition absente sur VM |

---

## 7. Anti-patterns (¬ admissible)

1. Refresh au `focus` / `visibilitychange` sans `ΔM`.
2. État onglets persisté en SESSION qui contredit le modèle à la réouverture.
3. Une seule surface mise à jour (terminal OK, Nautilus stale) après mutation FS partagée.
4. `window.prompt` ou modal bloquant qui empêche la mise à jour inline de **V**.
5. Oublier `sync*Tabs` après mutation de path ou label.

---

## 8. Références croisées

- [procedure-playbook-general.md](procedure-playbook-general.md) — couche τ : chaque playbook slot référence **Rv**
- [convention-fidelite-visuelle.md](convention-fidelite-visuelle.md) — **Tv** (contextes de vue) complète mais ne remplace pas **Rv**
- [fs-sync-playbook.json](inventaires/fs-sync-playbook.json) — cas d’école **Rv₁** multi-surfaces
