#!/usr/bin/env node
/**
 * Exporte les offres portail pour la version dev statique.
 * Usage : node usr/lib/capsuleos/tools/build-portal-offers.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const OFFERS = path.join(ROOT, 'etc/capsuleos/contracts/portal-offers.json');
const OUT = path.join(ROOT, 'usr/lib/capsuleos/site/portal-offers-data.js');

const offers = JSON.parse(fs.readFileSync(OFFERS, 'utf8'));
const payload = JSON.stringify(offers);

const js = `/**
 * Généré depuis etc/capsuleos/contracts/portal-offers.json
 * Regénérer : node usr/lib/capsuleos/tools/build-portal-offers.mjs
 */
(function (global) {
    global.CapsulePortalOffers = ${payload};
}(typeof window !== 'undefined' ? window : globalThis));
`;

fs.writeFileSync(OUT, js);
console.log('✓ build-portal-offers →', path.relative(ROOT, OUT));
