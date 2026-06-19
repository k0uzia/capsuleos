/**
 * KWin script — fermer « Problème de mises à jour » et focaliser Discover.
 * Chargé par vm-kde-neon-capture-host.sh (session Plasma Wayland).
 */
var ws = workspace;
var windows = ws.windowList();
var discover = null;
var discoverFallback = null;

for (var i = 0; i < windows.length; i++) {
    var w = windows[i];
    var cap = w.caption || "";
    if (cap === "Problème de mises à jour" || cap.indexOf("Update problem") === 0) {
        w.closeWindow();
        continue;
    }
    if (cap.indexOf("Discover") >= 0 && cap.indexOf("Problème") < 0) {
        discoverFallback = w;
        if (cap.indexOf("VLC") < 0) {
            discover = w;
        }
    }
}

var target = discover || discoverFallback;
if (target) {
    target.minimized = false;
    ws.activeWindow = target;
}
