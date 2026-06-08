#!/usr/bin/env node
import { chromium } from 'playwright';
import { openMintSlot, waitMintReady, chromePath } from './mint-smoke-open.mjs';

const browser = await chromium.launch({ headless: true, executablePath: chromePath });
const page = await browser.newPage();
await waitMintReady(page);
await openMintSlot(page, 'baobab');
await page.waitForTimeout(200);

const ready = await page.evaluate(() => ({
  init: document.getElementById('gnomeBaobabApp')?.dataset.baobabInit === 'true',
  title: document.querySelector('div[data-link="baobab"] #windowTitle')?.textContent,
  ring: document.querySelector('.gnome-baobab__ring-center')?.textContent,
}));

await page.click('.gnome-baobab__place:nth-child(2)');
await page.waitForTimeout(50);
const place = await page.evaluate(() => ({
  active: document.querySelector('.gnome-baobab__place--active .gnome-baobab__place-label')?.textContent,
  ring: document.querySelector('.gnome-baobab__ring-center')?.textContent,
  scanEnabled: !document.querySelector('.gnome-baobab__scan-btn')?.disabled,
}));

const ok = ready.init && ready.title === 'Analyseur d\'espace disque'
  && ready.ring === '62 %'
  && place.active === 'Dossier personnel' && place.ring === '34 %'
  && place.scanEnabled;

console.log(JSON.stringify({ ready, place, ok }, null, 2));
await browser.close();
process.exit(ok ? 0 : 1);
