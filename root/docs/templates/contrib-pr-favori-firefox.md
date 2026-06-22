# Modèle PR — favori ou raccourci Firefox (pack contrib)

> Copier ce modèle lors de l’ajout d’un favori, d’un moteur de recherche ou d’un raccourci nouvel onglet dans le pack Mozilla Firefox.

## Résumé

- **Pack** : `usr/share/capsuleos/contrib/internet/browser/mozilla/firefox/`
- **Fichiers touchés** : `bookmarks.default.json` / `newtab-shortcuts.json` / `search-engine.json`
- **Site cible** : `{siteId}` (doit exister dans `usr/share/capsuleos/web/`)

## Checklist contributeur

- [ ] Le **site** existe déjà ou est ajouté dans la même PR (voir `contrib-pr-nouveau-site-web.md`)
- [ ] `newtab-shortcuts.json` : clé stable + `siteId` + label FR
- [ ] Entrée miroir dans `etc/capsuleos/contracts/simulated-web-index.json` → `shortcuts.{key}`
- [ ] **Pas de hardcode** de host dans `firefoxBrowser.js` (**R-CONTRIB3**)
- [ ] Inventaire VM ou note pédagogique si parité distro (optionnel P1)
- [ ] `node usr/lib/capsuleos/tools/validate-contrib-packages.mjs`
- [ ] `node usr/lib/capsuleos/tools/validate-simulated-web.mjs`

## Test plan

1. Serveur HTTP local → ouvrir Firefox sur Mint ou Alma
2. Raccourci nouvel onglet ou favori → navigation vers `web/{siteId}/`
3. Smoke : `CAPSULE_HTTP_BASE=http://127.0.0.1:5501 node usr/lib/capsuleos/tools/lab/smoke-gnome-firefox-scenarios.mjs --id linux-alma --scenario F6` (GNOME) ou `smoke-mint-firefox.mjs` (Mint)

## Références

- [`root/docs/convention-contrib-apps.md`](../convention-contrib-apps.md)
- Contrat scénarios : `etc/capsuleos/contracts/firefox-user-scenarios.json`
