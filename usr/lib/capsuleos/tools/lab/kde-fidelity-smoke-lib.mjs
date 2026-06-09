/**
 * Exécution Playwright générique — smokePlan scénarios Cred* KDE Neon.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '../../../../..');

export const resolveKdeNeonUrl = () =>
  process.env.CAPSULE_KDE_NEON_URL
  || `${process.env.CAPSULE_HTTP_BASE || 'http://127.0.0.1:5500'}/home/Debian/KDE-Neon/index.html`;

export const findChromePath = () =>
  [
    process.env.PLAYWRIGHT_CHROME,
    '/usr/bin/google-chrome',
    '/usr/bin/chromium-browser',
    `${process.env.HOME}/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome`,
  ].find((p) => p && fs.existsSync(p));

export const runPrep = async (page, prep = []) => {
  for (const step of prep) {
    await runAction(page, step);
  }
};

export const runAction = async (page, step) => {
  const type = step.type;
  if (type === 'wait') {
    await page.waitForTimeout(step.ms || 200);
    return;
  }
  if (type === 'openSlot') {
    await page.evaluate((slot) => {
      window.openWindowByDataLink(slot);
    }, step.slot);
    await page.waitForTimeout(step.ms || 350);
    return;
  }
  if (type === 'openKickoff') {
    await page.click('.taskbar-pins__launcher[data-link="mainMenu"], footer nav a[data-link="mainMenu"]');
    await page.waitForSelector('#mainMenu', { state: 'visible', timeout: 10000 });
    await page.waitForTimeout(step.ms || 200);
    return;
  }
  if (type === 'click') {
    await page.click(step.selector, { timeout: step.timeout || 8000 });
    return;
  }
  if (type === 'fill') {
    await page.fill(step.selector, step.value, { timeout: step.timeout || 8000 });
    if (step.submit) {
      await page.keyboard.press('Enter');
    }
    return;
  }
  if (type === 'eval') {
    await page.evaluate((expr) => {
      // eslint-disable-next-line no-eval
      eval(expr);
    }, step.expr);
    await page.waitForTimeout(step.ms || 200);
    return;
  }
  throw new Error(`action inconnue: ${type}`);
};

export const runAssertion = async (page, assertion, errors) => {
  const type = assertion.type;
  try {
    if (type === 'selectorVisible') {
      const el = await page.waitForSelector(assertion.selector, {
        state: assertion.state || 'visible',
        timeout: assertion.timeout || 8000,
      });
      if (!el) errors.push(`selectorVisible: ${assertion.selector}`);
      return;
    }
    if (type === 'selectorHidden') {
      const el = await page.waitForSelector(assertion.selector, {
        state: 'attached',
        timeout: assertion.timeout || 8000,
      });
      const hidden = await el.evaluate((node) => node.hidden === true || node.getAttribute('hidden') !== null);
      if (!hidden) errors.push(`selectorHidden: ${assertion.selector}`);
      return;
    }
    if (type === 'selectorMin') {
      const count = await page.locator(assertion.selector).count();
      if (count < (assertion.min ?? 1)) {
        errors.push(`selectorMin ${assertion.selector}: ${count} < ${assertion.min}`);
      }
      return;
    }
    if (type === 'childCountMin') {
      const count = await page.locator(assertion.selector).count();
      if (count < (assertion.min ?? 1)) {
        errors.push(`childCountMin ${assertion.selector}: ${count} < ${assertion.min}`);
      }
      return;
    }
    if (type === 'slotVisible') {
      const ok = await page.evaluate((slot) => {
        const root = document.querySelector(`div.windowElement[data-link="${slot}"], #${slot}`);
        return !!(root && root.style.display !== 'none');
      }, assertion.slot);
      if (!ok) errors.push(`slotVisible: ${assertion.slot}`);
      return;
    }
    if (type === 'evalTruthy') {
      const ok = await page.evaluate((expr) => {
        // eslint-disable-next-line no-eval
        return !!eval(expr);
      }, assertion.expr);
      if (!ok) errors.push(`evalTruthy: ${assertion.expr}`);
      return;
    }
    errors.push(`assertion inconnue: ${type}`);
  } catch (err) {
    errors.push(`${type}: ${err.message}`);
  }
};

export const runSmokePlan = async (page, plan, errors) => {
  await runPrep(page, plan.prep || []);
  for (const action of plan.actions || []) {
    await runAction(page, action);
  }
  for (const assertion of plan.assertions || []) {
    await runAssertion(page, assertion, errors);
  }
};
