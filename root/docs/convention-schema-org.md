# Convention — données structurées schema.org

> **Statut** : norme interne actée · [plan-maitre-reproduction-os.md](plan-maitre-reproduction-os.md) §9 · [fondements-philosophiques.md](fondements-philosophiques.md) §4.3.  
> **Outils** : `build-schema-org.mjs` · `validate-schema-org.mjs`

---

## 1. Périmètre

| Zone | JSON-LD | Types schema.org |
|------|---------|------------------|
| **Portail** `index.html` | Oui (injecté) | `WebSite`, `ItemList` global |
| **Hub `/OS/linux/`** | Oui (injecté) | `CollectionPage`, `ItemList` Linux |
| **Hub `/mnt/`** | Oui (injecté) | `CollectionPage`, `LearningResource` + scénarios (`Course`) |
| **Façades skin** `OS/.../index.html` | Via hubs (URLs catalogue) | `SoftwareApplication` |
| **Intérieur bureau simulé** | **Non** | Pas de JSON-LD par fenêtre / slot |

La métadonnée OS pointe vers les **façades** `OS/.../index.html` ; le HTML skin sous `home/` reste hors périmètre SEO.

---

## 2. Sources machine

| Source | Rôle |
|--------|------|
| `etc/capsuleos/os-registry.json` | Entrées OS (`id`, `displayName`, `facade`, `status`) |
| `mnt/catalog.json` + `mnt/**/module.json` | Modules et scénarios pédagogiques |
| `etc/capsuleos/contracts/schema-org-site.json` | URL publique, éditeur |

---

## 3. Génération et injection

```bash
node usr/lib/capsuleos/tools/build-schema-org.mjs
node usr/lib/capsuleos/tools/validate-schema-org.mjs
```

Artefacts :

- `var/lib/capsuleos/generated/schema-org/graph.json` — graphe `@graph` complet
- `var/lib/capsuleos/generated/schema-org.hash.json` — empreinte sources
- Bloc `<!-- CAPSULE_SCHEMA_ORG:BEGIN -->` … `END` dans `index.html`, `OS/linux/index.html`, `mnt/index.html`

Regénérer après modification du registre OS ou du catalogue `/mnt`.

---

## 4. Gate

`validate-schema-org.mjs` (inclus dans `validate-quality-all.mjs`) :

- fichiers générés présents et à jour ;
- `index.html` contient un JSON-LD valide entre les marqueurs ;
- structure minimale `@context`, `@graph`, types attendus.

---

## 5. Références

- [convention-modules-mnt.md](convention-modules-mnt.md)
- [convention-css-variables-tokens.md](convention-css-variables-tokens.md) — données visuelles vs JSON
