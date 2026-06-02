# Contrat et conformité

## Référence unique

Le contrat machine strict est **`writing.md`** à la racine du workspace Cursor :

`/mnt/#TEAM/#INTERNE/#WEB/CapsuleOS/writing.md`

(rel. workspace : `writing.md`)

**Ne pas copier** ce fichier dans `root/`. Les agents doivent s’y référer pour :

- langages autorisés (HTML5, CSS3, ES6) ;
- fidélité des OS simulés ;
- familles d’OS à couvrir ou extensibles ;
- intention pédagogique ;
- règles CSS (ordre des propriétés, variables) ;
- offline et structure rootfs.

## Checklist opérationnelle

Avant merge ou livraison : [`CONTRACT_CHECKLIST.md`](../../CONTRACT_CHECKLIST.md).

Points sensibles Linux : variables `CAPSULE_*` avant scripts noyau, embeds, explorateurs (`CAPSULE_EXPLORER_TEMPLATE`), pas de doc sous `OS/`.

## Skills associés

| Sujet | Skill |
|-------|--------|
| Code | `skills/role-developer` |
| Conformité livrable | `skills/role-manager` |
| Intégration skins | `skills/role-integrator` |
