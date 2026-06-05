# GNOME (VM réelle) ↔ slots CapsuleOS — référence partagée

> **Ne pas confondre** le nom de l’application sur la VM avec l’identifiant technique du skin.  
> Sous GNOME (Rocky, Fedora, Alma…), l’explorateur est **Nautilus** ; CapsuleOS réutilise le gabarit **`nemo`** (hérité Cinnamon/Mint) pour le même rôle pédagogique.

## Table de correspondance (checklist panel P0)

| Rôle UI (FR) | Application VM (GNOME) | WM class / binaire | Slot CapsuleOS | Gabarit / template | Titre fenêtre Capsule |
|--------------|------------------------|--------------------|----------------|--------------------|------------------------|
| Fichiers | **Nautilus** (`org.gnome.Nautilus`) | `org.gnome.Nautilus`, `nautilus` | **`nemo`** | `nemo-gnome` → `explorers/nautilus/shell-gnome.html` (headerbar Adwaita, sans menubar Nemo) · slot `nemo` | **Fichiers** |

## Coque GNOME : Ubuntu ≠ RHEL

| Distro | Dock permanent `#tableau` | Lanceurs |
|--------|---------------------------|----------|
| **Ubuntu** (Unity / dock étendu) | **visible** | barre latérale + Aperçu |
| **Fedora / Rocky / Alma** (GNOME Wayland) | **masqué** | Aperçu (`fedora-overview__dash`) uniquement |
| Web | **Firefox** | `Navigator.firefox`, `firefox` | **`firefox`** | embed firefox | Firefox |
| Terminal | **Ptyxis** (EL10+) ou gnome-terminal | `org.gnome.ptyxis`, `gnome-terminal` | **`terminal`** | profil `linux:redhat` | Terminal |

## JSON sonde / parité

- Clé JSON : toujours `launchers.nemo`, `explorer.nemo` (schéma unique Mint + GNOME).
- Sonde VM : `os-probe-gnome.sh` ouvre **`nautilus`**, mappe les classes vers le slot **`nemo`**.
- Sonde Capsule : `CapsuleLauncherProbe` / `capsule-probe-snippet.js` lisent `data-link="nemo"` (fenêtre simulée type Nautilus).

## Captures d’écran (nommage fichiers)

Les PNG peuvent porter le nom **réel** de l’app VM (`nautilus`, `ptyxis`) ou **capsule** (`nautilus` = vue Fichiers, `terminal` = Ptyxis simulé) :

| Fichier type | VM (`vendors/rocky/inventory/rocky-vm/`) | Capsule (`vendors/rocky/inventory/rocky-capsule/`) |
|--------------|------------------|----------------------------|
| Fichiers | `rocky-*-nautilus.png` | `rocky-capsule-*-nautilus.png` (slot `nemo`) |
| Terminal | `rocky-*-ptyxis.png` | `rocky-capsule-*-terminal.png` (slot `terminal`) |

## Cinnamon (Mint) — contraste

| Rôle | VM | Slot Capsule |
|------|-----|--------------|
| Fichiers | **Nemo** | `nemo` (nom aligné) |

Sous GNOME, dire « Nemo » pour la VM Rocky est **incorrect** ; préférer **Nautilus** / **Fichiers** côté utilisateur, **`nemo`** côté code partagé.
