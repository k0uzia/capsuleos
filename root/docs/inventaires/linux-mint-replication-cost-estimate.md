# Estimation coût — clone VM → CapsuleOS (référence linux-mint)

> **Objectif** : avertir les contributeurs **avant** de lancer une campagne de réplique exacte.  
> Référence : campagne `mint-v2-exact-vm` (2026-06-08) · ground truth [`linux-mint-vm.json`](linux-mint-vm.json) · état [`linux-mint-replication-state.json`](linux-mint-replication-state.json).

Voir aussi : [convention-reproduction-os.md](../convention-reproduction-os.md) · [procedure-clonage-os-depuis-vm.md](../procedure-clonage-os-depuis-vm.md)

---

## 1. Synthèse exécutive

| Métrique | Ordre de grandeur |
|----------|-------------------|
| **Durée totale** (1 agent autonome, réplique **exacte**) | **80–200 h** humain/agent |
| **Durée MVP** (P0 shell + 17 apps surface + smokes) | **25–45 h** |
| **Coût agent** (Cursor Auto, ~\$0,05–0,15 / 1k tokens out) | **\$150–800** selon profondeur apps |
| **Infra VM lab** | **\$5–30 / mois** (Proxmox local ≈ 0 € marginal) |
| **Apps catalogue complètes** (101 entrées menu) | **+60–120 h** au-delà du MVP |

**Coût réel observé (campagne Mint v2, partiel)** : P0+P1 shell clôturés (~2 j agent) · 14/101 apps OK ou partielles · drift manifest ~148 · validate-all H2 rouge (Ubuntu overview, hors Mint) corrigé en parallèle session 2026-06-08.

---

## 2. Temps par phase (palliers P0→P5)

Estimations pour **une** distro P0 type Cinnamon/Mint, VM SSH disponible, registre déjà actif.

| Pallier | Contenu | Temps humain/agent | Gates |
|---------|---------|-------------------|-------|
| **P0** | Inventaire VM, `linux-mint-vm.json`, baseline validate-all, ManΣ assets | **4–8 h** | `collect-mint-inventory.mjs`, `validate-all`, manifest |
| **P1** | Shell : panel, WM, tray, favoris, grouped-window-list, tokens Mint-Y | **8–16 h** | `run-capsule-panel-browser`, `compare-os-parity panel-checklist` |
| **P2** | Matrice VΣ états UI (menus, popovers, modales) | **6–12 h** | `run-ui-state-effects-pass.mjs`, burst VM |
| **P3** | 17 surfaces VM (panel, favoris, menu P0) | **12–25 h** | 1 smoke / app surface |
| **P4** | Catalogue 101 apps menu | **60–120 h** | 1 app / passe · ~1–2 h / app fidèle |
| **P5** | Clôture D=0, drift=0, CapsuleOnly=0, validate-all vert | **4–10 h** | `validate-all`, sync vues, doc état |

**Règle empirique P4** : ~**1,5 h / application** (inventaire VM + gabarit HTML + JS + skin CSS + smoke Playwright) pour fidélité P0 ; ~**0,5 h** si slot partagé noyau déjà prêt (ex. GNOME Calculator).

---

## 3. Coût infra & collecte

| Poste | Détail | Coût |
|-------|--------|------|
| **VM lab** | 1 VM Mint 22.x, 4 vCPU, 4–8 Go RAM, 40 Go disque | Proxmox local : **0 €** · cloud : **5–30 €/mois** |
| **Stockage assets** | ~150–250 fichiers vendor (ManΣ Mint : 157 staging) | **< 50 Mo** dans le dépôt |
| **Bande passante collecte** | SSH inventaire + pull icônes (`pull-vm-assets.sh`) | **< 500 Mo** / campagne |
| **Playwright / smokes** | Chromium headless local | **0 €** (deps déjà dans le lab) |
| **noVNC / comparaison visuelle** | Secours humain (certificat Proxmox, focus canvas) | Temps humain **non automatisé** |

---

## 4. Coût token / agent IA

Ordres de grandeur pour un agent Cursor (Auto) en mode autonome multi-heures :

| Activity | Tokens (est.) | Coût USD (fourchette) |
|----------|---------------|------------------------|
| Onboarding + inventaire + 1 app (#14 mintinstall) | 200k–600k | **\$15–60** |
| Pallier P1 shell complet | 400k–1M | **\$30–100** |
| Catalogue 101 apps (1 passe / app) | 5M–15M | **\$200–600** |
| validate-all / fix régressions transverses | 500k–2M | **\$40–150** |

**Facteurs multiplicateurs** : VM SSH indisponible (+30–50 %) · pas de ManΣ assets (+20 %) · fork noyau interdit mais tenté (+dette) · H2 rouge non Mint (+2–4 h par session).

---

## 5. Checklist prérequis contributeur

Avant d’engager une réplique **exacte** (zéro écart clôture) :

- [ ] VM modèle **stable** (snapshot) · SSH `BatchMode` OK · `etc/capsuleos/lab-inventory.json` local (gitignoré)
- [ ] `validate-all.mjs` **vert** baseline (ou dette hors zone documentée)
- [ ] Brief : `node usr/lib/capsuleos/tools/print-agent-brief.mjs <registryId>`
- [ ] Convention lue : [agent-validation-discipline.md](../agent-validation-discipline.md)
- [ ] Token push : `etc/capsuleos/git-push-token` · hooks `install-git-hooks.sh`
- [ ] Budget temps **≥ 25 h** pour MVP surface, **≥ 100 h** pour catalogue complet
- [ ] Accord équipe : **CapsuleOnly interdit** en clôture · pas d’emprunt cross-vendor assets
- [ ] Plan de commits : **1 commit + push / pallier** · `sync-linux-skin-closure.mjs` + `sync-all-views.mjs` avant push

---

## 6. Coût réel mesurable — campagne Mint v2 (2026-06-08)

| Indicateur | Valeur session | Commentaire |
|------------|----------------|-------------|
| Palliers clôturés | P0, P1 | commit `c3a3a00` |
| P2 en cours | Matrice VΣ bootstrap 8 surfaces | |
| Apps OK catalogue | **14/101** (post #14 mintinstall) | +1 slot dédié Logithèque |
| Panel VM checklist | **4/6** | Firefox focus / minimize — P1 lab |
| manifestDrift | **148** → cible 0 (P5) | |
| validate-all H2 | rouge → **corrigé** (overview Ubuntu, 11 assets) | hors périmètre Mint mais bloquant merge |
| SSH VM | **OK** `capsule@192.168.1.146` | collecte fraîche ~2 s |

**Leçons** :
1. Séparer **mintinstall** et **update_manager** tôt (évite dette menu/favoris).
2. Traiter validate-all **transverse** dès H2 baseline, pas en fin de campagne.
3. Documenter coût **par app** dans `linux-mint-apps-alphabetique.md` (statut ✅/🔶/⬜).

---

## 7. Mise à jour

Mettre à jour ce document à chaque **clôture pallier** avec durée réelle (commits, timestamps `replication-state.json`).
