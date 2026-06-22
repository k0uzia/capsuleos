# Convention — applications contrib et internet simulé

> **Statut** : juin 2026 — paradigme contribution apps transversales + corpus web local.  
> Complète : [architecture-catalogue-apps.md](architecture-catalogue-apps.md) · [convention-modules-mnt.md](convention-modules-mnt.md) · [politique-assets.md](politique-assets.md)

## 1. Quatre couches

| Couche | Chemin | Rôle |
|--------|--------|------|
| **Fonction** | `usr/share/capsuleos/linux/apps/` + `usr/lib/capsuleos/shells/linux/` | Slot, gabarit HTML, kernel (ex. `firefox.html`, `firefoxBrowser.js`) |
| **Contrib app** | `usr/share/capsuleos/contrib/{catégorie}/{vendor}/{app}/` | Manifeste, moteur de recherche, favoris — **pas** de duplication du gabarit |
| **Web simulé** | `usr/share/capsuleos/web/{siteId}/` | Sites statiques servis en local (offline-first) |
| **Présentation** | `home/*/style/apps/*.skin.css` | Chrome vendor (Proton, onglets, couleurs) |

Index machine (Z0) : [`etc/capsuleos/contracts/simulated-web-index.json`](../../etc/capsuleos/contracts/simulated-web-index.json)  
Runtime généré : `var/lib/capsuleos/generated/capsule-simulated-web-index.js` · `capsule-firefox-contrib.js`

## 2. Arborescence contrib

```text
usr/share/capsuleos/contrib/internet/browser/mozilla/firefox/
├── manifest.json
├── search-engine.json
├── bookmarks.default.json
└── README.md
```

Catégories suggérées : `internet/browser`, `internet/email`, `office`, `multimedia`, `system`.

## 3. Arborescence web

```text
usr/share/capsuleos/web/{siteId}/
├── site.json       # hosts[], titre, licence contenu
└── index.html
```

Gabarit minimal : [`usr/share/capsuleos/web/_template/`](../usr/share/capsuleos/web/_template/).

## 4. Règles (R-CONTRIB)

| Id | Règle |
|----|-------|
| **R-CONTRIB1** | Todo package contrib déclare `manifest.json` + `slotId` existant dans `slots-manifest.json` |
| **R-CONTRIB2** | Contenu web **original** ou licence documentée dans `site.json` — pas de scrape intégral de sites tiers |
| **R-CONTRIB3** | Hosts déclarés dans `site.json` + index — pas de hardcode dans le kernel navigateur |
| **R-CONTRIB4** | Modules `/mnt` référencés par id stable dans l’index (`type: mnt`) |
| **R-CONTRIB5** | Gates `validate-contrib-packages.mjs` + `validate-simulated-web.mjs` avant merge |

## 5. Résolution URL (navigateur)

| Entrée | Comportement |
|--------|--------------|
| Vide / `about:newtab` | Nouvel onglet |
| Texte sans `.` (recherche) | SERP locale (`search-google?q=…`) |
| Host connu | Iframe → `web/{siteId}/` |
| `capsuleos://mnt/{moduleId}/{scenarioId}` | Ouverture scénario pédagogique |
| Inconnu | Page d’erreur réseau simulée |

Kernel : [`simulatedWebResolver.js`](../../usr/lib/capsuleos/shells/linux/simulatedWebResolver.js) · consommé par [`firefoxBrowser.js`](../../usr/lib/capsuleos/shells/linux/firefoxBrowser.js).

## 6. Checklist contributeur

1. Copier `web/_template/` → `web/{siteId}/`, remplir `site.json`.
2. `node usr/lib/capsuleos/tools/build-simulated-web-index.mjs`
3. `node usr/lib/capsuleos/tools/build-firefox-contrib-bundle.mjs`
4. `node usr/lib/capsuleos/tools/validate-simulated-web.mjs`
5. `node usr/lib/capsuleos/tools/validate-contrib-packages.mjs`
6. Tester : `python3 -m http.server` à la racine → Firefox → saisir le host déclaré.
7. En-têtes SPDX sur nouveaux fichiers JS/MJS.
8. Modèles PR : [`templates/contrib-pr-nouveau-site-web.md`](templates/contrib-pr-nouveau-site-web.md) · [`templates/contrib-pr-favori-firefox.md`](templates/contrib-pr-favori-firefox.md)

## 7. Réalisme (P9 / P10)

- **Chrome navigateur** : tokens couleur et chrome fenêtre par vendor (`firefox.skin.css`, inventaires lab) — **pas** de gabarit HTML vendor pour Firefox.
- **Moteur web** : simulé, local, sans Gecko — objectif immersion pédagogique, pas clone Mozilla complet.

## 8. Firefox — slot partagé (toutes distributions)

Firefox est **transversal** : une seule fonction (kernel + gabarit Z1), plusieurs présentations (skins).

| Couche | Chemin | Contenu |
|--------|--------|---------|
| **Kernel** | `usr/lib/capsuleos/shells/linux/firefoxBrowser.js` | Onglets, navigation, résolution URL (`simulatedWebResolver.js`) |
| **Gabarit** | `usr/share/capsuleos/linux/apps/firefox.html` | DOM Proton (`capsule-browser--proton`) — toolbar, newtab, 7 raccourcis, Pocket |
| **CSS structurel** | `firefox.base.css` + `firefox-proton.base.css` | Layout Proton · assets `images/toolkits/firefox/` (pull VM) |
| **Skin vendor** | `home/*/style/apps/firefox.skin.css` | Tokens couleur, onglets actifs, chrome fenêtre (CSD GNOME vs Muffin Mint) |
| **Données contrib** | `usr/share/capsuleos/contrib/internet/browser/mozilla/firefox/` | Favoris, moteur recherche — **sans** dupliquer le gabarit |

### Règle R-FF-SLOT

| Id | Règle |
|----|-------|
| **R-FF-SLOT1** | **Interdit** : `home/{Vendor}/apps/firefox.html` — la parité VM se promeut dans le slot Z1, pas en override skin |
| **R-FF-SLOT2** | Styles Proton structurels → `firefox-proton.base.css` (embed via `build-linux-embed.mjs`) |
| **R-FF-SLOT3** | Skins : tokens + `--firefox-proton-brand-logo` vendor uniquement |
| **R-FF-SLOT4** | Nouveau raccourci newtab → asset dans `usr/share/capsuleos/assets/images/toolkits/firefox/newtab/` + `pull-firefox-vm-assets.sh` si sourcing VM |

### Règle R-CENTRAL-SLOT (gabarits fonctionnels Z1)

| Id | Règle |
|----|-------|
| **R-CENTRAL-SLOT1** | **Interdit** : `home/{Vendor}/apps/{slot}.html` hors allowlist (`mainMenu.html`, `mainMenu-gnome.html`) — promouvoir en Z1 + `CAPSULE_TEMPLATE_OVERRIDES` si variant toolkit ≠ `{slot}.html` |
| **R-CENTRAL-SLOT2** | Variants multi-toolkit : gabarits explicites (`visionneur_images_pix.html`, `cinnamon_settings.html`, `update_manager_gnome.html`) dans `usr/share/capsuleos/linux/apps/` |
| **R-CENTRAL-SLOT3** | Skins : `home/*/style/apps/*.skin.css` uniquement (tokens, icônes toolbar) |
| **R-CENTRAL-SLOT4** | Gate `validate-skin-app-html-overrides.mjs` avant merge |

**Correction juin 2026 (Mint)** : `home/Debian/Mint/apps/` supprimé — visionneurs Pix/Xreader promus en Z1 ; Paramètres via `cinnamon_settings.html` (slot `themes`).

### Pourquoi un override skin ne se propage pas

`contentLoader.js` résout le gabarit via `resolveTemplateHtmlCandidates()` : un fichier sous `home/{Vendor}/apps/{slot}.html` **primait** sur `usr/share/capsuleos/linux/apps/` (désormais bloqué par R-CENTRAL-SLOT). La parité VM doit remonter en Z1 ou passer par `CAPSULE_TEMPLATE_OVERRIDES` déclaré dans le profil.

**Correction juin 2026** : gabarit Proton Mint remonté en Z1 ; override Mint supprimé ; smokes F1–F6 sur Alma/Rocky/Fedora/Ubuntu/Mint.

Gates : `validate-firefox-user-scenarios.mjs` · `smoke-gnome-firefox-scenarios.mjs` · `smoke-mint-firefox.mjs` · `validate-skin-app-html-overrides.mjs` · `sync-linux-skin-closure.mjs` avant merge skin.

### Sourcing icônes (R-A1 / VM)

Script lab : `bash root/tools/lab/pull-firefox-vm-assets.sh --id linux-mint`

| Dossier | Contenu | Source |
|---------|---------|--------|
| `toolkits/firefox/chrome/` | back, forward, reload, menu, pocket, profil, bouclier | `omni.ja` Mozilla (MPL-2.0) |
| `toolkits/firefox/brand/` | logo application, wordmark | hicolor + newtab extension |
| `toolkits/firefox/newtab/` | tuiles sponsorisées + favicons sites | Contile FR + fetch VM |

Ne pas inventer de SVG placeholder : les gabarits CSS pointent vers ce pack partagé.

## 9. Navigation interne (web simulé ↔ Firefox)

| Id | Règle |
|----|-------|
| **R-WEB-NAV1** | Liens relatifs (`?page=`, `./`) restent dans l'iframe du site courant |
| **R-WEB-NAV2** | Hosts indexés (`data-capsule-web-nav` ou URL absolue) → `postMessage` parent `{ type: 'capsule:web-navigate', href }` |
| **R-WEB-NAV3** | Script partagé `usr/share/capsuleos/web/_shared/site-nav.js` inclus dans chaque mock |
| **R-WEB-NAV4** | Kernel : `firefox-iframe-bridge.js` + historique onglet dans `firefoxBrowser.js` — pas de hardcode host |

Pont : [`firefox-iframe-bridge.js`](../../usr/lib/capsuleos/shells/linux/firefox-iframe-bridge.js) · [`site-nav.js`](../../usr/share/capsuleos/web/_shared/site-nav.js)

## 10. Navigateurs simulés — enveloppe vs app (multi-produits)

Complète : [compatibilite-navigateurs.md](compatibilite-navigateurs.md) · [processus-branchement-noyau.md](processus-branchement-noyau.md) (terminal, explorateur).

### Deux « moteurs » distincts (ne pas confondre)

| Axe | Module / doc | Question | Contenu |
|-----|--------------|----------|---------|
| **Enveloppe** | `usr/lib/capsuleos/engines/` · `CapsuleBrowserCapabilities` | Quel navigateur **hôte** charge CapsuleOS ? | UA (Gecko / Blink / WebKit), préfixes CSS, capacités (`file://`, `maskImage`…) |
| **App simulée** | slot `firefox` (+ futurs slots) · contrib `internet/browser/` | Quelle app **internet du bureau** est affichée ? | Chrome UI, onglets, favoris, navigation web simulé |

**Interdit** : brancher Firefox / Chromium simulés sur `CapsuleEngineRegistry` — le lab Playwright (Chromium) peut afficher l’app Firefox ; l’enveloppe et le produit sont orthogonaux.

### Quatre sous-couches (apps internet)

Modèle calqué sur **terminal** (`shells/linux/terminal/`, agnostique) et **explorateur** (Nemo / Nautilus / Dolphin — gabarit + kernel partagé partiel) :

```text
Z0/Z1  Web simulé     web/ + simulatedWebResolver.js + site-nav.js     (partagé, neutre produit)
Z1     Runtime        onglets, historique, iframe-bridge, raccourcis   (aujourd’hui dans firefoxBrowser.js)
Z1     Slot + gabarit firefox.html · futur chromium.html…             (un slot = une app)
Z2     Skin           firefox.skin.css · futur chromium.skin.css
contrib  Pack vendor  contrib/internet/browser/{vendor}/{app}/
```

Métadonnée contrib optionnelle : `"browserFamily": "gecko"` (Firefox) ou `"blink"` (Chromium) — **doc / parité VM uniquement**, pas dispatch runtime.

### Règles (R-BROWSER)

| Id | Règle |
|----|-------|
| **R-BROWSER1** | Web simulé et resolver **sans** hardcode produit (pas de « Firefox only » dans `simulatedWebResolver.js`) |
| **R-BROWSER2** | **Un slot manifest** par app (`firefox`, puis `chromium` si ground truth VM) — pas de slot générique `browser` |
| **R-BROWSER3** | **Ne pas extraire** `browserRuntime.js` tant qu’un second slot navigateur n’est pas requis par inventaire VM (**P7**) |
| **R-BROWSER4** | À l’extraction : runtime agnostique + adaptateur fin par slot (Proton/Pocket restent dans l’adaptateur Firefox) |
| **R-BROWSER5** | DOM partagé : préfixe neutre `capsule-browser__*` ; détails vendor dans classes ou gabarit slot |

**État juin 2026** : seul Firefox est P0 sur toutes les distros simulées ; couches web + resolver déjà partagées ; kernel monolithique Firefox acceptable jusqu’au second produit VM.
