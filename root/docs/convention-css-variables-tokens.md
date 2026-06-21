# Convention — variables CSS et tokens (API visuelle)

> **Statut** : norme interne actée (juin 2026) · complète [manifeste-noyau.md](manifeste-noyau.md) §3 et [fondements-philosophiques.md](fondements-philosophiques.md) §6.1.  
> **Gate** : `validate-css-variables-contract.mjs` · contrat `etc/capsuleos/contracts/css-variable-sources.json`

---

## 1. Ce que la norme impose (et n’impose pas)

| Affirmation courante | Réalité CapsuleOS |
|--------------------|-------------------|
| « Variables CSS **partout** » | **Tokens = API publique** du noyau ; le skin **configure** des variables, il ne refork pas les composants |
| « Interdiction des `#hex` » | **Non** — les littéraux couleur sont autorisés **dans les fichiers tokens (N0)** ; les consommateurs (N1+) **préfèrent** `var(--*)` |
| « Tout CSS du dépôt est gate-ifié » | **Non** — la gate couvre un **périmètre contractuel** (chrome, shell, apps clés) ; voir §4 |

**Thèse** : l’interface publique du noyau, ce sont les **variables CSS anticipées** — pas les classes privées du skin.

---

## 2. Trois niveaux (aligné convention-composants-ui)

| Niveau | Rôle | Où | Littéraux `#hex` / `px` |
|--------|------|-----|-------------------------|
| **N0 — Primitives** | Palette, typo, échelle | `themes/**/variables*.css`, `*-tokens.css` | **Autorisés** (source de vérité visuelle) |
| **N1 — Composants** | Chrome, layouts partagés | `*.base.css`, `window-chrome*.css`, clusters toolkit | **Via `var(--*)`** sauf exception documentée |
| **N2 — Skin / app** | Overrides vendor | `home/**/style/**/*.skin.css`, shell vendor | **`var(--*)` d’abord** ; hex résiduel toléré pour parité VM ponctuelle |

**Règle d’ajout** : réutiliser un token existant avant d’en créer un ; nouvelle variable globale → `variables-linux.css` ou `variables-linux-computed.css`.

---

## 3. Chaîne d’import obligatoire (skins Linux)

```text
reset.css → variables.css → variables-linux.css → variables-linux-computed.css
  → window-chrome.base.css → tokens shell → *.skin.css
```

Alias sémantiques (`--f`, `--n`, `--fix`) : définis dans `themes/global/variables.css` — ne pas redéfinir.

---

## 4. Périmètre de la gate `validate-css-variables-contract`

La gate vérifie une propriété **nécessaire et suffisante pour le CI** :

> **Toute `var(--nom)` utilisée dans le périmètre scan est définie** dans la chaîne de définition (`css-variable-sources.json`).

Elle **ne vérifie pas** :

- l’absence de couleurs littérales dans les skins ;
- la couverture de 100 % du CSS du dépôt ;
- le respect de N0/N1/N2 (discipline humaine + revue).

Périmètre scan (juin 2026) : chrome noyau, clusters toolkit, apps explorateur/fichiers, tokens shell, portail et a11y global — voir `scanGlobs` du contrat.

**Hors scan actuel** : `*.skin.css` apps (tokens dans fichiers compagnons `*-tokens.css`, `debian-breeze.css`, etc.) — extension prévue via `definitionGlobs` dédiés avant d’élargir le scan.

---

## 5. État visuel vs session (plan maître §10)

| Donnée | Stockage |
|--------|----------|
| Accent, thème, échelle UI (gsettings-like) | Variables CSS `--capsule-*` + bus `capsule:*` |
| Fond d’écran (id) | `localStorage` léger + `background-image` CSS |
| Onglets explorateur / terminal | `localStorage` session |
| Parité VM mesurée | JSON inventaire (`proc/`, `root/docs/inventaires/`) |

Ne pas persister en `localStorage` ce qui doit être dérivé en CSS.

---

## 6. Validation

```bash
node usr/lib/capsuleos/tools/validate-css-variables-contract.mjs
node usr/lib/capsuleos/tools/validate-ui-contracts-all.mjs   # orchestrateur
node usr/lib/capsuleos/tools/validate-all.mjs              # H₂ / H₆
```

Skill : [`css-variables-contract`](../skills/css-variables-contract/SKILL.md).

---

## 7. Références

- [contrats-ui-bureau.md](contrats-ui-bureau.md)
- [convention-reproduction-os.md](convention-reproduction-os.md) § chaîne CSS
- [convention-composants-ui.md](convention-composants-ui.md) § N0–N2
- [plan-maitre-reproduction-os.md](plan-maitre-reproduction-os.md) §10
