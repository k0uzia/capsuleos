#!/usr/bin/env node
/**
 * Smoke Playwright — resize bord gauche : le bord droit ne doit pas dériver.
 * Usage : node usr/lib/capsuleos/tools/lab/smoke-window-resize-left.mjs [url]
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const require = createRequire(import.meta.url);

const defaultUrl = `file://${path.join(ROOT, 'home/RedHat/Rocky/index.html')}`;
const url = process.argv[2] || defaultUrl;

async function main() {
    const { chromium } = require('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const errors = [];

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForFunction(() => typeof window.CapsuleWindowBounds !== 'undefined', null, { timeout: 15000 });

        const result = await page.evaluate(() => {
            const win = document.querySelector('div[data-link="calculator"]');
            if (!win) {
                return { error: 'fenêtre calculator introuvable' };
            }
            win.style.display = 'flex';
            win.style.position = 'fixed';
            win.style.left = '400px';
            win.style.top = '120px';
            win.style.width = '400px';
            win.style.height = '320px';

            const bounds = window.CapsuleWindowBounds.getWorkAreaRect({});
            const beforeRight = 400 + 400;
            const clamped = window.CapsuleWindowBounds.clampSize(
                win,
                50,
                120,
                750,
                320,
                {},
                { direction: 'left' },
            );
            const afterRight = clamped.left + clamped.width;
            return {
                boundsLeft: bounds.left,
                beforeRight,
                afterRight,
                clamped,
                drift: Math.abs(afterRight - beforeRight),
            };
        });

        if (result.error) {
            errors.push(result.error);
        } else if (result.drift > 1) {
            errors.push(
                `bord droit a dérivé de ${result.drift}px (avant=${result.beforeRight}, après=${result.afterRight}, bounds.left=${result.boundsLeft})`,
            );
        }
    } catch (error) {
        errors.push(error.message);
    } finally {
        await browser.close();
    }

    if (errors.length) {
        console.error('✗ smoke-window-resize-left — échec');
        errors.forEach((e) => console.error(' ', e));
        process.exit(1);
    }
    console.log('✓ smoke-window-resize-left OK — bord droit préservé sous clamp');
}

main();
