# Brief agent — Linux Mint (Cinnamon)

> Généré par `print-agent-brief.mjs` — à copier dans la tâche agent ou committer sous `root/docs/briefs/`.

## Contexte

- **ID registre** : `linux-mint`
- **Famille** : linux
- **Tier** : P0 · **Statut** : active · **Maturité** : 0.95
- **Toolkit** : cinnamon (toolkits/cinnamon)
- **Vendor** : mint (vendors/mint)
- **Shell** : cinnamon · **Explorateur** : nemo
- **embedKey** / **bodyId** : `mint` / `mint`

## Sources design

- design: [Cinnamon](https://projects.linuxmint.com/cinnamon/)

## Skills & formation

1. `onboarding` → H0–H2 : `node usr/lib/capsuleos/tools/validate-all.mjs`
2. `os-linux` + `role-integrator` (skin) ; `role-graphic-artist` si pack vendor
3. Doc : [ajouter-os-scalable.md](../../docs/ajouter-os-scalable.md)

## Fichiers canon

- `etc/capsuleos/os-registry.json`
- Profil cible : `etc/capsuleos/profiles/linux-mint.json`
- `usr/share/capsuleos/assets/manifest.json`
- [manifeste-noyau.md](../../docs/manifeste-noyau.md) · [contrib.md § toolkits](../../../contrib.md#bibliotheques-graphiques-linux-toolkits-gui) (si Linux)

## Chemins proposés

- **Façade** : `OS/linux/families/debian/mint/index.html`
- **Skin miroir** : `home/Debian/Mint/index.html`
- **Pack toolkit** : `assets/images/toolkits/cinnamon/`
- **Pack vendor** : `assets/images/vendors/mint/`

## Clone VM (référence gold)

- Procédure : [procedure-clonage-os-depuis-vm.md](../../docs/procedure-clonage-os-depuis-vm.md)
- Inventaire : [inventaires/linux-mint-vm.json](../../docs/inventaires/linux-mint-vm.json)
- Parité : [inventaire-parite-mint-vm.md](../../docs/inventaire-parite-mint-vm.md)
- Statut : [inventaires/linux-mint-clone-status.md](../../docs/inventaires/linux-mint-clone-status.md)
- Comportements : [mint-fenetres-muffin.md](../../docs/mint-fenetres-muffin.md)

```bash
node usr/lib/capsuleos/tools/lab/collect-mint-inventory.mjs --write-doc
node usr/lib/capsuleos/tools/lab/compare-os-parity.mjs --id linux-mint --scenario panel-checklist
```

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
