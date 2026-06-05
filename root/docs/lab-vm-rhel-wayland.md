# Lab VM — familles RHEL (Rocky, Alma, Fedora) et Wayland

Guide pour connecter une VM **virt-manager / libvirt** (NAT `192.168.122.x`) au pipeline CapsuleOS : SSH, `wmctrl`, inventaire lab, clonage `linux-rocky` et futures entrées **Red Hat**.

**GNOME** : l’explorateur VM est **Nautilus** ; le slot CapsuleOS reste **`nemo`** (gabarit partagé). Voir [`inventaires/linux-gnome-capsule-slots.md`](inventaires/linux-gnome-capsule-slots.md).

**Coque** : pas de dock latéral permanent (modèle Ubuntu/Unity) — favoris via **Aperçu** uniquement, comme Fedora (`#tableau` masqué). Template Fichiers : **`nemo-gnome`** + CSS `nautilus.skin.css`.

**Assets VM (obligatoire)** : [`convention-assets-depuis-vm.md`](convention-assets-depuis-vm.md) — `bash root/tools/lab/pull-vm-assets.sh --id linux-rocky`.

**Documents liés** : [procedure-controle-distributions-reelles.md](procedure-controle-distributions-reelles.md) · [procedure-clonage-os-depuis-vm.md](procedure-clonage-os-depuis-vm.md) · [`etc/capsuleos/lab-inventory.example.json`](../../etc/capsuleos/lab-inventory.example.json)

---

## 1. Principe

| Canal | Usage |
|-------|--------|
| **SSH + clé** | Automatisation agent (`lab-ssh.mjs`, sonde, inventaires) |
| **DISPLAY + XAUTHORITY** | Commandes X11 (`wmctrl`, `xprop`) via **Xwayland** sous GNOME Wayland |
| **virt-manager / SPICE** | Contrôle humain, captures, préparation d’état |
| **CapsuleOS HTTP** | `python3 -m http.server 5500` sur l’hôte Cursor |

Sur **GNOME Wayland** (défaut Rocky 10 / Fedora récent), `export DISPLAY=:0` **seul** échoue (`Cannot open display`, `Authorization required…`). Il faut le cookie Mutter :

```bash
export DISPLAY=:0
export XAUTHORITY=$(ls /run/user/$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1)
wmctrl -l
```

Le nom du fichier `.mutter-Xwaylandauth.*` **change à chaque session graphique** — ne pas le figer dans un script permanent sans découverte dynamique.

---

## 2. Prérequis VM (Rocky / Alma / RHEL-like)

### 2.1 Installation paquets

```bash
sudo dnf install -y openssh-server
sudo systemctl enable --now sshd
sudo /usr/bin/crb enable
sudo dnf install -y epel-release
sudo dnf install -y wmctrl
```

| Paquet | Rocky 10 (el10) | Notes |
|--------|-----------------|--------|
| `wmctrl` | EPEL (+ CRB recommandé) | Liste fenêtres Xwayland |
| `xdotool` | **Non disponible en dnf el10** | `install-xdotool-el.sh` (sudo) ou `deploy-xdotool-via-host.sh` depuis l'hôte lab |
| Sonde GNOME | `~/capsuleos-lab/os-probe-gnome.sh` | JSON `toolkit: gnome` — slots `nemo` / `firefox` / `terminal` (Nautilus, Ptyxis) |
| `xprop` | Souvent déjà installé (`xorg-x11-*`) | `dnf provides '/usr/bin/xprop'` |
| `python3` | BaseOS | Inventaires scripts |

**Ne pas** accepter l’installation interactive « command not found » (PackageKit) sans `sudo` — utiliser uniquement `sudo dnf install -y …`.

### 2.2 Clé SSH (hôte Cursor)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/capsuleos-lab -N ""
ssh-copy-id -i ~/.ssh/capsuleos-lab.pub capsule@<IP_VM>
```

IP typique libvirt NAT : `virsh domifaddr <vm>` ou `virsh net-dhcp-leases default`.

### 2.3 Test depuis l’hôte (obligatoire)

```bash
ssh -i ~/.ssh/capsuleos-lab capsule@<IP> \
  'export DISPLAY=:0 XAUTHORITY=$(ls /run/user/$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1); wmctrl -l; echo exit:$?'
```

Attendu : `exit:0` (liste vide ou fenêtres).

### 2.4 Session graphique

- Utilisateur **connecté au bureau** (GDM), pas seulement SSH.
- **Wayland** : variables ci-dessus.
- **Xorg** (optionnel, GDM → « GNOME sur Xorg ») : souvent `DISPLAY=:0` + `~/.Xauthority` suffisent ; renseigner `sessionType: "xorg"` dans l’inventaire.

---

## 3. Inventaire lab (`etc/capsuleos/lab-inventory.json`)

Fichier **local**, listé dans `.gitignore`. Copier l’exemple :

```bash
cp etc/capsuleos/lab-inventory.example.json etc/capsuleos/lab-inventory.json
```

### Champs utiles (RHEL + Wayland)

| Champ | Exemple Rocky | Rôle |
|-------|---------------|------|
| `registryId` | `linux-rocky` | Entrée [`os-registry.json`](../../etc/capsuleos/os-registry.json) |
| `ssh` | `capsule@192.168.122.234` | Cible SSH |
| `sshIdentity` | `~/.ssh/capsuleos-lab` | Clé dédiée lab |
| `display` | `:0` | Display Xwayland |
| `sessionType` | `wayland-xwayland` | Documente la stack |
| `xauthorityDiscovery` | `mutter-xwayland` | Résolution auto du cookie (outils Node) |
| `xauthority` | chemin fixe | Optionnel si cookie stable (rare) |
| `toolkit` | `gnome` | GNOME Shell, Nautilus (« Fichiers ») |
| `vendor` | `rocky` | Branche Red Hat / assets `vendors/rocky/` |
| `capsuleUrl` | URL HTTP skin | Placeholder possible jusqu’à façade Rocky |
| `hypervisor` | `libvirt` | virt-manager, Proxmox, etc. |

Les outils `usr/lib/capsuleos/tools/lab/*.mjs` utilisent [`lab-x11-env.mjs`](../../usr/lib/capsuleos/tools/lab/lab-x11-env.mjs) pour préfixer les commandes SSH.

Test rapide :

```bash
node usr/lib/capsuleos/tools/lab/lab-ssh.mjs --id linux-rocky --cmd 'export DISPLAY=:0 XAUTHORITY=$(ls /run/user/$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1); wmctrl -l; echo exit:$?'
```

---

## 4. Persistance sur la VM (optionnel)

Dans `~/.bashrc` de l’utilisateur graphique :

```bash
if [[ -z "${DISPLAY:-}" ]] && compgen -G "/run/user/$(id -u)/.mutter-Xwaylandauth.*" >/dev/null; then
  export DISPLAY=:0
  export XAUTHORITY=$(ls /run/user/$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1)
fi
```

---

## 5. Déploiement sonde

```bash
root/tools/lab/bootstrap-vm.sh linux-rocky
```

Déploie `os-probe.sh`, **`os-probe-gnome.sh`**, tente `install-xdotool-el.sh`, sinon compile via **`deploy-xdotool-via-host.sh`** (hôte RHEL/Fedora avec gcc → `~/.local` sur la VM).

Test :

```bash
ssh -i ~/.ssh/capsuleos-lab capsule@<IP> \
  'export PATH=$HOME/.local/bin:$PATH DISPLAY=:0 XAUTHORITY=$(ls /run/user/$(id -u)/.mutter-Xwaylandauth.* | head -1); \
   $HOME/capsuleos-lab/os-probe-gnome.sh state'
```

**Prérequis** : session **GDM connectée** (bureau actif) — `wmctrl` / Xwayland ne voient pas de fenêtres si la session graphique est inactive.

`os-probe.sh` (Cinnamon) reste pour Mint ; **Rocky / Fedora GNOME** → `os-probe-gnome.sh` dans `lab-inventory.json` (`toolkit: gnome`).

---

## 6. CapsuleOS et branche Red Hat

| Élément | État (juin 2026) |
|---------|------------------|
| Registre `linux-rocky` | `active`, tier P3, toolkit `gnome` |
| `home/RedHat/Rocky/` | Skin canonique (pont Fedora GNOME, `body#rocky`) |
| Façade | `OS/linux/families/redhat/rocky/index.html` |
| Inventaire VM | [inventaires/linux-rocky-vm.md](inventaires/linux-rocky-vm.md) |
| Assets | `usr/share/capsuleos/assets/images/vendors/rocky/` |

Workflow clone : [procedure-clonage-os-depuis-vm.md](procedure-clonage-os-depuis-vm.md) phases 0–1 (inventaire ground truth) avant patch skin.

---

## 7. Dépannage

| Symptôme | Action |
|----------|--------|
| `Cannot open display` | Bureau non connecté ou `XAUTHORITY` manquant (§1) |
| `wmctrl: commande inconnue` | `sudo dnf install -y wmctrl` (EPEL + CRB) |
| `exit:0` mais liste vide | Ouvrir Fichiers/Terminal sur la VM ; fenêtres pure Wayland natives peuvent être invisibles à `wmctrl` |
| `xdotool` introuvable | Normal sur el10 ; ne pas bloquer le lab SSH de base |
| IP changée après reboot | Mettre à jour `lab-inventory.json` ou DHCP réservé |

---

## 8. Checklist agent / humain

- [ ] `crb` + `epel` + `wmctrl` installés sur la VM
- [ ] `ssh -i ~/.ssh/capsuleos-lab … wmctrl -l` → `exit:0` avec préfixe XAUTHORITY
- [ ] `etc/capsuleos/lab-inventory.json` avec `linux-rocky` (ou Alma/Fedora)
- [ ] `sessionType` / `xauthorityDiscovery` renseignés si Wayland
- [ ] CapsuleOS servi en local si parité DOM
- [ ] Skill `os-linux` + vendor `rocky` pour implémentation façade
