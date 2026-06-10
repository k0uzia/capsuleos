# Point d'étape CapsuleOS — juin 2026

> Audit transversal post-campagne Alma **C11–C30** · date : **10 juin 2026**  
> Gate baseline : `node usr/lib/capsuleos/tools/validate-all.mjs` → **exit 0**

---

## 1. AlmaLinux GNOME — bilan

| Indicateur | Valeur |
|------------|--------|
| **Π priority** | **96** (`linux-alma-parity-index.json`) |
| **Π étendu** | **92** (15 slots apps documentés) |
| **Overview scénarios** | **15/15** câblés (audit `audit-gnome-overview-scenarios.mjs --id linux-alma`) |
| **Contrats scénarios GNOME** | **17/17** (`gnome-user-scenarios-index.json`, backlog `[]`) |
| **Campagnes C26–C30** | Nautilus · Firefox · Ptyxis · LibreWriter · Checklist — statut `ok` |
| **VM lab** | `capsule@192.168.122.199` · skin dérivé `linux-rocky` · `#alma` |

Le moteur structurel `run-clone-cycle.mjs` reste sur le modèle **C0–C10** (Π structurel) ; les cycles **C15–C30** relèvent de la couche **ScΣ** (scénarios pédagogiques GNOME), distincte mais complémentaire.

---

## 2. Classification apps singulières — pattern « une fois pour tous les OS »

### 2.1 Trois couches

| Couche | Où | Rôle |
|--------|-----|------|
| **Noyau / toolkit** | `apps-catalog.json` → `toolkits.<id>.slotSpecs` | Slot logique, `template`, `chromeProvider`, `functionalDepth` — **défini une fois par toolkit** |
| **Vendor / distro** | `apps-catalog.json` → `registryOverrides.<registryId>` | Mapping `.desktop` VM → slot, `statut`, `placement`, `priorite`, `capsuleOnly`, `notOnVmOverview` |
| **Pédagogie Capsule-only** | slot `checklist` · `profile` · certains `screenshot` | Jamais mappé sur une app VM ; contrat scénarios dédié |

Branchements vérifiés : `contentLoader` → gabarits embed · `slot-variant-wiring` (9 profils) · chrome providers GNOME (21) · grilles overview (`audit-gnome-overview-scenarios`).

### 2.2 Tableau apps singulières (GNOME RHEL + dérivés)

| Slot CapsuleOS | Template toolkit | chromeProvider | functionalDepth | OS couverts (registryOverrides) | Contrat scénarios |
|----------------|------------------|----------------|-----------------|----------------------------------|-------------------|
| `nemo` | `nemo-gnome` | `nemo-gnome` | full | rocky, alma, fedora, ubuntu | `nautilus-user-scenarios.json` (C26) |
| `firefox` | `firefox.html` | `firefox-gnome` | partial | idem | `firefox-user-scenarios.json` (C27) |
| `terminal` | `terminal.html` | `terminal-gnome` | full | idem (Ptyxis VM) | `terminal-user-scenarios.json` (C28) |
| `themes` | `themes_gnome.html` | `libadwaita-gnome` | full | idem | `themes-user-scenarios.json` (C18) |
| `update_manager` | `update_manager_gnome.html` | `libadwaita-gnome` | partial | rocky, alma, fedora · ubuntu → variant `_ubuntu` | `software-user-scenarios.json` (C15) |
| `text_editor` | `text_editor.html` | `libadwaita-gnome` | full | idem | `text-editor-user-scenarios.json` (C16) |
| `calculator` | `calculator.html` | `libadwaita-gnome` | full | idem | `calculator-user-scenarios.json` (C17) |
| `clocks` | `clocks.html` | `libadwaita-gnome` | partial | rocky, alma, fedora | `clocks-user-scenarios.json` (C19) |
| `calendar` | `calendar.html` | `libadwaita-gnome` | partial | rocky (simulé), fedora, alma dash | `calendar-user-scenarios.json` (C20) |
| `baobab` | `baobab.html` | `libadwaita-gnome` | partial | rocky, alma, fedora | `baobab-user-scenarios.json` (C24) |
| `tour` | `tour.html` | `libadwaita-gnome` | partial | idem | `tour-user-scenarios.json` (C24) |
| `snapshot` | `snapshot.html` | `libadwaita-gnome` | partial | idem | `snapshot-user-scenarios.json` (C25) |
| `characters` | `characters.html` | `libadwaita-gnome` | partial | idem | `characters-user-scenarios.json` (C25) |
| `system_monitor` | `system_monitor.html` | `libadwaita-gnome` | partial | idem | `system-monitor-user-scenarios.json` (C25) |
| `screenshot` | `screenshot.html` | `libadwaita-gnome` | partial | rocky, alma (Capsule-only el10) | `screenshot-user-scenarios.json` (C25) |
| `librewriter` | `librewriter.html` | `libadwaita-gnome` | partial | rocky, fedora, alma · ubuntu (simulé) · **≠** `text_editor` | `librewriter-user-scenarios.json` (C29) |
| `checklist` | `checklist.html` | `libadwaita-gnome` | **capsuleOnly** | tous GNOME | `checklist-user-scenarios.json` (C30) |

**Note sémantique** : le slot `nemo` porte le gabarit **Nautilus** sur GNOME et **Nemo** sur Cinnamon (`toolkits.cinnamon.slotSpecs.nemo` → `nemo.html`). Ne pas confondre label VM et identifiant slot CapsuleOS.

### 2.3 Cinnamon (Mint P0)

| Slot | Template | chromeProvider | OS | Contrat scénarios GNOME |
|------|----------|----------------|-----|-------------------------|
| `nemo` | `nemo.html` | `cinnamon` | mint | N/A — campagne crédibilité v3 (`app-fidelity-scenarios.json`) |
| `themes` | `cinnamon_settings.html` | `cinnamon` | mint | idem |
| `update_manager` | `update_manager.html` | `cinnamon` | mint | idem |

---

## 3. Écarts restants (honnêtes)

| Écart | Sévérité | Détail |
|-------|----------|--------|
| **Vc VM** | P1 | D-Bus `Shell.Screenshot` AccessDenied — captures VM pixel-perfect bloquées (Alma, Rocky Paramètres) |
| **Mint `registryOverrides`** | P1 | Absent de `apps-catalog.json` → `smoke-apps-snapshot.mjs --id linux-mint` échoue ; catalogue généré (`linux-mint-apps-catalog.json`) existe mais pas le contrat machine |
| **LibreOffice absent VM RL10** | P2 | `libreoffice-writer` `onVm: false` · slot `librewriter` simulé · statut `partiel` Rocky/Fedora |
| **Rocky overview P1** | P2 | `visionneur_images`, `visionneur_pdf` sans scénarios (28/30 câblés) |
| **Clone cycle Alma** | info | `run-clone-cycle.mjs --status` affiche C0 — normal : campagne scénarios C15–C30 hors moteur C0–C10 |

---

## 4. Roadmap actualisée — prochaines priorités

| Priorité | Objectif | Gate / artefact |
|----------|----------|-----------------|
| **P1** | Réplication scénarios Alma → Rocky / Fedora / Ubuntu | smokes `--id` + audit overview par vendor |
| **P1** | `registryOverrides.linux-mint` dans `apps-catalog.json` | `smoke-apps-snapshot`, `AppΣ` Mint |
| **P1** | Captures VM (Vc) — session GDM locale ou fix D-Bus | inventaires `captures/` |
| **P2** | Scénarios Loupe / Papers Rocky | contrats P1 overview |
| **P2** | Nouveaux OS wave 5+ (`linux-anduinos`, `linux-popos`) | `run-capsule-pipeline.mjs` |
| **P3** | Extension KDE catalogue strict | `registryOverrides` kde-neon |

Documents vision (non exécutifs) : [roadmap.md](roadmap.md) · exécution : [plan-maitre-reproduction-os.md](plan-maitre-reproduction-os.md).

---

## 5. Intégrité noyau multicouche — verdict gates

| Gate | Résultat |
|------|----------|
| `validate-all.mjs` | ✅ exit 0 · **17 contrats** ScAll |
| `validate-slot-variant-wiring.mjs` | ✅ 9 profils actifs |
| `validate-toolkit-chrome-isolation.mjs` | ✅ 9 profils · 4 hubs chrome |
| `audit-data-links.mjs` | ✅ 8 skins · 64 gabarits embed |
| `validate-linux-facades.mjs` | ✅ façades ↔ `home/` |
| `audit-gnome-overview-scenarios.mjs --id linux-alma` | ✅ 23/23 · gaps P0 = 0 |
| `audit-gnome-overview-scenarios.mjs --id linux-rocky` | 🟡 28/30 · Loupe/Papers sans scénarios |

Alignement arborescence : `usr/lib/capsuleos/` (common, shells, core) · `usr/share/capsuleos/` · `OS/linux/kernel/` · `var/lib/capsuleos/generated/` · `home/` — conforme [arborescence.md](arborescence.md) · **57 entrées** registre.

---

## 6. Docs corrigés (cette passe)

| Fichier | Correction |
|---------|------------|
| `contrib.md` | 12 → **17 contrats** · Alma **C0–C30** |
| `parcours-agent.md` | idem · overview **15/15** |
| `inventaire-parite-alma.md` | en-tête campagne C30 |
| `procedure-lab-linux-alma-gnome.md` | cycles C26–C30 · backlog clôturé |
| `roadmap.md` | Alma ~90 % · jalons juin 2026 |
| `arborescence.md` | 52 → **57** entrées registre |

---

*Généré lors de l'audit transversal juin 2026 — ne pas utiliser comme ordre d'exécution agent (voir plan maître).*
