# Routage des données et médias

Référence pour des liens **robustes** en `file://` et en **HTTP** — HTML statique, CSS, JSON, fetch et `CapsuleResource`.

**Skill agent** : [`../skills/link-routing/SKILL.md`](../skills/link-routing/SKILL.md)

---

## Deux couches de résolution

| Couche | Moment | Mécanisme | Exemple |
|--------|--------|-----------|---------|
| **Statique HTML** | Parse DOM (immédiat) | `src` / `href` relatifs au document ou `<base>` | `<img src="…">` |
| **Dynamique JS** | Après boot scripts | `resolveCapsuleResourceUrl()` / `CapsuleResource.resolve()` | `mainMenu.js`, `contentLoader` |
| **CSS** | Feuille chargée | `url()` relatifs au fichier CSS | `background-image` |
| **Données** | fetch / embed | `CAPSULE_CONTENT_ROOT`, manifest, embed | `strings.json`, apps |

**Piège** : `./assets/…` dans le **HTML du body** avant les scripts de fin de page **n’est pas** résolu par `CapsuleResource` — le navigateur charge l’URL telle quelle (souvent `home/…/assets/` inexistant → 404 en `file://`).

---

## Chemins logiques vs physiques

| Style | Usage | `file://` |
|-------|--------|-----------|
| **Logique** `./assets/`, `./icons/` | JS runtime, templates injectés après boot | OK si `resolveCapsuleResourceUrl` |
| **Physique** `../../../usr/share/capsuleos/assets/…` | `src` / `href` / `favicon` dans HTML statique | OK |
| **Portail** `./usr/share/capsuleos/assets/…` | `index.html` racine (sans `<base>`) | OK |

Règle projet : packs sous `usr/share/capsuleos/assets/` uniquement ([politique-assets.md](politique-assets.md)).

---

## Boot Linux (façade + skin)

Ordre minimal pour la couche **dynamique** :

```
user-home.js
→ capsule-assets-manifest.js
→ capsule-skin-profiles.js
→ capsule-resource.js
→ capsule-skin-boot.js
→ (scripts shell, contentLoader, …)
```

Profil : `assets.assetsBase` + `toolkitPack` + `iconPacks` — pas de `CAPSULE_MEDIA_BASE` dans `capsuleGlobals`.

Façade : `<base href="…/home/…/Skin/">` — les scripts `usr/lib/` restent en chemins depuis la racine du dépôt (voir [raccordement-noyau-os.md](raccordement-noyau-os.md)).

---

## Préfixes logiques (`CapsuleResource`)

| Préfixe | Résolu vers |
|---------|-------------|
| `./assets/` | `CAPSULE_ASSETS_BASE` / profil |
| `./icons/kde/` | pack `icons/kde` |
| `./icons/cinnamon/` | pack `icons/cinnamon` |
| `./media/` | `CAPSULE_TOOLKIT_ASSETS_BASE` (legacy → toolkits) |

Manifeste : `usr/share/capsuleos/assets/manifest.json` · embed : `var/lib/capsuleos/generated/capsule-assets-manifest.js`.

---

## Données utilisateur simulées

| Ressource | Chemin physique | API |
|-----------|-----------------|-----|
| Home public | `home/public/` | `CapsuleUserHome.fromRepoDepth(n)` |
| Manifeste Nemo | `home/public/.capsule-manifest.json` | `CapsuleUserHome.manifestPath()` |
| Strings skin | `./content/strings.json` | fetch ou embed |
| Apps Linux | `usr/share/capsuleos/linux/apps/` | `contentLoader` + embed |

`file://` : embed obligatoire pour apps ; HTTP : fetch direct possible.

---

## Mode `file://` vs HTTP

| Aspect | `file://` | HTTP local |
|--------|-----------|------------|
| fetch JSON/apps | Bloqué ou restreint | OK |
| Apps bureau Linux | `capsule-app-embed.js` | fetch ou embed (`CAPSULE_FORCE_APP_EMBED`) |
| Assets statiques HTML | Chemins **physiques** recommandés | Idem + même chemins |
| CSS `@import` profondeur | Compter `../` depuis le fichier CSS | Idem — `fix-theme-import-depths.mjs` |

Smoke : tester **les deux** sur Mint P0 après toute passe liens.

---

## Passe générale (agents)

### 1. Diagnostiquer

```bash
node usr/lib/capsuleos/tools/validate-links-all.mjs
node usr/lib/capsuleos/tools/validate-static-html-assets.mjs
```

### 2. Corriger motifs legacy

```bash
node usr/lib/capsuleos/tools/audit-asset-paths.mjs
node usr/lib/capsuleos/tools/rewrite-asset-paths.mjs      # si media/img, branding
node usr/lib/capsuleos/tools/fix-static-html-asset-urls.mjs
node usr/lib/capsuleos/tools/rewrite-physical-asset-paths.mjs  # Windows, Android, iOS, macOS
node usr/lib/capsuleos/tools/fix-theme-import-depths.mjs
node usr/lib/capsuleos/tools/rewrite-css-asset-urls.mjs
```

### 3. Valider

```bash
node usr/lib/capsuleos/tools/validate-links-all.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
```

### 4. Regen si données / apps

```bash
node usr/lib/capsuleos/tools/generate-public-manifest.mjs
node usr/lib/capsuleos/tools/linux/build-linux-embed.mjs
```

---

## Gates

| Script | Rôle |
|--------|------|
| `validate-links-all.mjs` | Orchestrateur liens + médias |
| `validate-static-html-assets.mjs` | `src`/`href` ./assets résolvables sur disque |
| `validate-link-integrity.mjs` | Façades actives, hubs, pick-os |
| `validate-css-asset-urls.mjs` | `url()` CSS |
| `audit-data-links.mjs` | `data-link` ↔ embed |
| `audit-asset-paths.mjs` | Motifs legacy dans sources |

---

## Anti-patterns

1. `./assets/` dans `<img src>` sans fichier physique ni boot head.
2. Hub portail avec `./assets/` au lieu de `./usr/share/capsuleos/assets/`.
3. `../.././assets/` ou `././assets/` (profondeur cassée).
4. `fetch('./content/…')` en `file://` sans embed ni serveur.
5. Oublier `<base>` sur façade Linux (chemins skin faux).

---

## Liens

- [raccordement-noyau-os.md](raccordement-noyau-os.md)
- [smoke-integrite-liens.md](smoke-integrite-liens.md)
- [politique-assets.md](politique-assets.md)
- [contrib.md](../contrib.md)
