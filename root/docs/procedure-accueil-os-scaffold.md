# Procédure — squelette d'accueil OS (Linux-first)

> **Contrat** : `etc/capsuleos/contracts/os-welcome-scaffold.json` (à créer)  
> **Outil** : `usr/lib/capsuleos/tools/lab/bootstrap-os-welcome-scaffold.mjs` (à créer)  
> **Référence** : [`convention-accueil-os.md`](convention-accueil-os.md)

---

## Prédicat AccΣ

Un registry `planned` / `P4` est **accueilli** quand :

- arborescence Z2 complète (`index.html`, `skin.profile.json`, `style/imports.css`, `a11y-overrides.css`, `content/strings.json`) ;
- profil `etc/capsuleos/profiles/<registryId>.json` valide ;
- slots P0 `data-link` câblés (fenêtres vides acceptées) ;
- `resolve-lab-recipe.mjs --id <registryId> --human` sans gap bloquant R-LOC1.

**Sans** exiger SeΣ ni H₆.

---

## Priorité Linux (vague 1)

| registryId | Toolkit | Pilote upstream |
|------------|---------|-----------------|
| `linux-elementary` | pantheon | `linux-ubuntu` |
| `linux-kali` | xfce | `linux-rocky` |
| `linux-lxqt` | lxqt | `linux-debian-kde` |

```bash
node usr/lib/capsuleos/tools/lab/bootstrap-os-welcome-scaffold.mjs --id linux-elementary
node usr/lib/capsuleos/tools/lab/bootstrap-os-welcome-scaffold.mjs --id linux-kali
node usr/lib/capsuleos/tools/lab/bootstrap-os-welcome-scaffold.mjs --id linux-lxqt
node usr/lib/capsuleos/tools/linux/sync-linux-skin-closure.mjs
node usr/lib/capsuleos/tools/lab/validate-welcome-scaffold.mjs --id <registryId>
```

---

## Vague 2 (non-Linux — Phase 4)

```bash
node usr/lib/capsuleos/tools/lab/bootstrap-os-welcome-scaffold.mjs --kernel windows
node usr/lib/capsuleos/tools/lab/bootstrap-os-welcome-scaffold.mjs --kernel darwin
```

Familles : Windows, macOS, iOS, Android, BSD, UNIX — même contrat, génération reportée après clôture vague 1 Linux.
