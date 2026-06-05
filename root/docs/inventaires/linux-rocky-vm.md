# Inventaire VM — Rocky Linux 10 GNOME (ground truth)

> Référence lab pour le skin `linux-rocky` · VM virt-manager NAT · juin 2026.

## Applications VM ↔ slots CapsuleOS (GNOME)

Sous Rocky, l’explorateur est **Nautilus** (`org.gnome.Nautilus`), **pas Nemo** (Cinnamon/Mint). CapsuleOS affiche **« Fichiers »** via le gabarit partagé **`nemo`** (`data-link="nemo"`). Le terminal VM est **Ptyxis** ; le slot Capsule est **`terminal`**.

Table complète : [`linux-gnome-capsule-slots.md`](linux-gnome-capsule-slots.md) · rapport visuel : [`linux-rocky-comparaison-visuelle.md`](linux-rocky-comparaison-visuelle.md).

**Assets (obligatoire)** : icônes panel, fond d’écran et dossiers Adwaita copiés depuis cette VM — [`convention-assets-depuis-vm.md`](../convention-assets-depuis-vm.md) · `bash root/tools/lab/pull-vm-assets.sh --id linux-rocky`.

## Validation agent (2026-06-04)

| Contrôle | Résultat |
|----------|----------|
| `lab-ssh.mjs --id linux-rocky` | OK — `capsule@localhost-live` |
| Clé `~/.ssh/capsuleos-lab` | OK |
| `DISPLAY` + `XAUTHORITY` (Mutter) | OK — `wmctrl` **exit:0** (liste souvent vide en Wayland pur) |
| `xdotool` | Déployé dans `~/.local/bin` (build hôte → VM) |
| Sonde `~/capsuleos-lab/os-probe-gnome.sh` | OK — `nemo`/`firefox`/`terminal` **running** (pgrep + wmctrl) |
| Thèmes VM | `default` → Capsule **sombre** ; `prefer-light` → Capsule **clair** (`data-theme` + `gnome-theme`) |
| CapsuleOS HTTP `capsuleUrl` | **200** — `home/RedHat/Rocky/index.html` servi localement |
| État machine | `root/docs/inventaires/linux-rocky-vm-state.json` |

**GNOME VM (ground truth)** : Shell **47.4**, thème **Adwaita**, accent **blue**, favoris dock : Firefox, Calendar, Music, **Nautilus**, Software, **Ptyxis**, TextEditor, Calculator. Extension : `background-logo@fedorahosted.org`.

**Écart P1 documenté** : CapsuleOS dock = 6 raccourcis + accueil (modèle Fedora) ; VM = 8 favoris GNOME natifs (dont Software, Calculator non dans le dock CapsuleOS).

**Noyau partagé (2026-06-04)** : `taskbar-launcher-state.js` alimente Mint (footer) et GNOME (dock `#tableau`) ; sonde lab `CapsuleLauncherProbe.collectState()` (même schéma que `os-probe-gnome.sh`). Checklist Capsule Rocky : **6/6** ; VM : `active` Wayland encore fragile (P1).

---

## Connexion lab

| Champ | Valeur |
|-------|--------|
| `registryId` | `linux-rocky` |
| SSH | `capsule@192.168.122.234` |
| Session | GNOME **Wayland** + Xwayland `:0` |
| Accent GNOME (`gsettings`) | `blue` |
| Schéma couleurs | `default` |
| Paquets sonde | `wmctrl` (EPEL+CRB) — `xdotool` **absent** el10 |

Commande de test hôte :

```bash
ssh -i ~/.ssh/capsuleos-lab capsule@192.168.122.234 \
  'export DISPLAY=:0 XAUTHORITY=$(ls /run/user/$(id -u)/.mutter-Xwaylandauth.* 2>/dev/null | head -1); wmctrl -l; echo exit:$?'
```

Voir [lab-vm-rhel-wayland.md](../lab-vm-rhel-wayland.md).

## Pont CapsuleOS ↔ Fedora GNOME

| Couche | Réutilisation | Spécifique Rocky |
|--------|---------------|------------------|
| Noyau fenêtres | `CapsuleWindow`, `windowContainer.js` | — |
| Shell GNOME | Copie skin **Fedora** (`fedora-*` classes CSS, tokens sous `html:has(#rocky)`) | `body#rocky`, logos `vendors/rocky/` |
| Apps | Gabarits `usr/share/capsuleos/linux/apps/` + `.skin.css` | `CAPSULE_EMBED_SKIN_KEY`: `rocky` |
| Terminal | Profil `linux:redhat` (`dnf`, `rpm`) | `bodyId` `rocky` |
| Explorateur | Template `nemo` (Nautilus/Fichiers) | Titre « Fichiers » |

## Écarts P0 / P1 (à affiner avec VM ouverte)

| Composant | VM (attendu) | CapsuleOS actuel | Priorité |
|-----------|--------------|------------------|----------|
| Barre supérieure + dock | GNOME 40+ sombre, dock gauche | Hérité Fedora GNOME | P1 — valider couleurs vs capture VM |
| Logo bureau | Rocky vert | `rocky-logo.svg` (création CapsuleOS) | P1 |
| Aperçu activités | Grille apps + recherche | `overview.js` (hérité Fedora) | P2 |
| Fichiers | `org.gnome.Nautilus` | Slot `nemo` | P0 — même gabarit, titre Fichiers |
| Firefox | Présent | Slot `firefox` | P1 |
| Terminal | Ptyxis / gnome-terminal | Chrome terminal style Fedora | P1 — prompt `fed@fedora` à adapter rocky |
| Mises à jour | `dnf update` / app « Logiciels » | `update_manager` générique | P2 |

## Apps `.desktop` observées (extrait SSH)

- `firefox.desktop`, `gnome-*-panel.desktop`, disques, paramètres GNOME.

## Captures lab (2026-06-04)

| Source | Répertoire | Fichiers |
|--------|------------|----------|
| VM (`virsh screenshot Rocky10`) | `root/docs/inventaires/assets/rocky-vm/` | `rocky-dark-{desktop,nautilus,firefox,ptyxis}.png`, `rocky-light-{desktop,firefox,nautilus}.png` |
| CapsuleOS (Playwright) | `root/docs/inventaires/assets/rocky-capsule/` | `rocky-capsule-dark-{desktop,nautilus,firefox,terminal}.png`, `rocky-capsule-light-{desktop,firefox,nautilus}.png` |

Scripts : `root/tools/lab/vm-rocky-capture-host.sh` (VM), `root/tools/lab/capture-capsule-rocky.mjs` (Capsule, `PLAYWRIGHT_CHROME` ou Chromium Playwright).

**Passe fidélité CSS (2026-06-05)** : dock GNOME affiché, fond violet VM, tokens Nautilus/Adwaita sur `nemo` — détail dans [`linux-rocky-comparaison-visuelle.md`](linux-rocky-comparaison-visuelle.md).

## Prochaines mesures

1. Ajuster `style/gnome-shell/tokens.css` sous `#rocky` à partir des captures si écart mesuré (accent bleu VM confirmé).
3. Mise à jour avant validation : `./root/tools/lab/update-rocky-nautilus.sh` (façades pick-os + embed + audit). Ne pas éditer `OS/linux/families/redhat/rocky/` à la main — sinon pick-os ≠ `home/RedHat/Rocky/`.
4. Sonde GNOME dédiée (hors `os-probe.sh` Cinnamon) quand `xdotool` disponible ou alternative `gdbus`.

## Chemins skin

- Canonique : `home/RedHat/Rocky/index.html`
- Façade : `OS/linux/families/redhat/rocky/index.html`
- Profil : `etc/capsuleos/profiles/linux-rocky.json`
