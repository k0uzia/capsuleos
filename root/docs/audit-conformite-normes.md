# Audit conformité normes — CapsuleOS

> **Statut** : suivi des normes prioritaires (schema.org, OWASP, REUSE 3, WCAG 2.2 P10).  
> **Clôture release** : `node usr/lib/capsuleos/tools/validate-all.mjs` (**H₆**).

| Norme | Gate / artefact | Statut | Prochaine étape |
|-------|-----------------|--------|-----------------|
| **schema.org** | `build-schema-org.mjs` · `validate-schema-org.mjs` · JSON-LD hubs `index.html`, `OS/linux/index.html`, `mnt/index.html` | **OK** | Hubs Android/macOS optionnels si entrées actives |
| **OWASP Top 10** | `validate-owasp-static.mjs` · contrat `owasp-htaccess.json` · matrice [SECURITY.md](../SECURITY.md) | **OK** | Smoke curl prod via workflow `owasp-smoke.yml` (opt-in URL) |
| **REUSE 3** | `validate-reuse.mjs` (rapide) · `validate-reuse-full.mjs` + `run-reuse-lint.mjs` · [LICENSE.md](../LICENSE.md) | **OK** | Étendre SPDX explicite aux tools restants |
| **WCAG 2.2 AA (P10)** | `validate-a11y.mjs` · `a11y-scan-targets.json` · rapport `var/lib/capsuleos/generated/a11y-report.json` · `#accessibilite` portail | **OK** | Corriger avertissements moderate/minor au fil de l'eau |

## Commandes par norme

```bash
# schema.org
node usr/lib/capsuleos/tools/build-schema-org.mjs
node usr/lib/capsuleos/tools/validate-schema-org.mjs

# OWASP (.htaccess statique)
node usr/lib/capsuleos/tools/validate-owasp-static.mjs

# REUSE 3
node usr/lib/capsuleos/tools/validate-reuse-full.mjs

# WCAG 2.2 (P10 opt-in — npm ci + Playwright requis)
node usr/lib/capsuleos/tools/validate-a11y.mjs
CAPSULE_HTTP_BASE=http://127.0.0.1:9876 node usr/lib/capsuleos/tools/lab/smoke-a11y-portal.mjs
```

## Références

- [convention-schema-org.md](convention-schema-org.md)
- [SECURITY.md](../SECURITY.md) § OWASP
- [LICENSE.md](../LICENSE.md) § REUSE / assets tiers
- [agent-validation-discipline.md](agent-validation-discipline.md) § Portail / a11y
- [fondements-philosophiques.md](fondements-philosophiques.md) §5.1 **P10**
