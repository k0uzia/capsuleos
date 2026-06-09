# Matrice toolbar Firefox — KDE neon VM ↔ CapsuleOS

> Campagne **v4 P1** · Inventaire VM : [`linux-kde-neon-firefox-vm.json`](linux-kde-neon-firefox-vm.json)  
> Captures : `vm-firefox.png` ↔ baseline `04-firefox.png` ↔ `capsule-discover` (shell)

| Zone | VM (Firefox 151 Proton) | CapsuleOS | Statut v4 |
|------|-------------------------|-----------|-----------|
| Titlebar Breeze | Séparée du chrome Proton (`browser.tabs.inTitlebar=0`) | `#windowHeader` Breeze + Proton sous-jacent | ✅ |
| Onglets | Barre claire Proton (vm-firefox.png) | `.capsule-browser__tabsbar` fond `#f9f9fb` | ✅ |
| Nouvel onglet | `+` | `[data-browser-action="new-tab"]` | ✅ smoke |
| Retour / Suivant | Flèches navigation | `back` / `forward` | ✅ smoke |
| Recharger | ↻ | `reload` | ✅ smoke |
| Accueil | 🏠 | `home` | ✅ smoke |
| Barre adresse | Champ URL Proton clair, bordure accent au focus | `[data-browser-address]` fond blanc | ✅ |
| Bouton Aller | Masqué (Proton) | `go` masqué (`display:none`) | ✅ smoke |
| Signets | Toggle barre | `toggle-bookmarks` | ✅ smoke |
| Menu ☰ | Proton app menu | `menu` + icône mask CSS | ✅ smoke |
| Page nouvel onglet | Logo + recherche | `[data-browser-newtab-input]` + logo | ✅ smoke |
| Multi-onglets | Onglets multiples | 2 onglets + bascule active | ✅ smoke |

## Gates

```bash
node usr/lib/capsuleos/tools/lab/smoke-kde-neon-firefox.mjs
node usr/lib/capsuleos/tools/lab/capture-clone-surfaces.mjs --id linux-kde-neon --compare
```

## Écarts résiduels (P2)

| Écart | Note |
|-------|------|
| Icônes toolbar pixel-perfect | Diff structurel acceptable (viewport 1280×800 vs 1211×756) |
| Menu Proton complet | Popover simulé partiel |
| `themes.kdeglobals` session | Collecte SSH batch vide — non bloquant |

## Verdict v4 P1

Toolbar Firefox **classée Vp** — Proton clair aligné `vm-firefox.png` · baseline `04-firefox` régénérée 2026-06-09.
