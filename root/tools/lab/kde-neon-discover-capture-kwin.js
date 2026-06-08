/**
 * KWin script — focus Discover/VLC et fermer la boîte « Problème de mises à jour ».
 * Chargé par vm-kde-neon-capture-host.sh (session Plasma Wayland).
 */
var ws = workspace;
var windows = ws.windowList();
var discover = null;

for (var i = 0; i < windows.length; i++) {
    var w = windows[i];
    var cap = w.caption || "";
    if (cap === "Problème de mises à jour" || cap.indexOf("Update problem") === 0) {
        w.closeWindow();
        continue;
    }
    if (cap.indexOf("VLC") >= 0 && cap.indexOf("Discover") >= 0) {
        discover = w;
    }
}

if (discover) {
    ws.activeWindow = discover;
}
