#!/usr/bin/env node
/**
 * Génère OS/linux/families/.../index.html (facades avec <base>).
 * Usage : node usr/lib/capsuleos/tools/linux/build-linux-facades.mjs
 */
import fs from 'fs';
import {
    LINUX_SKIN_FACADES,
    ROOT,
    buildFacadeHtml,
    readCanonicalSkinIndex,
    expectedFacadePath
} from './linux-skin-facade-lib.mjs';

function main() {
    for (const { facade, home } of LINUX_SKIN_FACADES) {
        const canonical = readCanonicalSkinIndex(home);
        const facadeHtml = buildFacadeHtml(home, canonical, facade);
        const facadePath = expectedFacadePath(facade);
        fs.mkdirSync(path.dirname(facadePath), { recursive: true });
        fs.writeFileSync(facadePath, facadeHtml, 'utf8');
        console.log(`Facade: OS/linux/${facade}/index.html → ${home}/`);
    }
}

main();
