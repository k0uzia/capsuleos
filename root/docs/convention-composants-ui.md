# Convention — composants UI documentés (tous environnements de bureau)

> **Statut** : obligatoire (juin 2026) — cadre transversal pour acquisition graphique VM, reproduction fidèle et anti-redondance.  
> **Modèle initial** : [convention-composants-gnome.md](convention-composants-gnome.md) · contrat `etc/capsuleos/contracts/ui-components-gnome.json`

Complète : [procedure-apps-catalog.md](procedure-apps-catalog.md) · [convention-fidelite-visuelle.md](convention-fidelite-visuelle.md) · [gnome-hig-ressources.md](gnome-hig-ressources.md)

---

## 1. Objectif

Éviter que chaque application ou chaque distribution soit clonée **en silo**. À la place :

1. **Lire** les ressources officielles du bureau (HIG, Components, docs distro).
2. **Découper** l’interface en **composants réutilisables** (N1).
3. **Assembler** les apps par défaut (N2) à partir de ces composants.
4. **Acquérir** sur VM par composant et par état UI, pas seulement par capture plein écran.
5. **Étendre** toolkit par toolkit (GNOME → Cinnamon → KDE → …).

**Périmètre actuel** : **applications installées par défaut** sur la VM de référence — pas les apps tierces optionnelles, pas encore le shell complet (panel, overview) sauf mention pour extension.

---

## 2. Trois niveaux (tous toolkits)

| Niveau | Nom | Emplacement CapsuleOS | Documenté dans |
|--------|-----|----------------------|----------------|
| **N0** | Primitives (tokens, typo, palette) | `usr/share/capsuleos/themes/clusters/toolkit-*/` | Contrat toolkit + [convention-fidelite-visuelle.md](convention-fidelite-visuelle.md) |
| **N1** | Composants plateforme | `*.base.css`, sélecteurs gabarits | `ui-components-<toolkit>.json` → `components` |
| **N2** | Compositions (slots apps) | `usr/share/capsuleos/linux/apps/*.html` + `style/apps/*.skin.css` | `ui-components-<toolkit>.json` → `appCompositions` |

**Règle** : l’API publique reste les **variables CSS** ([manifeste-noyau.md](manifeste-noyau.md)) — les composants documentent structure + tokens, pas une lib JS parallèle.

---

## 3. Sources officielles (par toolkit)

| Toolkit | Sources web obligatoires | Contrat CapsuleOS |
|---------|-------------------------|-------------------|
| **GNOME** (modèle) | [HIG](https://developer.gnome.org/hig/) · [Components](https://developer.gnome.org/components/) · [apps.gnome.org](https://apps.gnome.org/fr/) · libadwaita CSS | `ui-components-gnome.json` |
| **Cinnamon** | [Cinnamon](https://projects.linuxmint.com/cinnamon/) · Nemo · [convention-composants-cinnamon.md](convention-composants-cinnamon.md) | `ui-components-cinnamon.json` *(squelette)* |
| **KDE** | [HIG Plasma](https://develop.kde.org/hig/) · Dolphin | `ui-components-kde.json` *(à créer)* |
| **COSMIC** | System76 COSMIC docs | `ui-components-cosmic.json` *(à créer)* |

Inventaire HIG crawlé : [`inventaires/gnome-hig-resources.json`](inventaires/gnome-hig-resources.json).

---

## 4. Méthode d’acquisition VM (apps par défaut)

Pour chaque slot **N2** du contrat toolkit :

```text
1. Ouvrir l’app sur VM ground truth (référence : linux-rocky pour GNOME design)
2. Parcourir acquisitionOrder du contrat (vues / panneaux / états)
3. Pour chaque vue : identifier les composants N1 visibles
4. Capturer + noter mesures (px/rem, couleurs, polices) → inventaire visuel
5. Comparer CapsuleOS au niveau composant (pas seulement fenêtre entière)
6. Ajuster tokens skin vendor — pas fork gabarit Z1 sauf PR intégrateur
```

Chaîne formelle existante : **AppV → AppC → AppVv → AppVp** ([procedure-apps-replication-formelle.md](procedure-apps-replication-formelle.md)).

Le contrat composants **enrichit** AppVv : chaque capture est étiquetée `composantId + état`.

---

## 5. Lien catalogue apps

| Artefact | Rôle |
|----------|------|
| `apps-catalog.json` | Quelles apps **sur cette distro** (`registryOverrides`) |
| `ui-components-<toolkit>.json` | Comment **reproduire** chaque slot (composition N1) |

Un même slot `calculator` sert Rocky, Fedora, Ubuntu : **une composition**, skins dérivés via `toolkit-gnome/pack.json`.

```bash
node usr/lib/capsuleos/tools/lab/collect-vm-apps-inventory.mjs --id linux-rocky --write --ssh
node usr/lib/capsuleos/tools/lab/generate-apps-catalog.mjs --id linux-rocky --write
node usr/lib/capsuleos/tools/validate-ui-components-gnome.mjs
```

---

## 6. Extension progressive

| Phase | Livrable |
|-------|----------|
| **1 — GNOME modèle** | `ui-components-gnome.json` + convention GNOME + validateur |
| **2 — Campagne VM Rocky** | Inventaire composant par slot P0/P1 |
| **3 — Cinnamon** | Contrat miroir (Nemo, menu Cinnamon, boxed lists Mint) |
| **4 — KDE** | Contrat Dolphin / Kirigami |
| **5 — Shell surfaces** | Composants panel, overview, tray (hors scope apps actuel) |

---

## 7. Anti-patterns

| Interdit | Alternative |
|----------|-------------|
| Nouveau `*.html` app sans entrée `appCompositions` | Ajouter au contrat toolkit d’abord |
| Dupliquer headerbar CSD par app | Réutiliser `gnome.adw-header-bar` + tokens |
| Captures VM sans étiquette composant | `acquisitionOrder` + `states` du contrat |
| Composants JS framework dans `home/` | Tokens CSS + gabarit Z1 |
| Ignorer HIG au profit d’intuition | Lien `higUrl` obligatoire par composant N1 |

---

## 8. Validation

```bash
node usr/lib/capsuleos/tools/validate-ui-components-gnome.mjs
node usr/lib/capsuleos/tools/validate-ui-contracts-all.mjs   # inclus
```

---

## 9. Documents liés

| Document | Rôle |
|----------|------|
| [convention-composants-gnome.md](convention-composants-gnome.md) | Détail modèle GNOME |
| [convention-accueil-os.md](convention-accueil-os.md) | Espace contributeur distro |
| [procedure-apps-catalog.md](procedure-apps-catalog.md) | Prédicats AppΣ |
| Skill `gnome-hig-replication` | Routage pages HIG |

---

*Un toolkit documenté = une grammaire visuelle partagée ; une distro = une dialecte tokens sur la même grammaire.*
