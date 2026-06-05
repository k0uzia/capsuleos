# Brief agent — elementary OS

> Généré par `print-agent-brief.mjs` — à copier dans la tâche agent ou committer sous `root/docs/briefs/`.

## Contexte

- **ID registre** : `linux-elementary`
- **Famille** : linux
- **Tier** : P2 · **Statut** : planned · **Maturité** : 0
- **Toolkit** : pantheon (toolkits/pantheon)
- **Vendor** : elementary (vendors/elementary)
- **Shell** : pantheon · **Explorateur** : —
- **embedKey** / **bodyId** : `elementary` / `elementary`

## Sources design

- hig: [Human Interface Guidelines](https://docs.elementary.io/hig/)

## Skills & formation

1. `onboarding` → H0–H2 : `node usr/lib/capsuleos/tools/validate-all.mjs`
2. `os-linux` + `role-integrator` (skin) ; `role-graphic-artist` si pack vendor
3. Doc : [ajouter-os-scalable.md](../../docs/ajouter-os-scalable.md)

## Fichiers canon

- `etc/capsuleos/os-registry.json`
- Profil cible : `etc/capsuleos/profiles/linux-elementary.json`
- `usr/share/capsuleos/assets/manifest.json`
- [manifeste-noyau.md](../../docs/manifeste-noyau.md) · [contrib.md § toolkits](../../../contrib.md#bibliotheques-graphiques-linux-toolkits-gui) (si Linux)

## Chemins proposés

- **Façade** : `OS/linux/families/debian/elementary/index.html` _(à créer)_
- **Skin miroir** : `home/Debian/Elementary/index.html` _(à créer)_
- **Pack toolkit** : `assets/images/toolkits/pantheon/`
- **Pack vendor** : `assets/images/vendors/elementary/`

## Livrables

1. Entrée registre à jour (`facade`, `skin`, `status` si passage beta/active)
2. `skin.profile.json` (façade + home) + `etc/capsuleos/profiles/<id>.json`
3. Façade + miroir home ; boot : `capsule-resource.js` → `capsule-skin-boot.js`
4. Tokens CSS / `content/strings.json` si Linux
5. `validate-all.mjs` → exit 0
6. Regen embed Linux si templates/strings : `linux/build-linux-embed.mjs`
7. Smoke `file://` : shell, menu, 1 app, explorateur

## Gates

```bash
node usr/lib/capsuleos/tools/validate-all.mjs
```

## Interdits

- Fork `contentLoader` / `CapsuleWindow`
- Images hors `usr/share/capsuleos/assets/` et `home/public/Images/`
- `CAPSULE_MEDIA_BASE` dans profil ; README sous `OS/`
- `?.` / `??` / object spread dans JS runtime
