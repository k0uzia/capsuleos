/**
 * Applique le fond d'écran utilisateur (Option C) si présent :
 * versions/<id>/media/img/wallpaper.{jpg|webp|png}
 * Sinon conserve le dégradé / couleur de shell.css.
 */
(function () {
    const main = document.querySelector('main');
    if (!main) {
        return;
    }

    const candidates = [
        './media/img/wallpaper.jpg',
        './media/img/wallpaper.webp',
        './media/img/wallpaper.png',
        './media/img/fond.jpg'
    ];

    function tryNext(index) {
        if (index >= candidates.length) {
            return;
        }
        const url = candidates[index];
        const probe = new Image();
        probe.onload = function () {
            main.style.backgroundImage = `url("${url}")`;
            main.style.backgroundSize = 'cover';
            main.style.backgroundPosition = 'center';
            main.style.backgroundRepeat = 'no-repeat';
        };
        probe.onerror = function () {
            tryNext(index + 1);
        };
        probe.src = url;
    }

    tryNext(0);
})();
