#!/usr/bin/env node
/**
 * Collecte inventaire Windows 11 via SSH (PowerShell) — scaffold P0.
 *
 * Prérequis : OpenSSH Server sur la VM, entrée windows-11 dans lab-inventory.json.
 *
 * Usage :
 *   node usr/lib/capsuleos/tools/lab/collect-windows-inventory.mjs --id windows-11 --write
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadHost, runSshCommand } from './lab-ssh.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const PS_INVENTORY = [
  '$ci = Get-ComputerInfo',
  '$vc = Get-CimInstance Win32_VideoController | Select-Object -First 1 CurrentHorizontalResolution, CurrentVerticalResolution',
  '[PSCustomObject]@{',
  '  Hostname = $env:COMPUTERNAME',
  '  ProductName = $ci.WindowsProductName',
  '  OsBuildNumber = $ci.OsBuildNumber',
  '  OsVersion = $ci.OsVersion',
  '  DisplayLocale = $ci.OsLocale',
  '  HorizontalResolution = $vc.CurrentHorizontalResolution',
  '  VerticalResolution = $vc.CurrentVerticalResolution',
  '} | ConvertTo-Json -Compress',
].join('; ');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const opts = { id: 'windows-11', write: false };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--id' && args[i + 1]) opts.id = args[++i];
    else if (args[i] === '--write') opts.write = true;
  }
  return opts;
};

const main = () => {
  const opts = parseArgs();
  const host = loadHost(opts.id);
  const { stdout } = runSshCommand(host, `powershell -NoProfile -Command "${PS_INVENTORY.replace(/"/g, '\\"')}"`);
  const vmFacts = JSON.parse(stdout);
  const outPath = path.join(ROOT, 'root/docs/inventaires', `${opts.id}-vm.json`);
  const base = fs.existsSync(outPath)
    ? JSON.parse(fs.readFileSync(outPath, 'utf8'))
    : { version: 1, registryId: opts.id };

  const inventory = {
    ...base,
    collectedAt: new Date().toISOString(),
    collectionMethod: 'ssh-powershell',
    connectivity: {
      ...(base.connectivity || {}),
      hostIp: host.ssh.split('@')[1],
      ping: true,
      ssh: true,
      probeType: host.probeType || 'ssh-x11',
      authStatus: 'ok',
    },
    distribution: {
      ...(base.distribution || {}),
      description: vmFacts.ProductName,
      build: String(vmFacts.OsBuildNumber),
      release: base.distribution?.release || host.windowsRelease || null,
      edition: base.distribution?.edition || host.edition || null,
      locale: vmFacts.DisplayLocale || base.distribution?.locale || null,
    },
    lab: {
      ...(base.lab || {}),
      ssh: host.ssh,
      sshIdentity: host.sshIdentity,
      virshName: host.virshName,
      capsuleUrl: host.capsuleUrl,
      display: host.display || base.lab?.display,
      hostname: vmFacts.Hostname,
    },
    desktop: {
      ...(base.desktop || {}),
      resolution: {
        width: vmFacts.HorizontalResolution,
        height: vmFacts.VerticalResolution,
      },
    },
  };

  if (opts.write) {
    fs.writeFileSync(outPath, `${JSON.stringify(inventory, null, 2)}\n`);
    console.log(`✓ inventaire écrit: ${outPath}`);
  } else {
    console.log(JSON.stringify(inventory, null, 2));
  }
};

main();
