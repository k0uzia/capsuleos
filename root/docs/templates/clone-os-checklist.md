# Checklist — clonage OS depuis VM

Procédure détaillée : [`procedure-clonage-os-depuis-vm.md`](../procedure-clonage-os-depuis-vm.md)

**OS cible** : `registryId` = _______________ · **Vendor** = _______________ · **Toolkit** = _______________

---

## Phase 0 — Prérequis

- [ ] VM accessible en SSH (`lab-inventory.json` à jour)
- [ ] Session graphique `:0` active sur la VM
- [ ] Snapshot « clean boot » ou état documenté
- [ ] `python3 -m http.server 5500` sur le dépôt CapsuleOS
- [ ] `node usr/lib/capsuleos/tools/validate-all.mjs` → exit 0 (baseline)
- [ ] `print-agent-brief.mjs <id>` consulté

## Phase 1 — Discovery

- [ ] Inventaire VM collecté → `root/docs/inventaires/<registryId>-vm.json`
- [ ] **Audit profond** → `root/docs/inventaires/<registryId>-deep-audit.json` ([procedure-audit-vm-profonde.md](../procedure-audit-vm-profonde.md))
- [ ] Phase static : `node usr/lib/capsuleos/tools/lab/collect-vm-deep-audit.mjs --id <registryId> --phase static --write-doc`
- [ ] Matrice interactions + menus contextuels + bureaux virtuels documentés
- [ ] Animations / raccourcis / assets catalogués dans le deep-audit
- [ ] Rapport parité initialisé → `root/docs/inventaire-parite-<vendor>.md`
- [ ] Écarts classés P0 / P1 / P2 / CapsuleOnly

## Phase 2 — Catalogue CapsuleOS

- [ ] Entrée `os-registry.json` + profil `etc/capsuleos/profiles/<id>.json`
- [ ] `skin.profile.json` (façade + home)
- [ ] Façade `OS/.../index.html` avec `<base href>` vers le skin (pas de HTML dupliqué)
- [ ] `profile-data.js` : version = VM

## Phase 3 — Assets

- [ ] Fond d’écran dans `assets/images/vendors/<vendor>/`
- [ ] Icônes panel/bureau dans `vendors/<vendor>/panel/` (SCP VM si besoin)
- [ ] Références `./assets/...` dans le skin
- [ ] `validate-asset-zones.mjs` OK

## Phase 4 — Shell, panel, effets

- [ ] Logique panel dans le **noyau** toolkit (pas de fork `contentLoader`)
- [ ] Surcouches CSS/JS skin uniquement si nécessaire
- [ ] `run-capsule-panel-browser.mjs` → checklist 6/6 (ou P1 documenté)
- [ ] Tray aligné sur inventaire (visuel minimum P1)

## Phase 5 — Applications

- [ ] Mapping `.desktop` VM → slots `data-link`
- [ ] Favoris bureau / menu cohérents avec l’inventaire
- [ ] `build-linux-embed.mjs` si gabarits touchés
- [ ] Smoke : ouverture apps P0 depuis panel

## Phase 6 — Système de fichiers pédagogique

- [ ] `generate-public-manifest.mjs` si explorateur / home public touché
- [ ] Sidebar Nemo (Documents, etc.) cohérente
- [ ] Aucun média hors zones autorisées

## Phase 7 — Vérification et clôture

- [ ] Inventaire / rapport parité rafraîchis
- [ ] `compare-os-parity.mjs --id <registryId> --scenario panel-checklist`
- [ ] `validate-all.mjs` → exit 0
- [ ] `print-agent-brief.mjs <id> --write` (section inventaire VM)
- [ ] Écarts P1/P2 à jour dans le rapport parité

---

**Référence modèle** : annexe A de la procédure ([`linux-mint`](../procedure-clonage-os-depuis-vm.md#annexe-a--référence-linux-mint-modèle))
