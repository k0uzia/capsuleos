#!/usr/bin/env node
/**
 * Génère usr/lib/capsuleos/site/portal-site-home.js (URL d'accueil portail dev/prod).
 * Usage : node usr/lib/capsuleos/tools/build-portal-site-home.mjs [dev|prod]
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const OUT = path.join(ROOT, 'usr/lib/capsuleos/site/portal-site-home.js');

const mode = (process.argv[2] || process.env.CAPSULE_PORTAL_MODE || 'dev').toLowerCase();
if (!['dev', 'prod'].includes(mode)) {
    console.error('Mode invalide — utiliser dev ou prod');
    process.exit(1);
}

const homePath = mode === 'prod' ? '../../../index.php' : '../../../index.html';

const devEntitlement = mode === 'dev' ? null : null;

const securityPath = path.join(ROOT, 'etc/capsuleos/contracts/portal-security.json');
let devUser = 'test';
let devPassword = 'test123456789';
if (fs.existsSync(securityPath)) {
    const security = JSON.parse(fs.readFileSync(securityPath, 'utf8'));
    const dev = security.dev || {};
    if (dev.defaultUser) devUser = String(dev.defaultUser);
    if (dev.defaultPassword) devPassword = String(dev.defaultPassword);
}

const devGlobals =
    mode === 'dev'
        ? `
    global.CAPSULE_PORTAL_DEV_USER = ${JSON.stringify(devUser)};
    global.CAPSULE_PORTAL_DEV_PASSWORD = ${JSON.stringify(devPassword)};
    global.CAPSULE_PORTAL_PERMISSIONS = { storeBrowse: true, storeAppLaunch: true, osQuotaUnlimited: true };`
        : '';

const js = `/**
 * URL d'accueil portail — généré (ne pas éditer à la main).
 * Mode : ${mode}
 * Regénérer : make site-home MODE=${mode}
 *           node usr/lib/capsuleos/tools/build-portal-site-home.mjs ${mode}
 */
(function (global) {
    global.CAPSULE_PORTAL_MODE = ${JSON.stringify(mode)};
    global.CAPSULE_PORTAL_SITE_HOME = ${JSON.stringify(homePath)};
    global.CAPSULE_PORTAL_ENTITLEMENT = ${JSON.stringify(devEntitlement)};${devGlobals}
}(typeof window !== 'undefined' ? window : globalThis));
`;

fs.writeFileSync(OUT, js);
console.log(`✓ build-portal-site-home [${mode}] → ${homePath}`);
