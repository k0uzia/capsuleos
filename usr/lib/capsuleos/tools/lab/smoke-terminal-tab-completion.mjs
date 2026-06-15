#!/usr/bin/env node
/**
 * Smoke — complétion Tab options et sous-commandes terminal.
 */
import { chromium } from 'playwright';
import { resolveCapsuleOsUrl } from '../linux/os-facade-fidelity-lib.mjs';

const BASE = (process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5501').replace(/\/$/, '');
const errors = [];

const profiles = [
  { id: 'linux-mint', checks: [
    { input: 'ls -', expectPhase: 'option', expectMatches: ['-l', '-a'] },
    { input: 'grep -', expectPhase: 'option', expectMatches: ['-i', '-v'] },
    { input: 'rm -', expectPhase: 'option', expectMatches: ['-r', '-f'] },
  ]},
  { id: 'linux-ubuntu', checks: [
    { input: 'apt ins', expectPhase: 'subcommand', expectMatches: ['install'] },
    { input: 'apt update', expectPhase: 'path', expectMatches: [] },
  ]},
  { id: 'linux-rocky', checks: [
    { input: 'dnf che', expectPhase: 'subcommand', expectMatches: ['check-update'] },
    { input: 'yum ins', expectPhase: 'subcommand', expectMatches: ['install'] },
    { input: 'ps a', expectPhase: 'option', expectMatches: ['aux'] },
  ]},
];

const browser = await chromium.launch({ headless: true });

for (const profile of profiles) {
  const page = await browser.newPage();
  try {
    await page.goto(resolveCapsuleOsUrl(profile.id, BASE), { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForFunction(
      () => typeof window.CapsuleTerminalCompletion !== 'undefined'
        && typeof window.CapsuleTerminalCommandOptions !== 'undefined',
      null,
      { timeout: 60000 },
    );

    for (const check of profile.checks) {
      const result = await page.evaluate((input) => {
        const parsed = window.CapsuleTerminalCompletion.parseInputLine(input);
        let matches = [];
        if (parsed.phase === 'option') {
          matches = window.CapsuleTerminalCompletion.matchOptionCompletions(parsed.command, parsed.tokenPrefix);
        } else if (parsed.phase === 'subcommand') {
          matches = window.CapsuleTerminalCompletion.matchSubcommands
            ? window.CapsuleTerminalCompletion.matchSubcommands(parsed.command, parsed.tokenPrefix)
            : window.CapsuleTerminalCommandOptions.matchSubcommands(parsed.command, parsed.tokenPrefix);
        }
        return { phase: parsed.phase, matches };
      }, check.input);

      if (result.phase !== check.expectPhase) {
        errors.push(`${profile.id} "${check.input}": phase ${result.phase} attendu ${check.expectPhase}`);
        continue;
      }
      for (const needle of check.expectMatches) {
        if (!result.matches.includes(needle)) {
          errors.push(`${profile.id} "${check.input}": match "${needle}" absent (${result.matches.join(', ')})`);
        }
      }
    }
  } finally {
    await page.close();
  }
}

await browser.close();

if (errors.length) {
  console.error(`✗ smoke-terminal-tab-completion — ${errors.length} erreur(s)`);
  errors.forEach((e) => console.error(`  - ${e}`));
  process.exit(1);
}
console.log('✓ smoke-terminal-tab-completion OK — mint, ubuntu, rocky');
