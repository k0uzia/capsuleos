#!/usr/bin/env node
/** @deprecated Utiliser validate-desktop-window-boot.mjs */
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const r = spawnSync(process.execPath, ['usr/lib/capsuleos/tools/validate-desktop-window-boot.mjs'], {
    cwd: ROOT,
    stdio: 'inherit',
});
process.exit(r.status || 0);
