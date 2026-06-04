/**
 * Shim compat — délègue à CapsuleResource (charger capsule-resource.js avant).
 */
(function initCapsuleResourceUrlShim(global) {
  'use strict';
  if (typeof CapsuleResource === 'undefined') {
    console.warn('CapsuleOS: charger capsule-resource.js avant capsule-resource-url.js');
    return;
  }
  if (typeof global.resolveCapsuleResourceUrl !== 'function') {
    global.resolveCapsuleResourceUrl = (url) => CapsuleResource.resolve(url);
    global.rewriteCapsuleResourceUrlsInText = (text) => CapsuleResource.rewriteInText(text);
  }
  global.getCapsuleAssetsBase = () => CapsuleResource.getAssetsBase();
  global.getCapsuleMediaBase = () => CapsuleResource.getMediaBase();
  global.getCapsuleKdeIconsBase = () => CapsuleResource.getPackBase('icons/kde');
  global.getCapsuleGnomeIconsBase = () => CapsuleResource.getPackBase('icons/gnome');
  global.getCapsuleCinnamonIconsBase = () => CapsuleResource.getPackBase('icons/cinnamon');
}(typeof window !== 'undefined' ? window : globalThis));
