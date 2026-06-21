# Sécurité — CapsuleOS

## Périmètre

CapsuleOS est une **simulation pédagogique statique** (HTML, CSS, JavaScript) exécutée dans le navigateur. Ce dépôt ne distribue **pas** un système d’exploitation exécutable ni un backend applicatif CapsuleOS en production.

**Dans le périmètre** (signalements utiles) :

- failles pouvant affecter un utilisateur qui ouvre le clone dans un navigateur (XSS, injection via contenu servi, fuite de données via scripts du dépôt) ;
- secrets ou identifiants commités par erreur dans le dépôt ;
- contournement documenté du modèle sandbox (accès FS réel, exécution privilégiée non prévue).

**Hors périmètre** :

- vulnérabilités des **VM lab** (Mint, Rocky, etc.) ou de leurs paquets upstream — à signaler aux éditeurs concernés ;
- comportement des **sites tiers** ou iframes embarqués dans les démos ;
- configuration TLS/certificats de l’**hébergeur mutualisé** (hors fichier [.htaccess](.htaccess) fourni).

Référence architecture : [root/docs/README.md](root/docs/README.md).

## Déploiement HTTP (Apache)

Le dépôt inclut un [.htaccess](.htaccess) à la racine pour les déploiements statiques (ex. `https://os.lacapsule.org`) :

- redirection HTTPS, en-têtes CSP / HSTS / Permissions-Policy ;
- blocage des chemins dev (`.git`, `node_modules`, inventaire lab) ;
- CORS limité aux origines `lacapsule.org` / `os.lacapsule.org`.

Après déploiement, vérifier dans le navigateur qu’aucune ressource CapsuleOS n’est bloquée par la CSP (console développeur).

## SBOM (CycloneDX)

Inventaire des **dépendances npm lab** (Playwright, sharp, pixelmatch, …) — **pas** des assets VM ni du runtime navigateur.

| Élément | Emplacement |
|---------|-------------|
| SBOM JSON | [`var/lib/capsuleos/generated/sbom.cyclonedx.json`](var/lib/capsuleos/generated/sbom.cyclonedx.json) |
| Empreinte sources | [`var/lib/capsuleos/generated/sbom.hash.json`](var/lib/capsuleos/generated/sbom.hash.json) |
| Génération | `npm run sbom` ou `node usr/lib/capsuleos/tools/generate-sbom.mjs` |
| Gate CI | `node usr/lib/capsuleos/tools/validate-sbom.mjs` (inclus dans `validate-all`) |

Le site statique servi en production **n’utilise pas** `node_modules` (bloqué par [.htaccess](.htaccess)). Le SBOM documente l’outillage de développement / smokes lab uniquement.

## Signaler une vulnérabilité

**Ne pas** ouvrir d’issue publique pour une faille de sécurité.

Envoyer un courriel à **info@noref.fr** avec :

- description du problème et impact estimé ;
- étapes de reproduction (URL, navigateur, commit ou tag si connu) ;
- pièce jointe ou lien vers un correctif suggéré (optionnel).

Les signalements sont traités de façon **confidentielle**, sur le même canal que le [code de conduite](CODE_OF_CONDUCT.md).

## Délais indicatifs

| Étape | Délai visé |
|-------|------------|
| Accusé de réception | 7 jours ouvrés |
| Évaluation initiale | 30 jours |
| Correctif ou décision documentée | selon gravité et disponibilité |

## Bonnes pratiques contributeurs

- ne pas committer `etc/capsuleos/lab-inventory.json`, tokens ou mots de passe (voir [.gitignore](.gitignore)) ;
- ne pas versionner `node_modules/` — `npm ci` après clone (gate `validate-git-security.mjs`) ;
- exécuter `node usr/lib/capsuleos/tools/validate-all.mjs` avant merge sur `main` ;
- respecter **R-PWD1** et **R-ASK1** pour les opérations lab (sudo, SSH) — voir [root/docs/logique-formelle.md](root/docs/logique-formelle.md).

## Hygiène Git (audit dépôt)

| Risque | Mesure |
|--------|--------|
| **Vol / supply chain** | `node_modules/` dans `.gitignore` + retrait du suivi Git (`git rm -r --cached node_modules`) |
| **Secrets lab** | `lab-inventory.json`, `git-push-token`, `.env`, clés `*.pem` / `id_*` gitignorés |
| **Cartographie réseau** | Inventaire réel **local uniquement** ; `lab-inventory.example.json` utilise des IP TEST-NET-3 (`203.0.113.x`) |
| **Exposition HTTP** | [.htaccess](.htaccess) bloque `.git`, `node_modules`, `lab-inventory.json`, scripts lab |
| **SBOM lab** | CycloneDX documente les deps npm dev — pas déployées en production |

Gate : `node usr/lib/capsuleos/tools/validate-git-security.mjs`

**Historique Git** : retirer un fichier du remote ne l’efface pas des commits passés. En cas de fuite avérée (token, clé), rotation immédiate + `git filter-repo` ou support GitHub secret scanning.

## Versions supportées

Seule la branche **`main`** à jour fait l’objet de correctifs de sécurité. Les clones ou forks non maintenus par l’équipe CapsuleOS ne sont pas couverts.
