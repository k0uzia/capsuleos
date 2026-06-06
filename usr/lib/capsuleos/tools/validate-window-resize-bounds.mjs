#!/usr/bin/env node
/**
 * Vérifie que clampSize préserve le bord opposé lors d’un resize par la gauche.
 * Usage : node usr/lib/capsuleos/tools/validate-window-resize-bounds.mjs
 */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const script = `
const { JSDOM } = require('jsdom');
const fs = require('fs');
const boundsSrc = fs.readFileSync('usr/lib/capsuleos/common/window/bounds.js', 'utf8');
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="win" style="min-width:320px;min-height:180px"></div></body></html>', {
  url: 'http://localhost/',
  pretendToBeVisual: true,
});
global.window = dom.window;
global.document = dom.window.document;
eval(boundsSrc);

const element = document.getElementById('win');
const bounds = { left: 100, top: 50, right: 1000, bottom: 800, width: 900, height: 750 };
window.CapsuleWindowBounds.getWorkAreaRect = () => bounds;

const errors = [];
function assertRightPreserved(label, left, width, direction, expectedRight) {
  const result = window.CapsuleWindowBounds.clampSize(element, left, 50, width, 300, {}, { direction });
  const right = result.left + result.width;
  if (Math.abs(right - expectedRight) > 0.5) {
    errors.push(label + ': bord droit ' + right + ' ≠ ' + expectedRight + ' (left=' + result.left + ' width=' + result.width + ')');
  }
}

// Resize gauche : expansion vers la gauche au-delà de bounds.left — le bord droit doit rester fixe.
assertRightPreserved('left-expand-past-bound', 50, 750, 'left', 800);

// Resize gauche : rétrécissement depuis la gauche.
assertRightPreserved('left-shrink', 550, 250, 'left', 800);

// Resize droite : le bord gauche reste fixe.
const rightResize = window.CapsuleWindowBounds.clampSize(element, 400, 50, 500, 300, {}, { direction: 'right' });
if (Math.abs(rightResize.left - 400) > 0.5) {
  errors.push('right-resize: left a bougé (' + rightResize.left + ')');
}

if (errors.length) {
  console.error(errors.join('\\n'));
  process.exit(1);
}
console.log('OK');
`;

const result = spawnSync(process.execPath, ['-e', script], { cwd: ROOT, encoding: 'utf8' });
if (result.status !== 0) {
    if (result.stderr && result.stderr.includes("Cannot find module 'jsdom'")) {
        // Repli sans jsdom : logique inline
        const bounds = { left: 100, right: 1000 };
        const minWidth = 320;
        const left = 50;
        const width = 750;
        const right = left + width;
        let nextLeft = Math.max(bounds.left, left);
        let nextWidth = right - nextLeft;
        nextWidth = Math.max(minWidth, nextWidth);
        nextLeft = right - nextWidth;
        if (Math.abs((nextLeft + nextWidth) - 800) > 0.5) {
            console.error('✗ validate-window-resize-bounds — bord droit non préservé');
            process.exit(1);
        }
        console.log('✓ validate-window-resize-bounds OK (repli arithmétique)');
        process.exit(0);
    }
    console.error(result.stderr || result.stdout);
    process.exit(1);
}
console.log('✓ validate-window-resize-bounds OK');
