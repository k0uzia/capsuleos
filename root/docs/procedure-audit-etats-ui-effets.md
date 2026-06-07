# Procédure — audit états UI & effets visuels (logique propositionnelle)

> **Objectif** : répertorier **100 %** des états système durant les actions utilisateur — transitions, contrastes, ombres, dégradés, apparition/disparition fenêtres, menus, sous-menus et popovers — et reproduire chaque effet dans Capsule avec preuve machine.

**Contrat** : [`etc/capsuleos/contracts/ui-state-effects.json`](../../etc/capsuleos/contracts/ui-state-effects.json)  
**Matrice** : [`root/tools/lab/ui-state-effects-matrix-gnome.json`](../tools/lab/ui-state-effects-matrix-gnome.json)  
**Skill agent** : [`root/skills/ui-state-effects-replication/SKILL.md`](../skills/ui-state-effects-replication/SKILL.md)

---

## 1. Prédicats (extension de la logique formelle)

| Symbole | Signification | Gate |
|---------|---------------|------|
| **Ve** | Matrice états/transitions P0 **complète** | `smoke-ui-state-effects.mjs` — `summary.predicates.Ve` |
| **Vx** | Transitions **mesurées** (durée, easing, propriétés) | `effectsMeasured === transitionsP0` |
| **Vm** | Menus/popovers **énumérés** (items + hiérarchie) | `menusEnumerated` ≥ somme items P0 |
| **Vμ** | Capsule **reproduit** (computed + capture) | `capsuleMatched` + `visualMatch !== unknown` pour P0 |
| **VΣ** | Clôture effets UI | **Ve ∧ Vx ∧ Vm ∧ Vμ** |

### Règles agent

```
R-VΣ1   Vp ∧ ¬Ve     →  collect-ui-state-effects.mjs --write (étendre matrice P0)
R-VΣ2   Ve ∧ ¬Vx     →  rejouer burst captures VM (durées / easing)
R-VΣ3   Vx ∧ ¬Vm     →  énumérer items menu depuis playbook VM + capture OCR/sonde
R-VΣ4   Vm ∧ ¬Vμ     →  patch CSS/JS Capsule + capture miroir Playwright
R-VΣ5   VΣ           →  smoke-ui-state-effects vert + validate-all
```

**Principe** : une transition = un graphe **(état₀, action, état₁)** + preuves **before/during/after** + catalogue menu si applicable.

---

## 2. Modèle propositionnel des états

Chaque surface `S` possède un ensemble d'états `Σ(S)` et des transitions `δ ⊆ Σ(S) × Action × Σ(S)`.

Exemples :

| Surface | États | Transition typique |
|---------|-------|-------------------|
| `shell.overview` | `{hidden, workspace, apps}` | `Super` : hidden → workspace |
| `shell.quickSettings` | `{closed, open}` | clic tray : closed → open |
| `app.nautilus` | `{closed, open, item-selected, context-menu-open, rename-inline}` | clic droit : open → context-menu-open |

**Effet visuel** `E(δ)` : tuple `(propriétés CSS, durée, easing, ombre, contraste, gradient)`.

**Menu** `M(δ)` : liste ordonnée `(role, items[], submenus[])`.

---

## 3. Workflow autonome

```bash
# 1. Passe visuelle shell (prérequis Vp)
node usr/lib/capsuleos/tools/lab/run-visual-parity-pass.mjs --id linux-ubuntu

# 2. Collecte états/effets VM + burst transitions
node usr/lib/capsuleos/tools/lab/collect-ui-state-effects.mjs --id linux-ubuntu --write

# 3. Captures + styles Capsule miroir
node usr/lib/capsuleos/tools/lab/collect-ui-state-effects.mjs --id linux-ubuntu --capsule

# 4. Gate propositionnel
node usr/lib/capsuleos/tools/lab/smoke-ui-state-effects.mjs --id linux-ubuntu

# Orchestrateur tout-en-un :
node usr/lib/capsuleos/tools/lab/run-ui-state-effects-pass.mjs --id linux-ubuntu
```

---

## 4. Preuves par transition

Pour chaque entrée P0 de la matrice :

1. **Playbook VM** (`vm-gnome-deep-playbooks.sh`) → JSON `playbookResult`
2. **Burst PNG** aux `burstMs[]` (virsh hôte ou SSH screenshot)
3. **Menus** : items depuis `expectedMenu` playbook ou énumération manuelle documentée
4. **Effets** : propriétés listées dans `effects.properties` + mesure `durationMs`
5. **Capsule** : sélecteur `capsuleParity.selector` + `getComputedStyle` Playwright + PNG miroir

---

## 5. Fidélité 100 % — critères P0

| Zone | Critère |
|------|---------|
| Ombre | `box-shadow` couches identiques (offset, blur, spread, couleur) |
| Gradient | `background-image` / stops alignés |
| Contraste | ratio WCAG documenté si texte sur fond animé |
| Transition | `transition-duration` ± 20 ms · `timing-function` identique |
| Menu | chaque item VM présent dans Capsule (libellé FR + ordre + séparateurs) |
| Sous-menu | chevron + délai hover + position (flip) documentés |
| Popover | `backdrop-filter`, `border-radius`, ancrage tray |

Écart → `parityPriority: P0` + `gapNotes` dans l'inventaire.

---

## 6. Livrables

| Fichier | Rôle |
|---------|------|
| `inventaires/<id>-ui-state-effects.json` | Inventaire propositionnel |
| `inventory/<vendor>-ui-effects-vm/` | Burst VM |
| `inventory/<vendor>-ui-effects-capsule/` | Miroir Capsule |
| `inventaires/<id>-ui-state-effects.md` | Résumé humain (optionnel `--write-doc`) |

---

## 7. Pairing

- [procedure-audit-vm-profonde.md](procedure-audit-vm-profonde.md) — phases interaction-matrix, context-menus, animations
- [visual-parity-lab](../skills/visual-parity-lab/SKILL.md) — captures shell P0
- [nautilus-interactions-playbook.json](inventaires/nautilus-interactions-playbook.json) — slot nemo
