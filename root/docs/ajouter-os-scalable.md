# Ajouter un OS de façon scalable

Procédure **distro · version · environnement de bureau · vendor** sans explosion du noyau JS.

**Prérequis agent** : [parcours-agent.md](parcours-agent.md) phases H0–H3 · gate `validate-all.mjs` vert en baseline.

> **Parité VM requise** : en parallèle du catalogue, suivre [procedure-clonage-os-depuis-vm.md](procedure-clonage-os-depuis-vm.md) (inventaire SSH → assets → comportements → apps → FS). Référence modèle : **linux-mint** (annexe A). Mesure automatisée : [procedure-controle-distributions-reelles.md](procedure-controle-distributions-reelles.md).

---

Générer un brief agent depuis le registre :

```bash
node usr/lib/capsuleos/tools/print-agent-brief.mjs <id> --write
```

---

## 1. Décision produit (5 questions)

| # | Question | Réponse typique |
|---|----------|-----------------|
| 1 | Famille ? | `linux` \| `windows` \| `macos` \| … → skill `os-<famille>` |
| 2 | Toolkit / shell déjà couvert ? | Voir [repertoire-os.md § Toolkits](repertoire-os.md) — **réutiliser** avant d’en créer un |
| 3 | Tier ? | P0 figé · P1 production · P2–P4 planifié / stub |
| 4 | Explorateur Linux ? | `explorerTemplate` : `nemo`, `dolphin`, `nemo-gnome`, … |
| 5 | Vendor visuel ? | Pack `assets/images/vendors/<nom>` + éventuellement `icons/*` |

| 6 | Locale / clavier ? | **Défaut `fr-FR`** · noter locale VM dans l'inventaire · `en-US`/QWERTY = variante future ([scalabilite-noyau.md §7](scalabilite-noyau.md)) |

**Règle d’or** : 1 entrée registre = 1 identité utilisateur (distro **ou** version majeure), pas un clone complet du noyau.

---

## 2. Enregistrement catalogue

1. Ajouter l’entrée dans la source de `etc/capsuleos/os-registry.json` (souvent via `build-os-registry.mjs` si générateur utilisé).
2. Champs minimaux :

```json
{
  "id": "linux-zorin",
  "family": "linux",
  "displayName": "Zorin OS",
  "tier": "P2",
  "status": "planned",
  "toolkit": "gnome",
  "explorerTemplate": "nemo-gnome",
  "embedKey": "zorin",
  "bodyId": "zorin",
  "facade": "OS/linux/families/debian/zorin/index.html",
  "skin": "home/Debian/Zorin/index.html"
}
```

3. Régénérer les projections si le dépôt le prévoit :

```bash
node usr/lib/capsuleos/tools/build-os-registry.mjs
node usr/lib/capsuleos/tools/build-pick-os.mjs
```

4. Créer `etc/capsuleos/profiles/linux-zorin.json` (miroir du futur `skin.profile.json`).

---

## 3. Assets (vendor + toolkit)

| Étape | Action |
|-------|--------|
| Toolkit | Réutiliser `assets/images/toolkits/<toolkit>/` — pas de copie complète |
| Vendor | Ajouter `assets/images/vendors/zorin/` (fond, logo pick-os si besoin) |
| Icônes | Référencer packs dans `assets/manifest.json` ; `iconPacks` dans le profil |
| Interdit | `OS/.../media/`, `home/*/media/img/` |

```bash
node usr/lib/capsuleos/tools/build-assets-manifest.mjs
node usr/lib/capsuleos/tools/validate-asset-zones.mjs
```

---

## 4. Façade & miroir skin (Linux)

1. **Copier** une façade proche (même toolkit) : ex. Ubuntu → Zorin sous `OS/linux/families/debian/zorin/`.
2. **Miroir** `home/Debian/Zorin/` avec la même structure relative.
3. **`skin.profile.json`** (façade + home) :

```json
{
  "assets": {
    "assetsBase": "../../../usr/share/capsuleos/assets",
    "toolkitPack": "toolkits/gnome",
    "vendorPack": "vendors/zorin",
    "iconPacks": ["icons/gnome"]
  },
  "paths": {
    "facade": "OS/linux/families/debian/zorin/index.html",
    "skin": "home/Debian/Zorin/index.html"
  }
}
```

4. **Ordre scripts** (façade Linux) : `user-home.js` → manifest assets → profils → `capsule-resource.js` → `capsule-skin-boot.js` → `capsule-window.js` → shell.

5. Variables : préférer `capsuleGlobals` dans le profil plutôt que `CAPSULE_*` ad hoc non listés.

---

## 5. Spécificités par type d’extension

### Nouvelle distribution (même bureau qu’une existante)

- Copier skin Ubuntu/Mint selon toolkit.
- Changer `bodyId`, tokens CSS (`body#zorin`), `strings.json`, icônes vendor.
- **< 200 lignes JS** hors boot si possible.

### Nouvelle version (ex. Windows 12, macOS 16)

- Nouvelle entrée `id` + façade `OS/windows/12/` ou segment version.
- Réutiliser `usr/lib/capsuleos/shells/windows/` — pas de second kernel.

### Nouvel environnement de bureau (toolkit)

- Coût élevé : pack `toolkits/<nouveau>/`, templates explorateur, [contrib.md § toolkits](../../contrib.md#bibliotheques-graphiques-linux-toolkits-gui).
- Enregistrer le toolkit dans `os-registry.json` section `toolkits`.
- Staffer `role-developer` + `role-graphic-artist` + `role-integrator`.

### Nouveau vendor (branding seul)

- Pack `vendors/<nom>` + pick-os icon.
- Skins existants : ajouter `vendorPack` au profil — pas de fork JS.

### Nouvelle famille OS

- Suivre [os-stub/SKILL.md](../skills/os-stub/SKILL.md) : façade `OS/<famille>/`, shell `usr/lib/capsuleos/shells/<famille>/`, skill dédié.

---

## 6. Validation & livraison

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
node usr/lib/capsuleos/tools/validate-skin-profiles.mjs
node usr/lib/capsuleos/tools/generate-public-manifest.mjs   # si explorateur / home public
node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs    # si templates ou strings
```

Smoke manuel :

- Ouvrir la façade en `file://` : shell, menu, 1 app, explorateur.
- Vérifier résolution `./assets/...` (pas de 404 images).

---

## 7. Documentation agent (sans README sous OS/)

- Mettre à jour [repertoire-os.md](repertoire-os.md) (tableau entrée).
- Sources design dans `sources[]` du registre ou du profil.
- Brief équipe : `id`, `tier`, toolkit, gate vert.

---

## Checklist copiable

Clone VM (si parité réelle) : [`templates/clone-os-checklist.md`](templates/clone-os-checklist.md)

```
[ ] Entrée os-registry (+ pick-os regen si applicable)
[ ] Profil etc/capsuleos/profiles/<id>.json + skin.profile.json miroirs
[ ] Toolkit existant confirmé ; vendor pack si besoin
[ ] Façade + home miroir ; ordre boot scripts
[ ] Aucune image hors zones assets/
[ ] validate-all → exit 0
[ ] Embed regen si Linux templates/strings touchés
[ ] Smoke file:// OK
```
