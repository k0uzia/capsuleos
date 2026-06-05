#!/usr/bin/env node
/** Crée les pages menu macOS Sonoma manquantes (coquilles minimales). */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const PAGES = path.join(ROOT, 'OS/macos/sonoma/pages');

const STUBS = [
  'file.html',
  'editer.html',
  'affichage.html',
  'aller.html',
  'fenetre.html',
  'aide.html',
  'son.html',
  'bluetooth.html',
  'batterie.html',
  'wifi.html',
  'search.html',
  'controlCenter.html',
];

const tpl = (title) => `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title} — macOS Sonoma</title>
</head>
<body>
    <p><strong>${title}</strong> — section en cours de simulation.</p>
    <p><a href="../index.html">Retour au bureau Sonoma</a></p>
</body>
</html>
`;

fs.mkdirSync(PAGES, { recursive: true });
let n = 0;
for (const file of STUBS) {
  const full = path.join(PAGES, file);
  if (fs.existsSync(full)) continue;
  const title = file.replace('.html', '');
  fs.writeFileSync(full, tpl(title), 'utf8');
  n += 1;
}
console.log(`${n} page(s) macOS créée(s)`);
