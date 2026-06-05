#!/usr/bin/env node
/**
 * Vérifie que les façades pick-os reflètent home/ (sinon pick-os ≠ skin direct).
 * Usage : node usr/lib/capsuleos/tools/linux/validate-linux-facades.mjs
 */
import { validateLinuxFacadesSync } from './linux-skin-facade-lib.mjs';

const errors = validateLinuxFacadesSync();

if (errors.length) {
    console.error('validate-linux-facades — échec\n');
    errors.forEach((e) => console.error(`  ✗ ${e}`));
    process.exit(1);
}
console.log('✓ validate-linux-facades OK — façades alignées sur home/');
