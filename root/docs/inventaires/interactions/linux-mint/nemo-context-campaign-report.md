# Campagne clic droit Nemo — VM vs recette

**Date** : 2026-06-09
**Scénarios** : 29
**Écarts P0** : 0 · **P1** : 0

## Synthèse

| Métrique | Valeur |
|----------|--------|
| Recette (Capsule) | 29 scénarios · 0 P0 · 0 P1 |
| VM Mint | 26 scénarios Nemo · 21 menus visibles |
| Cross-diff P0 | 0 |
| Cross-diff P1 | 0 |

## Détail par scénario

| ID | P | Verdict | Capsule | VM | Manquants recette | Extras recette |
|----|---|---------|---------|-----|-------------------|----------------|
| desktop.background | P0 | ok | oui | non | — | Changer le fond d'écran…, Paramètres du bureau, Actualiser le bureau |
| desktop.icon | P2 | ok | oui | non | — | Ouvrir, Couper, Copier, Renommer, Supprimer, Propriétés |
| panel.background | P2 | ok | oui | non | — | Ajouter des applets, Configurer le panel |
| window.title | P2 | ok | oui | oui | Créer un nouveau dossier, Ouvrir dans un terminal, Coller, Propriétés | Réduire, Agrandir, Fermer, Toujours au premier plan |
| nemo.list.background.home | P1 | ok | oui | oui | — | Créer un nouveau document, Tout sélectionner |
| nemo.list.background.documents | P1 | ok | oui | oui | — | Créer un nouveau document, Tout sélectionner |
| nemo.list.background.desktop | P1 | ok | oui | oui | — | Créer un nouveau document, Tout sélectionner |
| nemo.list.file.txt | P1 | ok | oui | oui | Créer un nouveau dossier, Ouvrir dans un terminal | Ouvrir, Ouvrir avec…, Couper, Copier, Renommer, Compresser…, Déplacer vers la corbeille |
| nemo.list.file.pdf | P1 | ok | oui | oui | Créer un nouveau dossier, Ouvrir dans un terminal | Ouvrir, Ouvrir avec…, Couper, Copier, Renommer, Compresser…, Déplacer vers la corbeille |
| nemo.list.file.png | P1 | ok | oui | oui | Créer un nouveau dossier, Ouvrir dans un terminal | Ouvrir, Ouvrir avec…, Couper, Copier, Renommer, Compresser…, Déplacer vers la corbeille |
| nemo.list.file.odt | P2 | skip | non | oui | Créer un nouveau dossier, Ouvrir dans un terminal, Coller, Propriétés | — |
| nemo.list.folder | P1 | ok | oui | oui | Créer un nouveau dossier, Ouvrir dans un terminal | Ouvrir, Ouvrir avec…, Couper, Copier, Renommer, Compresser…, Déplacer vers la corbeille |
| nemo.list.multi | P1 | ok | oui | oui | Créer un nouveau dossier, Ouvrir dans un terminal | Couper, Copier, Compresser…, Déplacer vers la corbeille |
| nemo.sidebar.place.home | P1 | ok | oui | non | — | Ouvrir, Supprimer, Vider la corbeille, Propriétés |
| nemo.sidebar.place.documents | P1 | ok | oui | oui | — | — |
| nemo.sidebar.place.downloads | P1 | ok | oui | oui | — | — |
| nemo.sidebar.trash | P1 | ok | oui | oui | Ouvrir, Supprimer, Propriétés | — |
| nemo.sidebar.tree | P2 | skip | non | oui | Créer un nouveau dossier, Ouvrir dans un terminal, Coller, Propriétés | — |
| nemo.pathbar | P1 | ok | oui | non | — | Créer un nouveau dossier, Créer un nouveau document, Coller, Ouvrir dans un terminal, Tout sélectionner, Propriétés |
| nemo.toolbar | P2 | skip | non | non | — | — |
| nemo.view.icons.background | P1 | ok | oui | oui | — | Créer un nouveau document, Tout sélectionner |
| nemo.view.list.background | P1 | ok | oui | oui | — | Créer un nouveau document, Tout sélectionner |
| nemo.view.icons.file | P1 | ok | oui | oui | Créer un nouveau dossier, Ouvrir dans un terminal | Ouvrir, Ouvrir avec…, Couper, Copier, Renommer, Compresser…, Déplacer vers la corbeille |
| nemo.view.list.file | P1 | ok | oui | oui | Créer un nouveau dossier, Ouvrir dans un terminal | Ouvrir, Ouvrir avec…, Couper, Copier, Renommer, Compresser…, Déplacer vers la corbeille |
| nemo.trash.background | P1 | ok | oui | oui | Créer un nouveau dossier, Ouvrir dans un terminal, Coller, Propriétés | Vider la corbeille |
| nemo.trash.item | P1 | ok | oui | oui | Créer un nouveau dossier, Ouvrir dans un terminal, Coller, Propriétés | Restaurer, Supprimer définitivement |
| nemo.empty-trash-disabled | P1 | ok | oui | oui | Ouvrir, Supprimer, Propriétés | — |
| nemo.list.background.submenu.new-document | P1 | ok | oui | non | — | Document vide, Feuille de calcul, Présentation |
| nemo.list.file.submenu.open-with | P1 | ok | oui | non | — | Éditeur de texte, Visionneur d'images, Visionneur de documents, Lecteur multimédia |

## Labels VM (échantillon ground truth)

- **window.title** : Créer un nouveau dossier → Ouvrir dans un terminal → Coller → Propriétés
- **nemo.list.background.home** : Créer un nouveau dossier → Ouvrir dans un terminal → Coller → Propriétés
- **nemo.list.background.documents** : Créer un nouveau dossier → Ouvrir dans un terminal → Coller → Propriétés
- **nemo.list.background.desktop** : Créer un nouveau dossier → Ouvrir dans un terminal → Coller → Propriétés
- **nemo.list.file.txt** : Créer un nouveau dossier → Ouvrir dans un terminal → Coller → Propriétés
- **nemo.list.file.pdf** : Créer un nouveau dossier → Ouvrir dans un terminal → Coller → Propriétés
- **nemo.list.file.png** : Créer un nouveau dossier → Ouvrir dans un terminal → Coller → Propriétés
- **nemo.list.file.odt** : Créer un nouveau dossier → Ouvrir dans un terminal → Coller → Propriétés

## Actions correctives

Aucun écart P0/P1 détecté sur la campagne.

## Fichiers

- Scénarios : `root/docs/inventaires/interactions/linux-mint/nemo-context-scenarios.json`
- Recette : `root/docs/inventaires/interactions/linux-mint/nemo-context-campaign-capsule.json`
- VM : `root/docs/inventaires/interactions/linux-mint/nemo-context-campaign-vm.json`
- Runner recette : `usr/lib/capsuleos/tools/lab/run-mint-nemo-context-campaign.mjs`
- Runner VM : `usr/lib/capsuleos/tools/lab/run-mint-nemo-context-campaign-vm.mjs`
