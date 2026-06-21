# Analyse Firefox — VM Linux Mint 22.3 Zena → CapsuleOS

**Objectif** : ground truth pour une reproduction **fidèle** du navigateur Proton — slot partagé `usr/share/capsuleos/linux/apps/firefox.html`, tokens Mint dans `home/Debian/Mint/style/apps/firefox.skin.css`.

**Collecte assets icônes** : `bash root/tools/lab/pull-firefox-vm-assets.sh --id linux-mint` → `usr/share/capsuleos/assets/images/toolkits/firefox/` (chrome Mozilla, Contile, favicons sites).

**Collecte** : SSH `<lab-inventory:linux-mint-firefox>` (voir `etc/capsuleos/lab-inventory.json`) · script [`vm-mint-firefox-inventory.sh`](../../tools/lab/vm-mint-firefox-inventory.sh) · campagne manuelle 2026-06-04.

Références : [`linux-mint-vm.json`](linux-mint-vm.json) · [`inventaire-parite-mint-vm.md`](../inventaire-parite-mint-vm.md) · [`mint-fenetres-muffin.md`](../mint-fenetres-muffin.md) · passe #7 [`linux-mint-clone-status.md`](linux-mint-clone-status.md)

---

## 1. Identité VM (paquet & distribution)

| Élément | VM |
|---------|-----|
| Version | **Mozilla Firefox 151.0.1** (`151.0.1+linuxmint1+zena`) |
| Paquet | `firefox` (build Mint, pas snap Ubuntu) |
| `.desktop` | `firefox.desktop` — **Navigateur Web Firefox** (FR) |
| `Exec` | `firefox %u` |
| `Icon` | `firefox` → thème **Mint-Y** (`/usr/share/icons/Mint-Y/apps/24/firefox.png`, …) |
| Channel | `app.distributor.channel=zena`, `app.distributor=mint` |
| Mises à jour | `app.update.enabled=false` (politique distribution Mint) |
| Navigateur par défaut | `firefox.desktop` |

Fichier clé : `/usr/lib/firefox/distribution/distribution.ini` — section `[Preferences]` :

| Préférence distribution | Valeur | Impact parité |
|-------------------------|--------|----------------|
| `browser.tabs.inTitlebar` | **0** | **P0** — onglets **sous** la barre de titre Cinnamon/Muffin, pas fusionnés avec les boutons fenêtre |
| `browser.shell.checkDefaultBrowser` | false | Pas de prompt « Firefox n’est pas le navigateur par défaut » |
| `widget.content.gtk-theme-override` | `#` | Désactive l’override GTK sur le contenu |
| `browser.backspace_action` | 0 | Retour arrière avec Backspace (historique) |
| `intl.locale.requested` | `""` | Locale système (FR installé : `firefox-locale-fr`) |

Extensions packagées : langpacks `fr`, `en-GB`, `en-CA` dans `distribution/extensions/`.

---

## 2. Contexte bureau Cinnamon

| Couche | VM (gsettings) |
|--------|----------------|
| Thème Cinnamon | **Mint-Y-Dark-Aqua** |
| GTK apps | **Mint-Y-Aqua** |
| Icônes | **Mint-Y-Sand** |
| Panel | `grouped-window-list` + menu (pas de lanceur Firefox fixe dans l’applet — Firefox via menu / favoris / raccourcis) |
| WM class Firefox | `Navigator.firefox` |
| Titre WM typique | **Mozilla Firefox** (pas « Navigateur Web ») |
| Géométrie fenêtre (échantillon) | ~1280×728, Y=64 (sous barre panel ~40px) |

**CapsuleOS** : lanceur Firefox **fixe** dans le panel (`footer nav a[data-link="firefox"]`) — écart **P1** documenté (pédagogie, checklist panel 6/6).

---

## 3. Anatomie visuelle VM (Firefox 151 + Proton)

Structure verticale **attendue** (avec `browser.tabs.inTitlebar=0`) :

```text
┌─ Barre de titre Muffin (CapsuleOS = #windowHeader) ─────────────────┐
│  [icône] Mozilla Firefox                    [_] [□] [×]              │
├─ Barre d’onglets (tabs) ──────────────────────────────────────────────┤
│  [🔥] Nouvel onglet  ×  │  +                                          │
├─ Barre d’outils unifiée (Proton 3) ───────────────────────────────────┤
│  ← → ↻  │  [🔒] Rechercher avec Google ou saisir une adresse  │ ☆ ≡  │
├─ Barre de favoris (optionnelle, souvent masquée au premier lancement) ─┤
├─ Zone de contenu ─────────────────────────────────────────────────────┤
│  Page d’accueil Firefox (Mozilla) / site web                         │
└──────────────────────────────────────────────────────────────────────┘
```

Éléments Proton 151 observables / documentés :

- **Onglets** : coins arrondis, fond légèrement plus clair pour l’onglet actif, bouton « + » à droite.
- **Navigation** : retour / avant / recharger à gauche ; pas de bouton « Aller » séparé (validation Entrée dans la barre d’adresse).
- **Barre d’adresse** : placeholder FR **« Rechercher avec Google ou saisir une adresse »** (aligné CapsuleOS `strings-default.js`).
- **Actions droite** : menu « application » (≡), bibliothèque, étoile favoris — icônes vectorielles Proton, pas emoji.
- **Thème** : suit le schéma Firefox (clair/sombre système) ; sur VM GTK **Mint-Y-Aqua** le chrome peut rester **sombre** (Proton dark par défaut sur Mint 22) — à valider visuellement sur capture noVNC.

---

## 4. État actuel CapsuleOS (après passe #7)

| Zone | Implémentation | Fidélité VM |
|------|----------------|-------------|
| Slot fenêtre | `div.windowElement#firefox` sous `object#desktop` | OK structure |
| Titre fenêtre Capsule | `firefox.windowTitle` → « Navigateur Web » | **P0** → « Mozilla Firefox » |
| Chrome CSD | Barre `#windowHeader` Muffin au-dessus du chrome (pas de CSD onglets sur Mint) | **OK** (P0 corrigé — `mint` exclu de `supportsFirefoxGnomeChrome`) |
| Barre onglets + toolbar + favoris | Gabarit `firefox.html` + `firefox.base.css` | **P1** structure proche, détails Proton incomplets |
| Zone contenu | Page « CapsuleOS Navigateur » + iframe `os-lacapsule` | **CapsuleOnly** / pédagogie |
| Favoris simulés | Accueil, Localhost, La Capsule, os-lacapsule | **CapsuleOnly** (VM : favoris Mozilla / import) |
| Bandeau statut simulation | `data-browser-status` (masqué en skin Mint) | OK masqué ; absent sur VM |
| JS | `firefoxBrowser.js` — navigation simulée, pas d’historique réel | **P1** assumé |
| Skin | `firefox.skin.css` — palette sombre #1c1b22 / #2b2a33 | **P1** — approcher Proton + Mint-Y-Dark-Aqua, valider clair/sombre |
| Smoke | `smoke-mint-firefox.mjs` | CSD + favoris ; à adapter si retour barre titre séparée |

---

## 5. Matrice d’écarts classés

### P0 — bloquant fidélité visuelle / structure

1. ~~**Barre de titre**~~ — **fait** : `mint` exclu de `supportsFirefoxGnomeChrome` ; skin sans règles CSD.
2. ~~**Titre**~~ — **fait** : `firefox.windowTitle` → « Mozilla Firefox » dans `home/Debian/Mint/content/strings.json`.
3. ~~**Hiérarchie chrome**~~ — **fait** : `#windowHeader` → `#windowIframe` → `.mint-browser` (smoke `headerInTabs === false`).

### P1 — comportement ou UI secondaire

1. **Page d’accueil** : remplacer la page marketing « CapsuleOS Navigateur » par une **suggestion Mozilla** (tuiles, recherche) ou capture statique VM.
2. **Onglets** : gestion multi-onglets (liste, fermeture, actif) au moins visuelle.
3. **Boutons toolbar** : icônes Proton (SVG/mask) pour accueil, bibliothèque, menu — fin des caractères Unicode dans le HTML.
4. **Barre de favoris** : état masqué par défaut (comme profil neuf) ; entrées VM ou vide.
5. **Historique** : back/forward désactivés tant qu’il n’y a pas de pile — OK si message discret (pas bandeau simulation).
6. **Thème couleurs** : caler tokens sur capture VM (Proton 3 + contraste Mint-Y-Dark-Aqua).

### P2 — polish

1. Icône onglet : `firefox.png` Mint-Y (déjà en skin) vs favicon site.
2. Raccourcis clavier affichés dans tooltips (Ctrl+L, Ctrl+T) — optionnel.
3. Menu hamburger / extensions : coques vides ou « bientôt disponible ».

### CapsuleOnly (conserver)

- Favori **os-lacapsule** / iframe vers `CAPSULE_SITE_HOME`
- Redirection pédagogique barre d’adresse vers hub CapsuleOS
- Checklist / missions liées au navigateur

### P1 lab (déjà documenté)

- `compare-os-parity` étape Firefox focus fragile (multi-fenêtres `Navigator.firefox` sur VM)

---

## 6. Plan de reproduction recommandé

### Phase A — Collecte (VM)

```bash
# Inventaire Firefox dédié (JSON stdout)
ssh -i ~/.ssh/capsuleos-lab <lab-inventory:linux-mint-firefox> 'DISPLAY=:0 bash -s' \
  < root/tools/lab/vm-mint-firefox-inventory.sh > root/docs/inventaires/linux-mint-firefox-vm.json

# Capture visuelle (fenêtre active)
ssh -i ~/.ssh/capsuleos-lab <lab-inventory:linux-mint-firefox> \
  'DISPLAY=:0 gnome-screenshot -w -f /tmp/ff-win.png'
scp -i ~/.ssh/capsuleos-lab <lab-inventory:linux-mint-firefox>:/tmp/ff-win.png root/docs/inventaires/assets/mint-firefox-vm.png
```

Compléter par **noVNC** (comparaison côte à côte avec `home/Debian/Mint/index.html`) — voir [`contrib.md`](../../contrib.md) § comparaison VM.

### Phase B — Correctifs structure (P0)

1. `firefoxBrowser.js` : exclure `mint` de `supportsFirefoxGnomeChrome()` **ou** branche `decorateMintFirefoxWindow` no-op.
2. `firefox.skin.css` : supprimer règles `firefox-window--fedora` / `#windowHeader` dans tabsbar ; styler `#windowHeader` comme Nemo (Mint-Y-Dark-Aqua).
3. `strings-default.js` / `home/Debian/Mint/content/strings.json` : `firefox.windowTitle` = « Mozilla Firefox ».
4. Ajuster `smoke-mint-firefox.mjs` : `headerInTabs === false`, `#windowHeader` visible au-dessus de `.mint-browser__chrome`.

### Phase C — UI Proton (P1) — **fait**

1. Gabarit `firefox.html` : page **New Tab** (logo, recherche, raccourcis) ; barre favoris masquée par défaut.
2. Icônes toolbar Proton (masks CSS) : retour, avant, recharger, accueil, bibliothèque, étoile, menu.
3. **Multi-onglets** : création, activation, fermeture, libellé dynamique (`La Capsule` sur os-lacapsule).
4. Smoke `smoke-mint-firefox.mjs` étendu (new tab, 2 onglets, toggle favoris).

### Phase D — Gates

```bash
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
node usr/lib/capsuleos/tools/lab/smoke-mint-firefox.mjs
```

---

## 7. Commandes utiles

| Action | Commande |
|--------|----------|
| Collecte globale Mint | `node usr/lib/capsuleos/tools/lab/collect-mint-inventory.mjs --write-doc` |
| Inventaire Firefox | `root/tools/lab/vm-mint-firefox-inventory.sh` (SSH) |
| Brief agent | `node usr/lib/capsuleos/tools/print-agent-brief.mjs linux-mint` |
| Parité panel | `node usr/lib/capsuleos/tools/lab/compare-os-parity.mjs --id linux-mint --scenario panel-checklist` |

---

## 8. Synthèse

La VM Mint fournit un Firefox **151** packagé avec une politique **`browser.tabs.inTitlebar=0`** : la fidélité passe par une **barre de titre Cinnamon distincte**, puis le chrome Proton simulé. La passe #7 récente a appliqué le modèle **GNOME/Fedora (CSD dans les onglets)**, ce qui est un **écart P0** par rapport au ground truth.

La reproduction fidèle = corriger d’abord la **structure fenêtre**, puis rapprocher **Proton 151** (couleurs, icônes, new-tab), tout en gardant les **bridges pédagogiques CapsuleOS** (os-lacapsule) en **CapsuleOnly**.
