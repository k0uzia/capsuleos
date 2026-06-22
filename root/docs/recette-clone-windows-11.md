# Recette clone Windows 11 — protocole lab direct

> **registryId** : `windows-11` · **VM** : `<lab-inventory:windows-11>` · **virsh** : `win11_483ec3b2`  
> **Protocole** : identique à Mint — hôte lab → SSH direct vers la VM. **Aucun relais** via linux-mint ou autre VM.

**Lecture** : [procedure-clonage-os-depuis-vm.md](procedure-clonage-os-depuis-vm.md) §4.4 · [windows-11-vm.json](inventaires/windows-11-vm.json)

---

## Prérequis réseau (obligatoire)

La VM **ne doit pas** utiliser macvtap/direct sur la même NIC que l'hôte hyperviseur (isolation L2 : ping/SSH « No route to host » depuis `<lab-ip>`).

Dans **virt-manager** → `win11_483ec3b2` → Détails → Réseau :

1. Supprimer l'interface **macvtap** (mode direct / `enp1s0`)
2. Ajouter un **bridge** sur le LAN (`<lab-ip>/24`), comme la VM Mint
3. Redémarrer la VM si nécessaire ; vérifier `ipconfig` → IP toujours `<lab-ip>` (ou DHCP réservé)

Test depuis l'hôte lab :

```bash
ping -c 2 <lab-ip>
ssh -i ~/.ssh/capsuleos-lab <lab-inventory:windows-11> hostname
```

---

## Prérequis auth SSH

Sur la VM (PowerShell utilisateur **Quickemu**) :

```powershell
mkdir $env:USERPROFILE\.ssh -Force
# Coller la clé publique ~/.ssh/capsuleos-lab.pub de l'hôte lab
Add-Content $env:USERPROFILE\.ssh\authorized_keys "<contenu clé publique>"
icacls $env:USERPROFILE\.ssh\authorized_keys /inheritance:r /grant "$env:USERNAME:(F)" /grant "SYSTEM:(F)"
```

---

## Inventaire lab (`etc/capsuleos/lab-inventory.json`)

```json
{
  "registryId": "windows-11",
  "ssh": "<lab-inventory:windows-11>",
  "sshIdentity": "~/.ssh/capsuleos-lab",
  "virshName": "win11_483ec3b2"
}
```

**Interdit** : champ `sshJumpHost` — pas de passage par Mint.

---

## Chaîne collecte P0

```bash
node usr/lib/capsuleos/tools/lab/lab-ssh.mjs --id windows-11 --cmd hostname
node usr/lib/capsuleos/tools/lab/collect-windows-inventory.mjs --id windows-11 --write
node usr/lib/capsuleos/tools/lab/run-manifest-replication-chain.mjs --id windows-11 --auto --write
```

---

## État actuel (juin 2026)

| Étape | Statut |
|-------|--------|
| IP confirmée (`<lab-ip>`) | OK |
| Ping/SSH direct hôte `<lab-ip>` | Bloqué (macvtap) |
| OpenSSH sur VM | Actif (port 22 joignable via LAN) |
| Clé `capsuleos-lab` autorisée | À confirmer |
| Collecte PowerShell | En attente direct + auth |
