#!/usr/bin/env node
/**
 * Normalise les médias raster pour le web (WebP) — spec prepare-web-media.
 * Usage :
 *   node usr/lib/capsuleos/tools/prepare-web-media.mjs --vendor fedora --rewrite-refs
 *   node usr/lib/capsuleos/tools/prepare-web-media.mjs --dir usr/share/capsuleos/assets/images/vendors/fedora/wallpaper --dry-run
 */
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../..');
const ASSETS = path.join(ROOT, 'usr/share/capsuleos/assets');
const CONTRACT_PATH = path.join(ROOT, 'etc/capsuleos/contracts/web-media-prepare.json');

const args = process.argv.slice(2);
const flags = {
  vendor: null,
  dir: null,
  profiles: [],
  only: null,
  rewriteRefs: false,
  keepSource: false,
  dryRun: false,
  verbose: false,
  json: null,
  forceRole: null,
  repairManifest: false,
  wallpaperThumbnails: false,
};

for (let i = 0; i < args.length; i += 1) {
  const a = args[i];
  if (a === '--vendor') {
    flags.vendor = args[++i];
  } else if (a === '--dir') {
    flags.dir = args[++i];
  } else if (a === '--profile') {
    flags.profiles.push(args[++i]);
  } else if (a === '--only') {
    flags.only = args[++i];
  } else if (a === '--rewrite-refs') {
    flags.rewriteRefs = true;
  } else if (a === '--keep-source') {
    flags.keepSource = true;
  } else if (a === '--dry-run') {
    flags.dryRun = true;
  } else if (a === '--verbose') {
    flags.verbose = true;
  } else if (a === '--json') {
    flags.json = args[++i];
  } else if (a === '--force-role') {
    flags.forceRole = args[++i];
  } else if (a === '--repair-manifest') {
    flags.repairManifest = true;
  } else if (a === '--wallpaper-thumbnails') {
    flags.wallpaperThumbnails = true;
  } else if (a === '--help' || a === '-h') {
    console.log(`Usage: node usr/lib/capsuleos/tools/prepare-web-media.mjs [options]
  --vendor <id>       vendors/<id>/
  --dir <path>        répertoire racine (relatif repo ou absolu)
  --profile <name>    forcer profil (wallpaper, icon-raster, …)
  --only <glob>       filtre sous-chaîne chemin (ex. .jxl)
  --rewrite-refs      réécrire HTML/CSS/JS/JSON
  --keep-source       ne pas supprimer les sources
  --dry-run           rapport sans écriture
  --repair-manifest   recréer sidecars pour webp existants
  --wallpaper-thumbnails  générer wallpaper/thumbnails/*-thumb.webp
  --json <file>       rapport JSON`);
    process.exit(0);
  } else {
    console.error(`Option inconnue: ${a}`);
    process.exit(1);
  }
}

const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, 'utf8'));
const SCAN_ROOTS = contract.zones.scanRootsForRewrite.map((r) => path.join(ROOT, r));
const INPUT_EXTS = new Set(['.jxl', '.png', '.jpg', '.jpeg', '.tiff', '.tif', '.bmp', '.gif', '.ico']);

const sha256 = (file) => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

const cmdExists = (name) => spawnSync('which', [name], { encoding: 'utf8' }).status === 0;

const backends = {
  sharp: null,
  ffmpeg: cmdExists('ffmpeg'),
  convert: cmdExists('convert'),
  djxl: cmdExists('djxl'),
  cwebp: cmdExists('cwebp'),
};

async function loadSharp() {
  try {
    backends.sharp = (await import('sharp')).default;
  } catch {
    backends.sharp = null;
  }
}

function pickEncoder() {
  if (backends.sharp) {
    return 'sharp';
  }
  if (backends.djxl && backends.cwebp) {
    return 'djxl+cwebp';
  }
  if (backends.ffmpeg && backends.convert) {
    return 'ffmpeg+convert';
  }
  return null;
}

let encoder = null;

function globMatch(rel, pattern) {
  const re = new RegExp(
    `^${pattern
      .replace(/\*\*/g, '\0GLOBSTAR\0')
      .replace(/\*/g, '[^/]*')
      .replace(/\./g, '\\.')
      .replace(/\0GLOBSTAR\0/g, '.*')}$`,
    'i',
  );
  return re.test(rel);
}

function detectRole(relAssets) {
  if (flags.forceRole) {
    return flags.forceRole;
  }
  if (relAssets.includes('/wallpaper/thumbnails/')) {
    return 'wallpaper-thumb';
  }
  for (const [role, cfg] of Object.entries(contract.roles)) {
    const excludes = cfg.excludePatterns || [];
    if (excludes.some((pattern) => globMatch(relAssets, pattern))) {
      continue;
    }
    for (const pattern of cfg.pathPatterns) {
      if (globMatch(relAssets, pattern)) {
        return role;
      }
    }
  }
  return 'unknown';
}

function profileFor(role) {
  if (flags.profiles.length === 1) {
    return contract.profiles[flags.profiles[0]];
  }
  const roleCfg = contract.roles[role];
  const name = roleCfg?.defaultProfile || 'preserve';
  return contract.profiles[name];
}

function imageSize(file) {
  if (backends.sharp) {
    const meta = backends.sharp(file).metadata();
    return meta.then((m) => ({ width: m.width || 0, height: m.height || 0 }));
  }
  const r = spawnSync('identify', ['-format', '%w %h', file], { encoding: 'utf8' });
  if (r.status === 0) {
    const [w, h] = r.stdout.trim().split(/\s+/).map(Number);
    return Promise.resolve({ width: w || 0, height: h || 0 });
  }
  return Promise.resolve({ width: 0, height: 0 });
}

async function transcode(inputPath, outputPath, profile, ext) {
  const lossless = Boolean(profile.lossless);
  const quality = profile.quality ?? 85;

  if (encoder === 'sharp') {
    let pipe = backends.sharp(inputPath, { limitInputPixels: false });
    if (lossless) {
      await pipe.webp({ lossless: true }).toFile(outputPath);
    } else {
      await pipe.webp({ quality, effort: profile.effort ?? 4 }).toFile(outputPath);
    }
    return 'sharp';
  }

  if (encoder === 'djxl+cwebp' && ext === '.jxl') {
    const tmpPng = path.join(os.tmpdir(), `capsule-jxl-${crypto.randomBytes(6).toString('hex')}.png`);
    const dj = spawnSync('djxl', [inputPath, tmpPng], { stdio: 'pipe' });
    if (dj.status !== 0) {
      throw new Error(`djxl: ${dj.stderr?.toString() || 'échec'}`);
    }
    const cwArgs = lossless
      ? ['-lossless', tmpPng, '-o', outputPath]
      : ['-q', String(quality), tmpPng, '-o', outputPath];
    const cw = spawnSync('cwebp', cwArgs, { stdio: 'pipe' });
    fs.unlinkSync(tmpPng);
    if (cw.status !== 0) {
      throw new Error(`cwebp: ${cw.stderr?.toString() || 'échec'}`);
    }
    return 'djxl+cwebp';
  }

  if (encoder === 'ffmpeg+convert') {
    let srcForConvert = inputPath;
    let tmpPng = null;
    if (ext === '.jxl' || ext === '.gif') {
      tmpPng = path.join(os.tmpdir(), `capsule-decode-${crypto.randomBytes(6).toString('hex')}.png`);
      const ff = spawnSync(
        'ffmpeg',
        ['-hide_banner', '-loglevel', 'error', '-y', '-i', inputPath, '-frames:v', '1', tmpPng],
        { stdio: 'pipe' },
      );
      if (ff.status !== 0) {
        throw new Error(`ffmpeg: ${ff.stderr?.toString() || 'échec'}`);
      }
      srcForConvert = tmpPng;
    }
    const cvArgs = lossless
      ? ['-define', 'webp:lossless=true', srcForConvert, outputPath]
      : ['-quality', String(quality), srcForConvert, outputPath];
    const cv = spawnSync('convert', cvArgs, { stdio: 'pipe' });
    if (tmpPng && fs.existsSync(tmpPng)) {
      fs.unlinkSync(tmpPng);
    }
    if (cv.status !== 0) {
      throw new Error(`convert: ${cv.stderr?.toString() || 'échec'}`);
    }
    return 'ffmpeg+convert';
  }

  throw new Error(`Encodage impossible pour ${inputPath}`);
}

function sidecarPath(webpPath) {
  return `${webpPath}.json`;
}

function readSidecar(webpPath) {
  const sc = sidecarPath(webpPath);
  if (!fs.existsSync(sc)) {
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(sc, 'utf8'));
  } catch {
    return null;
  }
}

function collectTargets() {
  let roots = [];
  if (flags.dir) {
    roots.push(path.isAbsolute(flags.dir) ? flags.dir : path.join(ROOT, flags.dir));
  } else if (flags.vendor) {
    roots.push(path.join(ASSETS, 'images/vendors', flags.vendor));
  } else {
    roots.push(ASSETS);
  }

  const files = [];
  const walk = (dir) => {
    if (!fs.existsSync(dir)) {
      return;
    }
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) {
        walk(full);
        continue;
      }
      const ext = path.extname(name).toLowerCase();
      if (!INPUT_EXTS.has(ext)) {
        continue;
      }
      const relAssets = path.relative(ASSETS, full).split(path.sep).join('/');
      if (flags.only && !relAssets.includes(flags.only) && !full.includes(flags.only)) {
        continue;
      }
      files.push({ full, relAssets, ext });
    }
  };
  roots.forEach(walk);

  const rank = { '.jxl': 4, '.png': 3, '.jpeg': 2, '.jpg': 2, '.tiff': 1, '.tif': 1, '.bmp': 1, '.gif': 1, '.ico': 1 };
  const byBase = new Map();
  for (const item of files) {
    const baseKey = item.full.slice(0, -item.ext.length);
    const cur = byBase.get(baseKey);
    if (!cur || (rank[item.ext] || 0) > (rank[cur.ext] || 0)) {
      byBase.set(baseKey, item);
    }
  }
  return [...byBase.values()];
}

const THUMB_MAX_WIDTH = 512;
const THUMB_QUALITY = 78;

async function generateWallpaperThumbnails(vendor) {
  const wallDir = path.join(ASSETS, 'images/vendors', vendor, 'wallpaper');
  const thumbDir = path.join(wallDir, 'thumbnails');
  if (!fs.existsSync(wallDir)) {
    return { created: [], skipped: [] };
  }
  fs.mkdirSync(thumbDir, { recursive: true });
  const created = [];
  const skipped = [];
  const sources = fs.readdirSync(wallDir).filter((name) => {
    if (name === 'thumbnails') {
      return false;
    }
    return /\.(webp|png|jpe?g|jxl)$/i.test(name);
  });

  for (const name of sources) {
    const full = path.join(wallDir, name);
    if (!fs.statSync(full).isFile()) {
      continue;
    }
    const ext = path.extname(name).toLowerCase();
    const stem = name.replace(/\.[^.]+$/, '');
    const out = path.join(thumbDir, `${stem}-thumb.webp`);
    if (fs.existsSync(out)) {
      skipped.push(path.relative(ASSETS, out));
      continue;
    }
    let usedEncoder = 'sharp';
    if (backends.sharp) {
      await backends.sharp(full, { limitInputPixels: false })
        .resize({ width: THUMB_MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: THUMB_QUALITY, effort: 4 })
        .toFile(out);
    } else if (backends.convert) {
      usedEncoder = 'convert';
      const cv = spawnSync(
        'convert',
        [full, '-resize', `${THUMB_MAX_WIDTH}x>`, '-quality', String(THUMB_QUALITY), out],
        { encoding: 'utf8' },
      );
      if (cv.status !== 0) {
        throw new Error(`convert thumb: ${cv.stderr || 'échec'}`);
      }
    } else if (backends.cwebp) {
      usedEncoder = 'cwebp';
      const tmpPng = path.join(os.tmpdir(), `capsule-thumb-${crypto.randomBytes(6).toString('hex')}.png`);
      if (ext === '.jxl' && backends.djxl) {
        spawnSync('djxl', [full, tmpPng], { stdio: 'pipe' });
      } else if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        fs.copyFileSync(full, tmpPng);
      } else {
        throw new Error(`thumb: format non supporté sans sharp (${ext})`);
      }
      const cw = spawnSync('cwebp', ['-q', String(THUMB_QUALITY), '-resize', String(THUMB_MAX_WIDTH), 0, tmpPng, '-o', out], {
        stdio: 'pipe',
      });
      if (fs.existsSync(tmpPng)) {
        fs.unlinkSync(tmpPng);
      }
      if (cw.status !== 0) {
        throw new Error(`cwebp thumb: ${cw.stderr?.toString() || 'échec'}`);
      }
    } else {
      throw new Error('Aucun backend pour --wallpaper-thumbnails (sharp, convert ou cwebp)');
    }
    const size = await imageSize(out);
    const relOut = path.relative(ASSETS, out).split(path.sep).join('/');
    const sc = {
      version: 1,
      source: path.relative(ASSETS, full).split(path.sep).join('/'),
      role: 'wallpaper-thumb',
      profile: 'wallpaper-thumb',
      encoder: usedEncoder,
      options: { maxWidth: THUMB_MAX_WIDTH, quality: THUMB_QUALITY },
      width: size.width,
      height: size.height,
      preparedAt: new Date().toISOString(),
    };
    fs.writeFileSync(sidecarPath(out), `${JSON.stringify(sc, null, 2)}\n`);
    created.push(relOut);
  }
  return { created, skipped };
}

function rewriteReferences(replacements) {
  const exts = ['.html', '.css', '.js', '.json', '.mjs'];
  const touched = [];
  for (const root of SCAN_ROOTS) {
    if (!fs.existsSync(root)) {
      continue;
    }
    const walk = (dir) => {
      for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) {
          if (name === 'node_modules' || name === '.git' || name === 'generated') {
            continue;
          }
          walk(full);
          continue;
        }
        if (!exts.some((e) => name.endsWith(e))) {
          continue;
        }
        let text = fs.readFileSync(full, 'utf8');
        let changed = false;
        for (const [from, to] of replacements) {
          if (text.includes(from)) {
            text = text.split(from).join(to);
            changed = true;
          }
        }
        if (changed) {
          if (!flags.dryRun) {
            fs.writeFileSync(full, text);
          }
          touched.push(path.relative(ROOT, full));
        }
      }
    };
    walk(root);
  }
  return touched;
}

async function main() {
  await loadSharp();
  encoder = pickEncoder();
  if (!encoder && !flags.dryRun) {
    console.error('✗ Aucun backend disponible (sharp, djxl+cwebp, ou ffmpeg+convert).');
    console.error('  Hint: dnf install libjxl-tools libwebp-tools  # ou npm i sharp (dev)');
    process.exit(2);
  }

  const report = {
    encoder: encoder || '(dry-run)',
    processed: [],
    skipped: [],
    errors: [],
    rewrites: [],
  };

  if (flags.repairManifest && !flags.dryRun) {
    const walk = (dir) => {
      for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) {
          walk(full);
          continue;
        }
        if (!name.endsWith('.webp')) {
          continue;
        }
        if (readSidecar(full)) {
          continue;
        }
        const rel = path.relative(ASSETS, full).split(path.sep).join('/');
        const role = detectRole(rel);
        const sc = {
          version: 1,
          source: null,
          sourceSha256: null,
          output: rel,
          outputSha256: sha256(full),
          role,
          profile: contract.roles[role]?.defaultProfile || 'unknown',
          encoder: 'repair',
          options: {},
          width: 0,
          height: 0,
          preparedAt: new Date().toISOString(),
          note: 'repair-manifest',
        };
        fs.writeFileSync(sidecarPath(full), `${JSON.stringify(sc, null, 2)}\n`);
      }
    };
    if (fs.existsSync(ASSETS)) {
      walk(ASSETS);
    }
  }

  const targets = collectTargets();
  const replacements = [];

  for (const item of targets) {
    const { full, relAssets, ext } = item;
    const role = detectRole(relAssets);
    const profile = profileFor(role);

    if (!profile || profile.action === 'preserve') {
      report.skipped.push({ rel: relAssets, reason: 'preserve' });
      continue;
    }

    if (!profile.inputFormats.includes(ext.slice(1))) {
      report.skipped.push({ rel: relAssets, reason: 'format' });
      continue;
    }

    const base = full.slice(0, -ext.length);
    const suffix = profile.suffix || '';
    const outPath = `${base}${suffix}.webp`;
    const outRel = path.relative(ASSETS, outPath).split(path.sep).join('/');

    if (fs.existsSync(outPath)) {
      const sc = readSidecar(outPath);
      const srcHash = sha256(full);
      if (sc?.sourceSha256 === srcHash) {
        report.skipped.push({ rel: relAssets, reason: 'up-to-date' });
        continue;
      }
      if (flags.repairManifest) {
        report.skipped.push({ rel: relAssets, reason: 'webp-exists' });
        continue;
      }
    }

    if (flags.dryRun) {
      report.processed.push({ rel: relAssets, output: outRel, action: 'would-transcode' });
      replacements.push([path.basename(full), path.basename(outPath)]);
      continue;
    }

    try {
      const usedEncoder = await transcode(full, outPath, profile, ext);
      const size = await imageSize(outPath);
      const srcSize = fs.statSync(full).size;
      const outSize = fs.statSync(outPath).size;
      const ratio = outSize / srcSize;

      if (profile.maxSizeRatioVsSource && ratio > profile.maxSizeRatioVsSource) {
        fs.unlinkSync(outPath);
        report.skipped.push({ rel: relAssets, reason: `too-large (${ratio.toFixed(2)})` });
        continue;
      }

      const sc = {
        version: 1,
        source: relAssets,
        sourceSha256: sha256(full),
        output: outRel,
        outputSha256: sha256(outPath),
        role,
        profile: contract.roles[role]?.defaultProfile || flags.profiles[0] || 'unknown',
        encoder: usedEncoder,
        options: {
          quality: profile.quality,
          lossless: profile.lossless,
        },
        width: size.width,
        height: size.height,
        preparedAt: new Date().toISOString(),
      };
      fs.writeFileSync(sidecarPath(outPath), `${JSON.stringify(sc, null, 2)}\n`);

      if (profile.deleteSource && !flags.keepSource) {
        fs.unlinkSync(full);
      }

      report.processed.push({
        rel: relAssets,
        output: outRel,
        encoder: usedEncoder,
        bytes: outSize,
      });
      const outBase = path.basename(outPath);
      const stem = path.basename(base);
      replacements.push([path.basename(full), outBase]);
      replacements.push([`${stem}.png`, outBase]);
      replacements.push([`${stem}.jxl`, outBase]);
      replacements.push([`${stem}.jpeg`, outBase]);
      replacements.push([`${stem}.jpg`, outBase]);
      if (flags.vendor) {
        const vendorFrom = `vendors/${flags.vendor}/${relAssets.replace(/^images\/vendors\/[^/]+\//, '')}`;
        const vendorTo = vendorFrom.replace(/\.(png|jpe?g|jxl|gif|ico)$/i, '.webp');
        replacements.push([vendorFrom, vendorTo]);
      }

      if (!flags.keepSource) {
        for (const staleExt of ['.png', '.jpg', '.jpeg', '.jxl']) {
          const stale = `${base}${staleExt}`;
          if (stale !== full && fs.existsSync(stale)) {
            fs.unlinkSync(stale);
          }
        }
      }
    } catch (err) {
      report.errors.push({ rel: relAssets, error: err.message });
    }
  }

  if (flags.rewriteRefs && replacements.length) {
    const uniq = [...new Map(replacements.map((r) => [r[0], r])).values()];
    report.rewrites = rewriteReferences(uniq);
  }

  if (flags.wallpaperThumbnails && flags.vendor && !flags.dryRun) {
    const thumbs = await generateWallpaperThumbnails(flags.vendor);
    report.wallpaperThumbnails = thumbs;
    if (thumbs.created.length) {
      console.log(`  miniatures fonds : ${thumbs.created.length} créée(s)`);
    }
  }

  if (!flags.dryRun && report.processed.length) {
    const indexPath = path.join(ASSETS, 'web-media-index.json');
    const index = fs.existsSync(indexPath)
      ? JSON.parse(fs.readFileSync(indexPath, 'utf8'))
      : { version: 1, entries: [] };
    const byOut = new Map(index.entries.map((e) => [e.output, e]));
    for (const row of report.processed) {
      if (!row.output) {
        continue;
      }
      byOut.set(row.output, {
        output: row.output,
        source: row.rel,
        preparedAt: new Date().toISOString(),
        encoder: row.encoder,
      });
    }
    index.entries = [...byOut.values()].sort((a, b) => a.output.localeCompare(b.output));
    index.updatedAt = new Date().toISOString();
    fs.writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);
  }

  if (flags.json) {
    fs.writeFileSync(flags.json, `${JSON.stringify(report, null, 2)}\n`);
  }

  if (flags.verbose || flags.dryRun) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(
      `✓ prepare-web-media — ${report.processed.length} converti(s), ${report.skipped.length} ignoré(s), ${report.errors.length} erreur(s)`,
    );
    if (report.rewrites.length) {
      console.log(`  refs : ${report.rewrites.length} fichier(s)`);
    }
  }

  if (report.errors.length) {
    report.errors.forEach((e) => console.error(`  ✗ ${e.rel}: ${e.error}`));
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
