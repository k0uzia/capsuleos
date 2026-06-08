#!/usr/bin/env node
/**
 * Injecte les refs ManΣ drift (playbook rewrite-ref) dans index.html Mint.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/generate-mint-drift-refs.mjs
 *   node usr/lib/capsuleos/tools/lab/generate-mint-drift-refs.mjs --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildPlaybook } from './manifest-playbook-lib.mjs';
import { skinIndexPath } from './apps-catalog-lib.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');
const REGISTRY_ID = 'linux-mint';
const BLOCK_ID = 'mint-manifest-asset-refs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  return { write: args.includes('--write') };
};

const assetSrc = (capsuleRelative) => {
  const rel = String(capsuleRelative || '').replace(/^\/+/, '');
  return `../../../usr/share/capsuleos/assets/${rel}`;
};

const buildBlockHtml = (driftItems) => {
  const lines = [`        <div hidden aria-hidden="true" id="${BLOCK_ID}">`];
  const seen = new Set();
  driftItems.forEach((item) => {
    const rel = item.capsuleRelative;
    if (!rel || seen.has(rel)) return;
    seen.add(rel);
    lines.push(`            <img src="${assetSrc(rel)}" alt="">`);
  });
  lines.push('        </div>');
  return lines.join('\n');
};

const injectBlock = (indexHtml, blockHtml) => {
  const blockRe = new RegExp(
    `[ \\t]*<div hidden aria-hidden="true" id="${BLOCK_ID}">[\\s\\S]*?</div>`,
    'm',
  );
  if (blockRe.test(indexHtml)) {
    return indexHtml.replace(blockRe, blockHtml);
  }
  const anchor = '<div hidden aria-hidden="true" id="mint-catalog-asset-refs">';
  if (indexHtml.includes(anchor)) {
    const closeIdx = indexHtml.indexOf('</div>', indexHtml.indexOf(anchor));
    if (closeIdx !== -1) {
      const insertAt = closeIdx + '</div>'.length;
      return `${indexHtml.slice(0, insertAt)}\n${blockHtml}${indexHtml.slice(insertAt)}`;
    }
  }
  const windowsClose = indexHtml.indexOf('    </div>\n    <footer');
  if (windowsClose !== -1) {
    return `${indexHtml.slice(0, windowsClose)}\n${blockHtml}\n${indexHtml.slice(windowsClose)}`;
  }
  throw new Error(`Impossible d'injecter #${BLOCK_ID} dans index.html`);
};

const main = () => {
  const opts = parseArgs();
  const playbook = buildPlaybook(REGISTRY_ID);
  const driftItems = playbook.items.filter((i) => i.action === 'rewrite-ref');
  const blockHtml = buildBlockHtml(driftItems);
  const indexPath = skinIndexPath(REGISTRY_ID);
  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  const nextHtml = injectBlock(indexHtml, blockHtml);

  const report = {
    registryId: REGISTRY_ID,
    driftCount: driftItems.length,
    uniqueRefs: (blockHtml.match(/<img /g) || []).length,
    blockId: BLOCK_ID,
    indexPath: path.relative(ROOT, indexPath),
  };

  if (opts.write) {
    fs.writeFileSync(indexPath, nextHtml, 'utf8');
    report.written = true;
  } else {
    report.written = false;
    report.tip = 'Ajouter --write pour persister';
  }

  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
};

main();
