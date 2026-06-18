/**
 * Applique skin.profile.json (embed offline ou fetch HTTP).
 * Ordre : user-home.js → capsule-assets-manifest.js → capsule-skin-profiles.js → capsule-resource.js → capsule-skin-boot.js
 */
(function initCapsuleSkinBoot(global) {
  'use strict';

  const syncLoadPortalSiteHome = () => {
    if (global.CAPSULE_PORTAL_SITE_HOME !== undefined) {
      return;
    }
    try {
      const doc = global.document;
      if (!doc || !doc.scripts) {
        return;
      }
      let homeSrc = '/usr/lib/capsuleos/site/portal-site-home.js';
      for (let i = doc.scripts.length - 1; i >= 0; i -= 1) {
        const src = doc.scripts[i].getAttribute('src') || '';
        if (src.includes('capsule-skin-boot')) {
          homeSrc = src.replace(/capsule-skin-boot\.js.*$/, 'portal-site-home.js').replace('/common/', '/site/');
          break;
        }
      }
      const xhr = new XMLHttpRequest();
      xhr.open('GET', homeSrc, false);
      xhr.send(null);
      if (xhr.status === 200 && xhr.responseText) {
        // Chargement synchrone volontaire avant application du profil skin.
        (0, eval)(xhr.responseText);
      }
    } catch (_) { /* portal-site-home absent — profil par défaut */ }
  };

  syncLoadPortalSiteHome();

  const applyMntFromUrl = () => {
    try {
      const params = new URLSearchParams(global.location.search);
      const mnt = params.get('mnt');
      if (!mnt || !/^[a-z0-9_-]+\/[a-z0-9_-]+$/i.test(mnt)) {
        return;
      }
      const existing = Array.isArray(global.CAPSULE_MNT_MODULES) ? [...global.CAPSULE_MNT_MODULES] : [];
      if (!existing.includes(mnt)) {
        existing.push(mnt);
      }
      global.CAPSULE_MNT_MODULES = existing;
    } catch (_) { /* ignore */ }
  };

  const loadProgressSync = () => {
    try {
      const params = new URLSearchParams(global.location.search);
      if (!params.get('mnt') || !global.document) {
        return;
      }
      const scripts = global.document.querySelectorAll('script[src*="capsule-skin-boot"]');
      let syncSrc = '/usr/lib/capsuleos/site/portal-progress-sync.js';
      if (scripts.length) {
        const bootSrc = scripts[scripts.length - 1].getAttribute('src') || '';
        syncSrc = bootSrc.replace(/capsule-skin-boot\.js[^/]*$/, 'portal-progress-sync.js');
      }
      const script = global.document.createElement('script');
      script.src = syncSrc;
      script.async = false;
      global.document.head.appendChild(script);
    } catch (_) { /* ignore */ }
  };

  const applyPortalSiteHome = () => {
    if (global.CAPSULE_PORTAL_SITE_HOME) {
      global.CAPSULE_SITE_HOME = global.CAPSULE_PORTAL_SITE_HOME;
    }
  };

  const applyGlobals = (profile) => {
    if (!profile) {
      applyPortalSiteHome();
      return null;
    }
    applyMntFromUrl();
    if (profile.capsuleGlobals && typeof profile.capsuleGlobals === 'object') {
      Object.keys(profile.capsuleGlobals).forEach((key) => {
        global[key] = profile.capsuleGlobals[key];
      });
    }
    applyPortalSiteHome();
    if (profile.bodyId &&(global.document == null ? void 0 : global.document.body) && !global.document.body.id) {
      global.document.body.id = profile.bodyId;
    }
    if (typeof CapsuleResource !== 'undefined' && CapsuleResource.applyProfileAssets) {
      CapsuleResource.applyProfileAssets(profile);
    } else if ((profile.assets == null ? void 0 : profile.assets.assetsBase)) {
      console.warn('CapsuleOS: charger capsule-resource.js avant capsule-skin-boot.js');
    }
    if ((profile.paths == null ? void 0 : profile.paths.skin)) {
      global.CAPSULE_SKIN_BASE = global.CAPSULE_SKIN_BASE || '.';
    }
    global.CAPSULE_SKIN_PROFILE_APPLIED = profile.id || profile.bodyId || true;
    return profile;
  };

  const resolveProfileId = () => {
    if (global.CAPSULE_SKIN_PROFILE_ID) {
      return global.CAPSULE_SKIN_PROFILE_ID;
    }
    const bodyId =((global.document == null ? void 0 : global.document.body) == null ? void 0 : (global.document == null ? void 0 : global.document.body).id);
    if (bodyId &&(global.CAPSULE_SKIN_PROFILES == null ? void 0 : global.CAPSULE_SKIN_PROFILES[bodyId])) {
      return bodyId;
    }
    if (bodyId && global.CAPSULE_SKIN_PROFILES_BY_ID) {
      const match = Object.keys(global.CAPSULE_SKIN_PROFILES_BY_ID).find(
        (id) =>(global.CAPSULE_SKIN_PROFILES_BY_ID[id] == null ? void 0 : global.CAPSULE_SKIN_PROFILES_BY_ID[id].bodyId) === bodyId
      );
      if (match) {
        return match;
      }
    }
    return bodyId || null;
  };

  const bootFromEmbed = () => {
    const profileId = resolveProfileId();
    if (!profileId) {
      return null;
    }
    const profile =(global.CAPSULE_SKIN_PROFILES == null ? void 0 : global.CAPSULE_SKIN_PROFILES[profileId])
      ||(global.CAPSULE_SKIN_PROFILES_BY_ID == null ? void 0 : global.CAPSULE_SKIN_PROFILES_BY_ID[profileId]);
    return applyGlobals(profile);
  };

  const bootFromFetch = async () => {
    const url = global.CAPSULE_SKIN_PROFILE_URL || './skin.profile.json';
    try {
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        return bootFromEmbed();
      }
      const profile = await response.json();
      return applyGlobals(profile);
    } catch (error) {
      return bootFromEmbed();
    }
  };

  const runBoot = () => {
    const embedded = bootFromEmbed();
    const finish = (profile) => {
      loadProgressSync();
      global.dispatchEvent(new CustomEvent('capsule-skin-ready', { detail: profile }));
      return profile;
    };
    if (embedded || global.CAPSULE_SKIN_BOOT_FETCH !== true) {
      return Promise.resolve(finish(embedded));
    }
    return bootFromFetch().then(finish);
  };

  const canResolveProfileNow = () => {
    if (global.CAPSULE_SKIN_PROFILE_ID) {
      return true;
    }
    const body = global.document && global.document.body;
    return !!(body && body.id);
  };

  const start = () => {
    const doc = global.document;
    if (doc && !canResolveProfileNow() && doc.readyState === 'loading') {
      return new Promise((resolve) => {
        doc.addEventListener('DOMContentLoaded', () => {
          resolve(runBoot());
        }, { once: true });
      });
    }
    return runBoot();
  };

  global.CapsuleSkinBoot = { applyGlobals, start, bootFromEmbed };
  start();
}(typeof window !== 'undefined' ? window : globalThis));
