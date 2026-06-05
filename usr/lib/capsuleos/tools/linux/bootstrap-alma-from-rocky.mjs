#!/usr/bin/env node
/**
 * Clone le skin Rocky → AlmaLinux (GNOME) et adapte les identifiants.
 * Usage : node usr/lib/capsuleos/tools/linux/bootstrap-alma-from-rocky.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../../../../..');

const PAIRS = [
    ['home/RedHat/Rocky', 'home/RedHat/Alma'],
    ['OS/linux/families/redhat/rocky', 'OS/linux/families/redhat/alma']
];

function copyDir(src, dest) {
    fs.cpSync(path.join(ROOT, src), path.join(ROOT, dest), { recursive: true });
}

function walk(dir, fn) {
    for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) walk(full, fn);
        else fn(full);
    }
}

function adaptFile(filePath) {
    if (!/\.(html|css|js|json|md)$/i.test(filePath)) return;
    let text = fs.readFileSync(filePath, 'utf8');
    text = text
        .replace(/rocky-overrides\.css/g, 'alma-overrides.css')
        .replace(/linux-rocky/g, 'linux-alma')
        .replace(/Rocky Linux/g, 'AlmaLinux')
        .replace(/rocky-clock-date/g, 'alma-clock-date')
        .replace(/updateRockyDate/g, 'updateAlmaDate')
        .replace(/rocky-checklist/g, 'alma-checklist')
        .replace(/data-skin="rocky"/g, 'data-skin="alma"')
        .replace(/id="rocky"/g, 'id="alma"')
        .replace(/#rocky/g, '#alma')
        .replace(/body#rocky/g, 'body#alma')
        .replace(/CAPSULE_TERMINAL_PROFILE": "rocky"/g, 'CAPSULE_TERMINAL_PROFILE": "alma"')
        .replace(/CAPSULE_EMBED_SKIN_KEY": "rocky"/g, 'CAPSULE_EMBED_SKIN_KEY": "alma"')
        .replace(/"bodyId": "rocky"/g, '"bodyId": "alma"')
        .replace(/"embedKey": "rocky"/g, '"embedKey": "alma"')
        .replace(/families\/redhat\/rocky/g, 'families/redhat/alma')
        .replace(/home\/RedHat\/Rocky/g, 'home/RedHat/Alma')
        .replace(/fedora-overview__brand">rocky/g, 'fedora-overview__brand">alma')
        .replace(/"vendor": "rocky"/g, '"vendor": "alma"')
        .replace(/vendors\/rocky/g, 'vendors/rocky'); /* assets Rocky en attendant pack Alma */
    fs.writeFileSync(filePath, text, 'utf8');
}

for (const [src, dest] of PAIRS) {
    const destPath = path.join(ROOT, dest);
    if (fs.existsSync(destPath)) {
        fs.rmSync(destPath, { recursive: true });
    }
    copyDir(src, dest);
    walk(destPath, adaptFile);
    console.log(`Bootstrap ${dest}`);
}

const overridesSrc = path.join(ROOT, 'home/RedHat/Alma/rocky-overrides.css');
const overridesDest = path.join(ROOT, 'home/RedHat/Alma/alma-overrides.css');
if (fs.existsSync(overridesSrc)) {
    let css = fs.readFileSync(overridesSrc, 'utf8');
    css = css.replace(/Rocky Linux/g, 'AlmaLinux').replace(/#rocky/g, '#alma');
    fs.writeFileSync(overridesDest, css, 'utf8');
    fs.unlinkSync(overridesSrc);
}

const profileData = path.join(ROOT, 'home/RedHat/Alma/content/profile-data.js');
if (fs.existsSync(profileData)) {
    let js = fs.readFileSync(profileData, 'utf8');
    js = js.replace(
        /tagline: '[^']*'/,
        "tagline: 'Distribution entreprise RHEL-compatible, communauté AlmaLinux OS Foundation.'"
    ).replace(
        /description: '[^']*'/,
        "description: 'AlmaLinux est une distribution libre compatible RHEL, maintenue par la fondation AlmaLinux OS. L\\'édition GNOME Workstation reprend le socle RPM/DNF avec une politique de stabilité long terme.'"
    ).replace(
        /url: '[^']*'/,
        "url: 'https://almalinux.org/'"
    );
    fs.writeFileSync(profileData, js, 'utf8');
}

console.log('✓ bootstrap-alma-from-rocky OK');
