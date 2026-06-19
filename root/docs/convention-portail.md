# Convention — portail web CapsuleOS

> **Statut** : spécialisation plan maître (juin 2026)  
> **Contrats** : `etc/capsuleos/contracts/portal-*.json`  
> **Backlog** : plan maître §16 — **B13**

---

## 1. Rôle

Le portail est la **couche hôte** au-dessus du rootfs statique : entrée utilisateur, offres, comptes. Les bureaux simulés (`OS/`, `home/`, `mnt/`) restent **100 % statiques**.

| Entrée | Usage |
|--------|--------|
| `portal/index.php` | Production (PHP, auth) |
| `index.php` (racine) | Redirection vers `portal/index.php` |
| `index.html` (racine) | Développement local (statique, auth factice) |

---

## 2. Arborescence

| Chemin | Zone | Rôle |
|--------|------|------|
| **`portal/`** | Public PHP | Entrées HTTP (`index.php`, `login.php`, …) |
| `srv/capsuleos/portal/` | Hôte | Bootstrap, auth, SQLite, config |
| `usr/share/capsuleos/portal/views/` | Z1 | Partials HTML/PHP |
| `usr/share/capsuleos/themes/portal/` | Z1 | Styles portail |
| `etc/capsuleos/contracts/portal-*.json` | Z0 | Offres, entitlements, sécurité |
| `var/lib/capsuleos/portal/` | Runtime | SQLite, rate-limit (gitignoré) |

Les vues PHP utilisent `<base href="../">` pour résoudre assets (`usr/`, `OS/`, `sw.js`) depuis la racine du dépôt.

Helpers bootstrap : `portal_entry('login.php')` → `portal/login.php`, `portal_asset('usr/...')` → chemin racine.

**Interdit** : PHP ou logique auth dans `home/`, `OS/`, `usr/lib/capsuleos/shells/`.

---

## 3. Contrats

- `portal-offers.json` — formules Gratuit / Capsule+ (15 €/mois)
- `portal-entitlements.json` — niveaux `anonymous` / `registered` / `subscriber`, limites `osSession`, accès `mnt/`
- `portal-grades.json` — grades Utilisateur, Abonné, Créateur, Professeur, Élève
- `portal-gamification.json` — badges et courbe XP
- `portal-security.json` — sessions, CSRF, rate limit, headers CSP
- `portal-legal.json` — RGPD, création de compte, données bancaires, mentions légales

### Modèle d’accès (juin 2026)

| Offre | OS simulés | Parcours `mnt/` | Grades |
|-------|------------|-----------------|--------|
| Gratuit | Catalogue complet, **15 min / OS / jour**, magasins sans apps | Aucun | Utilisateur ou visiteur |
| Capsule+ | Illimité | Intégral + store | Abonné (+ Créateur / Professeur) |
| Classe | Illimité (OS/modules filtrés) | Modules professeur | Élève (progression sticky) |

Voir aussi [`parcours-pedagogique.md`](../../parcours-pedagogique.md) à la racine du dépôt.

Gate : `node usr/lib/capsuleos/tools/validate-portal-contracts.mjs`

---

## 4. Routes PHP (phase 1)

Toutes sous **`portal/`** :

| Route | Rôle |
|-------|------|
| `portal/index.php` | Portail |
| `portal/login.php` | Connexion |
| `portal/register.php` | Inscription |
| `portal/account.php` | Page utilisateur (profil modulaire par grade) |
| `portal/join-class.php` | Rejoindre une classe via invitation |
| `portal/api/account.php` | API paramètres compte |
| `portal/api/os-usage.php` | API quota OS |
| `portal/api/tickets.php` | API tickets support |
| `portal/api/classroom.php` | API gestion classe professeur |
| `portal/api/gamification.php` | API XP et badges |
| `portal/logout.php` | Déconnexion |
| `portal/subscribe.php` | Offre Capsule+ (paiement phase 2) |
| `portal/legal.php` | Informations légales & RGPD |

Configuration : copier `srv/capsuleos/portal/config.example.php` → `config.php` (hors git).

---

## 5. Serveur web (production)

```bash
make prod    # PHP + router — index.php / portail auth
make dev     # statique — index.html
make help    # PORT=8080 HOST=127.0.0.1
```

Génération URL accueil OS (`CAPSULE_PORTAL_SITE_HOME`) :

```bash
make site-home-dev   # ../../../index.html
make site-home-prod  # ../../../index.php
```

- `DirectoryIndex index.php index.html` — la racine redirige vers le portail
- PHP désactivé sous `usr/share/`, `mnt/`, `OS/`
- HTTPS obligatoire ; cookies session `Secure` en prod

---

## 6. Service Worker

Les routes `portal/*.php` sont **network-only** — voir `usr/lib/capsuleos/site/sw.js`.

---

## 7. Phase 2 (hors scope actuel)

- Stripe Checkout + webhooks
- Garde-fou session gratuite 15 min (overlay + compteur portail)
- Jetons signés pour montage `mnt/` sur façades abonnés

---

## 8. Références

- [convention-modules-mnt.md](convention-modules-mnt.md)
- [architecture-globale.md](architecture-globale.md)
- [plan-maitre-reproduction-os.md](plan-maitre-reproduction-os.md) §16 **B13**
