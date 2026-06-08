# Discipline agent — validation discriminée et clôture push

> **Statut** : référence opérationnelle unique pour choisir **quoi lire**, **quels gates lancer**, et **quoi rectifier** selon le type de changement.  
> Complète sans remplacer : [parcours-agent.md](parcours-agent.md) (H0–H6), [logique-formelle.md](logique-formelle.md) (prédicats), [convention-reproduction-os.md](convention-reproduction-os.md) (clone VM), [convention-rafraichissement-vues.md](convention-rafraichissement-vues.md) (**Rv**).

**Outil** : plan automatique depuis les fichiers modifiés :

```bash
node usr/lib/capsuleos/tools/print-validation-plan.mjs
node usr/lib/capsuleos/tools/print-validation-plan.mjs --staged
node usr/lib/capsuleos/tools/print-validation-plan.mjs home/Debian/Mint/style/apps/nemo.skin.css
```

---

## 1. Principes

| Principe | Règle |
|----------|-------|
| **Discriminer** | Ne pas lancer `validate-all` sur une typo doc seule ; lancer la **gate minimale** du périmètre touché. |
| **Baseline session** | Première intervention ou gros patch : **H₂** = `validate-all.mjs` (noter les échecs hors zone). |
| **Rectifier au fil de l'eau** | En touchant une zone, corriger les **rouges de cette zone** — pas toute la dette du dépôt (sauf tâche « fix CI »). |
| **Clôture merge / push** | Avant merge significatif ou push demandé : **H₆** = `validate-all.mjs` exit 0 sur le périmètre livré. |
| **Vues avant push** | Tout changement skin / slot interactif : **Rv** + `sync-linux-skin-closure` si Linux — voir §4. |

---

## 2. Matrice type de changement → lecture → gates

| Type | Indices (chemins) | Lire d'abord | Gates obligatoires (après patch) | Gates optionnelles / smokes |
|------|-------------------|--------------|----------------------------------|-----------------------------|
| **Doc / skills / règles** | `root/docs/`, `root/skills/`, `.cursor/rules/`, `contrib.md` | [parcours-agent.md](parcours-agent.md) | Aucune si pas de code ; `validate-agent-skills.mjs` si skills catalogue | — |
| **Assets seuls** | `usr/share/capsuleos/assets/`, `home/public/Images/` | [politique-assets.md](politique-assets.md) | `validate-asset-zones.mjs` ou `validate-assets-all.mjs` | `audit-asset-paths.mjs` |
| **Vendor pack** | `assets/images/vendors/` | [convention-assets-depuis-vm.md](convention-assets-depuis-vm.md) | `validate-assets-all.mjs` | `pull-vm-assets.sh` si VM |
| **Skin Linux** | `home/<Vendor>/` | [convention-reproduction-os.md](convention-reproduction-os.md), [convention-rafraichissement-vues.md](convention-rafraichissement-vues.md) | `sync-linux-skin-closure.mjs` puis `validate-capsule.mjs` | Smokes slot : `usr/lib/capsuleos/tools/lab/smoke-mint-*.mjs` |
| **Gabarits apps Linux** | `usr/share/capsuleos/linux/apps/`, `explorers/` | [apps-linux-par-distro.md](apps-linux-par-distro.md) | `build-linux-embed.mjs` (+ `sync-linux-skin-closure.mjs` si skin lié) | `file://` smoke 1 app |
| **JS noyau** | `usr/lib/capsuleos/` | [passe-vanilla-json.md](passe-vanilla-json.md), [convention-contexte-fenetres.md](convention-contexte-fenetres.md) | `validate-quality-all.mjs` ; `build-capsule-window.mjs` si `window/` | `validate-desktop-window-boot.mjs` |
| **Registre / profils** | `etc/capsuleos/`, `os-registry-entries.mjs` | [ajouter-os-scalable.md](ajouter-os-scalable.md) | `build-os-registry.mjs` chaîne + `validate-capsule.mjs` | `print-agent-brief.mjs <id>` |
| **Liens HTML statiques** | `*.html` hors skin, hubs `OS/` | [link-routing](../skills/link-routing/SKILL.md) | `validate-links-all.mjs` | `fix-static-html-asset-urls.mjs` |
| **Lab / smokes** | `usr/lib/capsuleos/tools/lab/` | [convention-rafraichissement-vues.md](convention-rafraichissement-vues.md) | Smokes touchés (Playwright) | Pas de `validate-all` si lab seul |
| **Clone VM / parité** | inventaires, playbooks lab | [procedure-clonage-os-depuis-vm.md](procedure-clonage-os-depuis-vm.md) | `validate-clone-assets.mjs --id <registryId>` puis `capture-clone-surfaces.mjs --id <registryId>` ; chaîne domaine (`compare-os-parity`) | `resolve-agent-action.mjs --auto` |

**Release (merge / PR significative)** : toujours terminer par :

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

---

## 3. Que fait `validate-all` (ne pas tout relancer à chaque fois)

| Étape | Script | Quand isoler |
|-------|--------|--------------|
| assets | `validate-assets-all.mjs` | Images, profils, CSS `url()` assets |
| links | `validate-links-all.mjs` | HTML, hubs, médias |
| capsule | `validate-capsule.mjs` | Registre, façades, boot fenêtres |
| quality | `validate-quality-all.mjs` | JSON, ES6 strict, contrats UI |

Échecs **souvent ignorés à tort** : façades Linux désync (`validate-capsule` → lancer `sync-linux-skin-closure.mjs`) ; assets hors zones ; `?.` / `??` en JS runtime.

---

## 4. Checklist push — campagne Mint (et skins Linux P0)

Ordre **obligatoire** avant push / merge d’un lot skin ou noyau interactif :

1. **Vues (Rv)** — pour chaque slot `data-link` touché : la surface **V** reflète **M** après action (pas de refresh parasite). Doc : [convention-rafraichissement-vues.md](convention-rafraichissement-vues.md).
2. **Façades pick-os** — si `home/` ou gabarits partagés modifiés :

   ```bash
   node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
   ```

   Sans cela, pick-os sert une copie HTML obsolète (`OS/linux/families/...` ≠ `home/...`).

3. **Smokes lab** (optionnel mais recommandé P0) — attentes **conditionnelles**, sleeps courts via `mint-smoke-open.mjs` :

   ```bash
   node usr/lib/capsuleos/tools/lab/smoke-mint-nemo.mjs
   node usr/lib/capsuleos/tools/lab/run-capsule-panel-browser.mjs
   ```

   Préférer `waitForSelector` / `waitForFunction` aux pauses fixes longues (>200 ms).

4. **Checkpoints post-clonage** (P0 skin VM) :

   ```bash
   node usr/lib/capsuleos/tools/validate-clone-checkpoints.mjs --tier P0
   # ou : validate-clone-assets.mjs --all --tier P0
   python3 -m http.server 5500 --bind 127.0.0.1   # autre terminal
   node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --id linux-mint --write-baseline
   node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --id linux-mint --compare
   ```

   Matrice : **assets checkpoint** (existence + hash optionnel `--hash`) → **capture checkpoint** (panel, menu, bureau, 3 apps) → parité lab si VM disponible.

   **CI** : `.github/workflows/validate-capsuleos.yml` — `validate-all` + `validate-clone-checkpoints --tier P0`. Option locale : `CAPSULE_VALIDATE_CLONE=1 node usr/lib/capsuleos/tools/validate-all.mjs`.

5. **Gate release** :

   ```bash
   node usr/lib/capsuleos/tools/validate-all.mjs
   ```

6. **Rectification incrémentale** — si `validate-all` échoue : corriger uniquement les violations **dans les chemins du lot** ; noter le reste en dette (issue / inventaire P1).

---

## 5. Rectifier au fur et à mesure

| Situation | Action agent |
|-----------|--------------|
| Rouge `validate-all` **dans** la zone du patch | Corriger dans le même lot (obligation culturelle). |
| Rouge **hors** zone, préexistant | Documenter ; ne pas élargir le scope sauf tâche CI dédiée. |
| Skill / règle contredit la doc canonique | Mettre à jour la **projection** (skill, `.mdc`) vers `logique-formelle.md` ou ce document. |
| Toucher `home/Debian/Mint/` | Vérifier parité inventaire [linux-mint-clone-status.md](inventaires/linux-mint-clone-status.md) ; ne pas régresser P0 documentés. |

---

## 6. Anti-patterns

1. `validate-all` sur chaque commit doc.
2. Modifier `home/` sans `sync-linux-skin-closure` avant fin de tâche.
3. **Mint panel/menu** : double CSS (`imports.css` + inject `contentLoader`), `footer.css`/`panel-windows.css` parallèles, layout menu dans `mint-menu-parity.js`, `--taskbar-height` portal — voir skill `os-linux` § Panel/menu Mint v3.
4. Ignorer un échec `validate-capsule` « parce que c'était déjà rouge » **dans la zone touchée**.
5. Smokes lab avec sleeps >1 s sans attente conditionnelle (régression perf CI).
6. Push sans **Rv** sur un slot interactif modifié.

---

## 7. Liens

- [parcours-agent.md](parcours-agent.md) — hydratation H0–H6
- [convention-reproduction-os.md](convention-reproduction-os.md) — workflow clone VM §4
- [convention-rafraichissement-vues.md](convention-rafraichissement-vues.md) — **Rv₁**, **Rv₂**
- [contrib.md](../../contrib.md) — checklist contrat merge
- Skill [`onboarding`](../skills/onboarding/SKILL.md)
