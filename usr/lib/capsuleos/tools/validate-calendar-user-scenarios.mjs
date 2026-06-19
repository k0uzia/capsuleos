#!/usr/bin/env node
/**
 * Contrat scénarios GNOME Agenda — structure + handlers kernel.
 * Usage : node usr/lib/capsuleos/tools/validate-calendar-user-scenarios.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const CONTRACT = path.join(ROOT, 'etc/capsuleos/contracts/calendar-user-scenarios.json');
const KERNEL = path.join(ROOT, 'usr/lib/capsuleos/shells/linux/calendar-app.js');
const TEMPLATE = path.join(ROOT, 'usr/share/capsuleos/linux/apps/calendar.html');
const SMOKE = path.join(ROOT, 'usr/lib/capsuleos/tools/lab/smoke-gnome-calendar-scenarios.mjs');

const errors = [];

if (!fs.existsSync(CONTRACT)) {
  errors.push('calendar-user-scenarios.json manquant');
} else {
  const contract = JSON.parse(fs.readFileSync(CONTRACT, 'utf8'));
  const p0 = (contract.scenarios || []).filter((s) => s.priority === 'P0' && !s.optional);
  if (p0.length < 4) {
    errors.push('au moins 4 scénarios P0 attendus');
  }
  p0.forEach((scenario) => {
    if (!scenario.proofs || !scenario.proofs.smoke) {
      errors.push(`${scenario.id} : proof smoke manquante`);
    }
  });
}

const kernelText = fs.readFileSync(KERNEL, 'utf8');
[
  'GNOME_CALENDAR_SESSION_KEY',
  'syncCalendarDataset',
  'setActiveView',
  'addEvent',
  'data-cal-gnome-view',
  'data-cal-gnome-action',
  'data-cal-gnome-event',
].forEach((needle) => {
  if (!kernelText.includes(needle)) {
    errors.push(`calendar-app.js : attendu « ${needle} »`);
  }
});

const templateText = fs.readFileSync(TEMPLATE, 'utf8');
[
  'data-cal-gnome-view="month"',
  'data-cal-gnome-view="week"',
  'data-cal-gnome-action="new-event"',
  'data-cal-gnome-action="save-event"',
  'data-cal-gnome-panel="month"',
  'data-cal-gnome-panel="week"',
  'data-cal-gnome-event-list',
  'data-cal-gnome-event-title',
].forEach((needle) => {
  if (!templateText.includes(needle)) {
    errors.push(`calendar.html : attendu « ${needle} »`);
  }
});

['data-cal-gnome-weekday', 'data-cal-gnome-day'].forEach((needle) => {
  if (!kernelText.includes(needle)) {
    errors.push(`calendar-app.js : rendu dynamique attendu « ${needle} »`);
  }
});

if (!fs.existsSync(SMOKE)) {
  errors.push('smoke-gnome-calendar-scenarios.mjs manquant');
}

if (errors.length) {
  console.error(`✗ validate-calendar-user-scenarios — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error('  ', e));
  process.exit(1);
}

console.log('✓ validate-calendar-user-scenarios OK');
process.exit(0);
