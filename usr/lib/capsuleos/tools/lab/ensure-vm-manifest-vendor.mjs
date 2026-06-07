#!/usr/bin/env node
/**
 * Assure une entrée catalogue médias pour le vendor du registryId (futurs OS).
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/ensure-vm-manifest-vendor.mjs --id linux-zorin --write
 */
import {
  scaffoldVendorEntry,
  writeMediaCatalogContract,
  resolveVendorMediaSpec,
  vendorIdForRegistry,
  toolkitIdForRegistry,
} from './vm-manifest-media-catalog-lib.mjs';

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'linux-ubuntu', write: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
  }
  return opts;
};

const main = () => {
  const opts = parseArgs();
  const result = scaffoldVendorEntry(opts.id);
  if (result.created && opts.write) {
    writeMediaCatalogContract(result.catalog);
    console.log(`✓ vendor ajouté: ${result.vendorId} (extends toolkit:${result.toolkitId})`);
  } else if (result.created) {
    console.log(JSON.stringify(result.stub, null, 2));
    console.log('Ajouter --write pour persister dans vm-manifest-media-catalog.json');
  } else {
    console.log(`✓ vendor ${result.vendorId} déjà présent`);
  }
  const spec = resolveVendorMediaSpec(opts.id);
  console.log(`  iconPack=${spec.iconPack} mimetypes=${spec.mimetypes?.length || 0}`);
};

main();
