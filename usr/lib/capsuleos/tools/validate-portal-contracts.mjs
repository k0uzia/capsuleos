#!/usr/bin/env node
/**
 * Gate contrats portail — offres, entitlements, cohérence index.html.
 * Usage : node usr/lib/capsuleos/tools/validate-portal-contracts.mjs
 */
import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');

const errors = [];

const readJson = (rel) => {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) {
        errors.push(`fichier manquant: ${rel}`);
        return null;
    }
    try {
        return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch (e) {
        errors.push(`${rel}: JSON invalide (${e.message})`);
        return null;
    }
};

const offers = readJson('etc/capsuleos/contracts/portal-offers.json');
const entitlements = readJson('etc/capsuleos/contracts/portal-entitlements.json');
const grades = readJson('etc/capsuleos/contracts/portal-grades.json');
const gamification = readJson('etc/capsuleos/contracts/portal-gamification.json');
const security = readJson('etc/capsuleos/contracts/portal-security.json');
const legal = readJson('etc/capsuleos/contracts/portal-legal.json');

if (offers) {
    const plans = offers.plans || [];
    if (!Array.isArray(plans) || plans.length < 3) {
        errors.push('portal-offers.json: au moins 3 plans requis (free, subscriber, education)');
    }
    const subscriber = plans.find((p) => p.id === 'subscriber');
    if (!subscriber) {
        errors.push('portal-offers.json: plan subscriber manquant');
    } else if (Number(subscriber.priceMonthly) !== 15) {
        errors.push(`portal-offers.json: priceMonthly subscriber attendu 15, reçu ${subscriber.priceMonthly}`);
    }
    const free = plans.find((p) => p.id === 'free');
    if (!free) {
        errors.push('portal-offers.json: plan free manquant');
    } else {
        const features = free.features || [];
        const joined = features.join(' ').toLowerCase();
        if (joined.includes('parcours') || joined.includes('quête')) {
            errors.push('portal-offers.json: plan free ne doit pas annoncer de parcours/quêtes');
        }
        if (!joined.includes('15')) {
            errors.push('portal-offers.json: plan free doit mentionner la limite 15 min');
        }
    }
}

if (entitlements) {
    const levels = entitlements.levels || [];
    const ids = levels.map((l) => l.id);
    for (const required of ['anonymous', 'registered', 'subscriber']) {
        if (!ids.includes(required)) {
            errors.push(`portal-entitlements.json: niveau ${required} manquant`);
        }
    }
    const osSession = entitlements.osSession || {};
    for (const tier of ['anonymous', 'registered']) {
        const row = osSession[tier];
        if (!row || row.pedagogicalModules !== false) {
            errors.push(`portal-entitlements.json: osSession.${tier}.pedagogicalModules doit être false`);
        }
        const daily = row?.maxMinutesPerOsPerDay ?? row?.maxMinutes;
        if (!row || daily !== 15) {
            errors.push(`portal-entitlements.json: osSession.${tier} limite 15 min/jour requise`);
        }
        if (!row || row.storeBrowse !== true || row.storeAppLaunch !== false) {
            errors.push(`portal-entitlements.json: osSession.${tier} store browse sans lancement apps`);
        }
    }
    const sub = osSession.subscriber;
    if (!sub || sub.pedagogicalModules !== true) {
        errors.push('portal-entitlements.json: osSession.subscriber.pedagogicalModules doit être true');
    }
    const moduleAccess = entitlements.moduleAccess || {};
    if (!Array.isArray(moduleAccess.subscriber) || !moduleAccess.subscriber.includes('subscriber')) {
        errors.push('portal-entitlements.json: moduleAccess.subscriber doit inclure subscriber');
    }
}

if (grades) {
    const gradeIds = (grades.grades || []).map((g) => g.id);
    for (const required of ['utilisateur', 'abonne', 'createur', 'professeur', 'eleve']) {
        if (!gradeIds.includes(required)) {
            errors.push(`portal-grades.json: grade ${required} manquant`);
        }
    }
    if (grades.classBenefitsSticky) {
        errors.push('portal-grades.json: classBenefitsSticky doit être false (pas de statut ancien élève)');
    }
}

if (gamification) {
    const badges = gamification.badges || [];
    if (!Array.isArray(badges) || badges.length < 1) {
        errors.push('portal-gamification.json: badges requis');
    } else {
        for (const badge of badges) {
            if (!badge.id || !badge.label || !badge.description) {
                errors.push(`portal-gamification.json: badge incomplet (${badge.id || 'sans id'})`);
            }
            if (!badge.icon) {
                errors.push(`portal-gamification.json: icon manquant pour ${badge.id}`);
            }
            const tones = ['gold', 'green', 'blue', 'purple', 'orange', 'teal', 'violet', 'rose', 'cyan'];
            if (!badge.tone || !tones.includes(badge.tone)) {
                errors.push(`portal-gamification.json: tone invalide pour ${badge.id}`);
            }
        }
    }
}

if (security) {
    const dev = security.dev || {};
    if (!dev.defaultUser || !dev.defaultPassword) {
        errors.push('portal-security.json: dev.defaultUser et dev.defaultPassword requis');
    } else if (String(dev.defaultPassword).length < (security.password?.minLength ?? 12)) {
        errors.push('portal-security.json: dev.defaultPassword trop court');
    }
}

if (legal) {
    const sectionIds = new Set((legal.sections || []).map((s) => s.id));
    for (const link of legal.footerLinks || []) {
        if (!sectionIds.has(link.id)) {
            errors.push(`portal-legal.json: footerLinks id inconnu ${link.id}`);
        }
    }
    const requiredSections = ['protection-donnees', 'creation-compte', 'donnees-bancaires', 'mentions-legales'];
    for (const id of requiredSections) {
        if (!sectionIds.has(id)) {
            errors.push(`portal-legal.json: section ${id} manquante`);
        }
    }
}

const requiredPhp = [
    'index.php',
    'portal/index.php',
    'portal/login.php',
    'portal/register.php',
    'portal/account.php',
    'portal/logout.php',
    'portal/subscribe.php',
    'portal/legal.php',
    'portal/join-class.php',
    'portal/api/progress.php',
    'portal/api/account.php',
    'portal/api/os-usage.php',
    'portal/api/tickets.php',
    'portal/api/classroom.php',
    'portal/api/classroom-join.php',
    'portal/api/skins.php',
    'portal/api/gamification.php',
    'srv/capsuleos/portal/bootstrap.php',
    'srv/capsuleos/portal/src/Subscription/GradeResolver.php',
];
for (const rel of requiredPhp) {
    if (!fs.existsSync(path.join(ROOT, rel))) {
        errors.push(`fichier PHP portail manquant: ${rel}`);
    }
}

const accountPartials = [
    'auth-account-usage.php',
    'auth-account-subscription.php',
    'auth-account-settings.php',
    'auth-account-tickets.php',
];
for (const partial of accountPartials) {
    const p = path.join(ROOT, 'usr/share/capsuleos/portal/views/partials', partial);
    if (!fs.existsSync(p)) {
        errors.push(`partial compte manquant: ${partial}`);
    }
}

const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
if (!indexHtml.includes('id="offres"')) {
    errors.push('index.html: section #offres absente');
}
if (!indexHtml.includes('id="parcours"')) {
    errors.push('index.html: section #parcours absente');
}
if (!indexHtml.includes('data-portal-price-monthly="15"')) {
    errors.push('index.html: prix abonnement 15 € non référencé (data-portal-price-monthly)');
}
if (!indexHtml.includes('portal/legal.php#protection-donnees')) {
    errors.push('index.html: lien RGPD footer manquant');
}

const moduleJson = readJson('mnt/debutant/linux-bases/module.json');
if (moduleJson && moduleJson.access !== 'subscriber') {
    errors.push('mnt/debutant/linux-bases/module.json: access doit être subscriber');
}

if (indexHtml.includes('Parcours débutant')) {
    errors.push('index.html: plan free ne doit plus annoncer Parcours débutant');
}

const modulesData = path.join(ROOT, 'usr/lib/capsuleos/site/portal-modules-data.js');
if (!fs.existsSync(modulesData)) {
    errors.push('portal-modules-data.js manquant — node usr/lib/capsuleos/tools/build-portal-modules.mjs');
}

const siteHome = path.join(ROOT, 'usr/lib/capsuleos/site/portal-site-home.js');
if (!fs.existsSync(siteHome)) {
    errors.push('portal-site-home.js manquant — make site-home-dev');
}

const emDashGate = path.join(ROOT, 'usr/lib/capsuleos/tools/validate-no-em-dash.mjs');
if (fs.existsSync(emDashGate)) {
    const run = spawnSync(process.execPath, [emDashGate], { cwd: ROOT, encoding: 'utf8' });
    if (run.status !== 0) {
        const out = `${run.stdout || ''}${run.stderr || ''}`.trim();
        errors.push(out || 'validate-no-em-dash.mjs a échoué');
    }
}

if (errors.length) {
    console.error('validate-portal-contracts — ÉCHEC');
    errors.forEach((e) => console.error('  ✗', e));
    process.exit(1);
}

console.log('✓ validate-portal-contracts OK');
