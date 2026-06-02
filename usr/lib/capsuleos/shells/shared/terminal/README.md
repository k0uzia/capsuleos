# Terminal partagé — propagation nano / vim

## Module central

| Fichier | Rôle |
|---------|------|
| `usr/lib/capsuleos/common/terminal-editors.js` | Moteur nano/vim, lecture/écriture FS virtuel |
| `usr/share/capsuleos/themes/linux/terminal-editors.css` | Overlay éditeur (variables skin terminal) |

## Ordre de chargement (toute page avec terminal)

1. `common/user-home.js` (déjà requis pour le FS `home/public`)
2. `terminal/config/command-registry.js`
3. Profil distro (`config/profiles/linux/debian.js`, etc.)
4. `terminal-profile.js`, `terminal-core.js`
5. **`common/terminal-editors.js`** ← avant `terminal.js` et `executeCommand.js`
6. `terminal.js`, `executeCommand.js`, `filesystem.js`, `virtual-shell.js`, `manuel.js`

## Linux (8 skins + facades `OS/linux/families/`)

Profils : `linux:debian`, `linux:redhat`, `linux:suse`, `linux:arch` — tous incluent `nano` et `vim`.

`executeCommand.js` délègue à `CapsuleTerminalEditors.prepareCommand` ; `terminal.js` monte l’overlay in-terminal.

## macOS (Sonoma)

Quand un terminal est ajouté : même scripts + profil `macos:default` étendu avec `nano`, `vim`, et chemins `../../../usr/lib/capsuleos/common/terminal-editors.js`.

## BSD (GhostBSD, etc.)

Réutiliser le profil `unix:default` ou dupliquer la liste de commandes ; charger les mêmes scripts depuis `usr/lib/capsuleos/`.

## Android / HarmonyOS

Stubs : inclure `terminal-editors.js` + hook `executeTerminalCommand` identique dès qu’un shell terminal existe sous `home/Android/` ou `home/HarmonyOS/`.

## UNIX (`home/UNIX/`)

Créer la skin avec `CAPSULE_TERMINAL_PROFILE = 'unix'` et :

```html
<script src=".../config/profiles/unix/default.js"></script>
```

## API programmatique

```javascript
CapsuleTerminalEditors.openNano('notes.txt', {
  session: terminalSession,
  host: document.querySelector('[data-terminal-app]'),
  callbacks: { onClose(closed) { /* lignes */ } }
});
```
