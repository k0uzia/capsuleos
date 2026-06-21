# Licence — CapsuleOS

## Logiciel du dépôt

**Copyright © 2020–2026 les contributeurs CapsuleOS**  
Contact : [info@noref.fr](mailto:info@noref.fr)

Le code source, la documentation technique et les outils de ce dépôt sont distribués sous **GNU General Public License version 3** (GPL-3.0).

- Texte intégral : fichier [`LICENSE`](LICENSE) à la racine du dépôt
- Résumé officiel : [https://www.gnu.org/licenses/gpl-3.0.html](https://www.gnu.org/licenses/gpl-3.0.html)

En contribuant, vous acceptez que vos apports soient licenciés sous les mêmes termes, conformément au [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) et à la [convention clean code](root/docs/convention-clean-code.md).

## Conformité REUSE / SPDX

Le dépôt suit la [specification REUSE 3](https://reuse.software/spec-3.0/) pour la traçabilité des licences :

| Élément | Emplacement |
|---------|-------------|
| Métadonnées paquet | [`REUSE.toml`](REUSE.toml) |
| Texte licence GPL | [`LICENSES/GPL-3.0-or-later`](LICENSES/GPL-3.0-or-later) |
| Gate CI | `node usr/lib/capsuleos/tools/validate-reuse.mjs` |

**Code et documentation CapsuleOS** (hors assets tiers) : `SPDX-License-Identifier: GPL-3.0-or-later` · copyright `2020-2026 les contributeurs CapsuleOS`.

Les fichiers **sans en-tête SPDX explicite** héritent de l’annotation agrégée dans `REUSE.toml`. Les nouveaux modules noyau (ex. accessibilité WCAG) doivent porter un en-tête explicite :

```javascript
// SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS
// SPDX-License-Identifier: GPL-3.0-or-later
```

```css
/* SPDX-FileCopyrightText: 2020-2026 les contributeurs CapsuleOS */
/* SPDX-License-Identifier: GPL-3.0-or-later */
```

**Hors périmètre REUSE** (exclus dans `REUSE.toml`) : `usr/share/capsuleos/assets/` (ground truth VM, marques), `node_modules/`.

## SBOM (CycloneDX)

Inventaire machine-readable des dépendances **npm lab** :

```bash
npm run sbom          # regénère var/lib/capsuleos/generated/sbom.cyclonedx.json
npm run sbom:check    # vérifie la fraîcheur vs package-lock.json
node usr/lib/capsuleos/tools/validate-sbom.mjs
```

Le runtime CapsuleOS (navigateur) n’a **aucune** dépendance npm ; voir [SECURITY.md](SECURITY.md).

## Assets tiers et marques

Les éléments suivants **ne sont pas** couverts par la licence du code CapsuleOS en tant que propriété du projet :

| Catégorie | Exemples | Statut |
|-----------|----------|--------|
| Logos et identités distro | Ubuntu, Rocky, Fedora, Mint, Windows, Apple… | Marques de leurs titulaires ; usage pédagogique documenté |
| Icônes / fonds clonés depuis VM | `usr/share/capsuleos/assets/images/vendors/` | Ground truth lab ; traçabilité `SOURCE-VM.txt` |
| Polices | Red Hat Text, Ubuntu, Noto… | Licences des fonderies respectives |
| Contenus pédagogiques embarqués | iframes, liens externes dans démos | Licences et conditions des sites tiers |

CapsuleOS vise la **reconnaissance** des identités techniques (voir [fondements-philosophiques.md](root/docs/fondements-philosophiques.md) §5.2), pas l’appropriation des marques.

## Simulation pédagogique

CapsuleOS **n’est pas** un environnement de production. Aucune garantie d’exhaustivité sécuritaire ou de conformité réglementaire n’est attachée à l’usage des bureaux simulés.
