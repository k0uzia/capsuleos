# Analyse Update Manager — VM Linux Mint 22.3 → CapsuleOS

**Objectif** : ground truth pour le slot `update_manager` dans `home/Debian/Mint/`.

**Collecte** : SSH `capsule@192.168.1.146` · [`vm-mint-update-manager-inventory.sh`](../../tools/lab/vm-mint-update-manager-inventory.sh) · JSON [`linux-mint-update-manager-vm.json`](linux-mint-update-manager-vm.json) · campagne 2026-06-05.

---

## 1. Identité VM

| Élément | VM |
|---------|-----|
| Paquet | **mintupdate 7.1.4** |
| Binaire | `/usr/bin/mintupdate` |
| `.desktop` | `mintupdate.desktop` — **Gestionnaire de mise à jour** |
| WM class | `mintUpdate.py.MintUpdate.py` |
| UI | GTK3 + Glade (`/usr/share/linuxmint/mintupdate/main.ui`) |
| Géométrie | **790×570** (tokens `--win-update_manager-*` calés VM) |

---

## 2. Anatomie visuelle

### Écran d'accueil (`show-welcome-page` gsettings)

Affiché tant que `show-welcome-page=true` :

- Menubar : Fichier · Édition · Affichage · Aide
- Toolbar : Effacer · Tout sélectionner · Actualiser · Installer les mises à jour
- Corps : **Bienvenue dans le gestionnaire de mise à jour** + 3 blocs (sécurité, logicielles, instantanés Timeshift)
- Pied : **Aide** · **Valider** (`button_welcome_finish`)

### Vue principale (après Valider)

État observé sur la VM lab (système à jour) :

- Bannière bleue miroir : « Voulez-vous utiliser un miroir de dépôts local ? » (Oui / Non)
- Centre : coche + **Votre système est à jour**
- Toolbar : seul **Actualiser** actif ; Effacer / Tout sélectionner / Installer grisés
- Pas de liste ni onglets Renseignements tant qu'il n'y a pas de mises à jour

### Vue avec mises à jour (référence CapsuleOS pédagogique)

- Colonnes : Type · Mise à niveau (case) · Nom · Nouvelle version
- Onglets bas : Renseignements · Paquets · Journal des changements
- Barre statut : « N mises à jour sont sélectionnées (taille) »

---

## 3. Implémentation CapsuleOS (#9)

| Zone | Fidélité |
|------|----------|
| Écran d'accueil + Valider | **P0** — `localStorage` `capsule-mintupdate-welcome-dismissed` |
| État « système à jour » | **P0** — défaut après Valider (comme VM lab) |
| Bannière miroir | **P1** — `#4aa7d9`, dismiss Oui/Non |
| Géométrie fenêtre | **P0** — 790×570 (smoke `dims.win`) |
| Liste simulée 129 MAJ | **P1** — via Actualiser (pédagogie, VM lab à jour) |
| Installation simulée | **P1** — retour état à jour + badge tray |

---

## 4. Commandes lab

```bash
ssh capsule@192.168.1.146 'DISPLAY=:0 bash -s' < root/tools/lab/vm-mint-update-manager-inventory.sh
node usr/lib/capsuleos/tools/lab/smoke-mint-update-manager.mjs
node usr/lib/capsuleos/tools/validate-all.mjs
```
