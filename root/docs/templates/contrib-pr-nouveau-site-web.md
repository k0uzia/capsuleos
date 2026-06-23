# Modèle PR — nouveau site web simulé

> Copier ce modèle dans la description de votre pull request lors de l’ajout d’un site sous `usr/share/capsuleos/web/{siteId}/`.

## Résumé

- **siteId** : `{siteId}`
- **Hosts déclarés** : `{host.example}`
- **Licence contenu** : contenu original CapsuleOS / `{licence}`

## Checklist contributeur

- [ ] Copie depuis `usr/share/capsuleos/web/_template/` vers `usr/share/capsuleos/web/{siteId}/`
- [ ] `site.json` complété (`siteId`, `hosts[]`, `contentLicense`, note pédagogique)
- [ ] Contenu **original** ou licence documentée (**R-CONTRIB2**)
- [ ] Entrée ajoutée dans `etc/capsuleos/contracts/simulated-web-index.json` (`hosts` + `shortcuts` si tuile Firefox)
- [ ] `node usr/lib/capsuleos/tools/build-simulated-web-index.mjs`
- [ ] `node usr/lib/capsuleos/tools/validate-simulated-web.mjs`
- [ ] Test manuel : Firefox → saisir le host → page locale (pas de redirect silencieux)
- [ ] En-têtes SPDX sur nouveaux fichiers JS/HTML si applicable

## Test plan

1. `python3 -m http.server 5501 --bind 127.0.0.1` à la racine du dépôt
2. Ouvrir une façade OS (ex. Alma) → Firefox
3. Saisir `{host.example}` dans la barre d’adresse → iframe vers `web/{siteId}/`
4. `node usr/lib/capsuleos/tools/validate-all.mjs` vert sur la zone touchée

## Références

- [`root/docs/convention-contrib-apps.md`](../convention-contrib-apps.md)
- [`contrib.md`](../../contrib.md) § Apps contrib et internet simulé
