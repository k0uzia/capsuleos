/**
 * Visionneurs Mint — xviewer 3.0 + xreader 4.0.
 */
(function initMintViewersModule(global) {
    'use strict';

    var IMAGE_TITLE = 'Visionneur d\'images';
    var PDF_TITLE = 'Visionneur de documents';

    var xviewerState = { zoom: 100, rotate: 0, hasImage: false };
    var xreaderState = { zoom: 100, page: 0, pages: 0, sidebar: false };

    function getWindowEl(root, slotId) {
        var el = root;
        while (el) {
            if (el.getAttribute && el.getAttribute('data-link') === slotId) {
                return el;
            }
            el = el.parentElement;
        }
        return null;
    }

    function syncWindowTitle(winEl, title) {
        if (!winEl || !title) {
            return;
        }
        var wmTitle = winEl.querySelector('#windowTitle');
        if (wmTitle) {
            wmTitle.textContent = title;
        }
        winEl.setAttribute('data-title', title);
    }

    function formatZoom(pct) {
        return String(pct) + ' %';
    }

    function applyXviewerZoom(root) {
        var img = root.querySelector('#mint-image-viewer-content .viewer-app__image');
        if (!img) {
            return;
        }
        var scale = xviewerState.zoom / 100;
        var rot = xviewerState.rotate;
        img.style.transform = 'scale(' + scale + ') rotate(' + rot + 'deg)';
        var zoomEl = root.querySelector('#xviewer-zoom');
        if (zoomEl) {
            zoomEl.textContent = formatZoom(xviewerState.zoom);
        }
    }

    function updateXviewerDims(root, img) {
        var dimsEl = root.querySelector('#xviewer-dims');
        if (!dimsEl || !img) {
            return;
        }
        if (img.naturalWidth && img.naturalHeight) {
            dimsEl.textContent = img.naturalWidth + ' × ' + img.naturalHeight;
        } else {
            img.addEventListener('load', function onLoad() {
                dimsEl.textContent = img.naturalWidth + ' × ' + img.naturalHeight;
            });
        }
    }

    function bindXviewerToolbar(root) {
        if (!root || root.dataset.xviewerBound === 'true') {
            return;
        }
        root.querySelectorAll('[data-xv-action]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var action = btn.getAttribute('data-xv-action');
                if (action === 'zoom-in') {
                    xviewerState.zoom = Math.min(400, xviewerState.zoom + 25);
                    applyXviewerZoom(root);
                } else if (action === 'zoom-out') {
                    xviewerState.zoom = Math.max(25, xviewerState.zoom - 25);
                    applyXviewerZoom(root);
                } else if (action === 'zoom-fit') {
                    xviewerState.zoom = 100;
                    xviewerState.rotate = 0;
                    applyXviewerZoom(root);
                } else if (action === 'rotate') {
                    xviewerState.rotate = (xviewerState.rotate + 90) % 360;
                    applyXviewerZoom(root);
                } else if (action === 'slideshow') {
                    toggleXviewerSlideshow(root);
                }
            });
        });
        bindXviewerMenus(root);
        root.dataset.xviewerBound = 'true';
    }

    function bindXviewerMenus(root) {
        var fileBtn = root.querySelector('[data-xv-menu="file"]');
        var fileMenu = root.querySelector('#xviewer-menu-file');
        if (fileBtn && fileMenu) {
            fileBtn.addEventListener('click', function (event) {
                event.preventDefault();
                event.stopPropagation();
                fileMenu.hidden = !fileMenu.hidden;
            });
        }
        root.querySelectorAll('[data-xv-menu-action]').forEach(function (item) {
            item.addEventListener('click', function () {
                var cmd = item.getAttribute('data-xv-menu-action');
                if (fileMenu) {
                    fileMenu.hidden = true;
                }
                if (cmd === 'open') {
                    openPixDemoImage();
                    return;
                }
                if (cmd === 'save-as') {
                    openXviewerExportDialog(root);
                }
            });
        });
        global.document.addEventListener('click', function onDoc(ev) {
            if (!fileMenu || fileMenu.hidden) {
                return;
            }
            if (fileMenu.contains(ev.target) || (fileBtn && fileBtn.contains(ev.target))) {
                return;
            }
            fileMenu.hidden = true;
        });
    }

    function openXviewerExportDialog(root) {
        var dialog = root.querySelector('#xviewer-export-dialog');
        if (!dialog) {
            return;
        }
        dialog.hidden = false;
        dialog.querySelectorAll('[data-xv-export]').forEach(function (btn) {
            if (btn.dataset.xvExportBound === 'true') {
                return;
            }
            btn.dataset.xvExportBound = 'true';
            btn.addEventListener('click', function () {
                dialog.hidden = true;
            });
        });
    }

    function toggleXviewerSlideshow(root) {
        var overlay = root.querySelector('#xviewer-slideshow');
        var content = root.querySelector('#mint-image-viewer-content');
        if (!overlay) {
            return;
        }
        var img = content ? content.querySelector('.viewer-app__image') : null;
        if (overlay.hidden) {
            if (!img) {
                return;
            }
            overlay.innerHTML = '';
            var clone = img.cloneNode(true);
            clone.className = 'viewer-app__image xviewer-app__slideshow-image';
            overlay.appendChild(clone);
            overlay.hidden = false;
        } else {
            overlay.hidden = true;
            overlay.innerHTML = '';
        }
    }

    function renderDemoImage(root) {
        var content = root.querySelector('#mint-image-viewer-content');
        if (!content) {
            return;
        }
        content.innerHTML = '';
        var img = global.document.createElement('img');
        img.className = 'viewer-app__image';
        img.alt = 'demo.png';
        img.src = '../../../usr/share/capsuleos/assets/images/vendors/mint/wallpaper/mpiwnicki_light.jpg';
        content.appendChild(img);
        onXviewerRendered(root, { name: 'demo.png' });
        var slideshowBtn = root.querySelector('[data-xv-action="slideshow"]');
        if (slideshowBtn) {
            slideshowBtn.disabled = false;
        }
    }

    function renderDemoPdf(root) {
        var content = root.querySelector('#mint-pdf-viewer-content');
        if (!content) {
            return;
        }
        content.innerHTML = '';
        var frame = global.document.createElement('iframe');
        frame.className = 'viewer-app__frame';
        frame.title = 'Bash.pdf';
        frame.src = '../../../../home/public/Documents/Bash.pdf';
        content.appendChild(frame);
        onXreaderRendered(root, { name: 'Bash.pdf' });
        var sidebar = root.querySelector('#xreader-sidebar');
        if (sidebar) {
            sidebar.removeAttribute('hidden');
            xreaderState.sidebar = true;
        }
    }

    global.openPixDemoImage = function openPixDemoImage() {
        var root = global.document.getElementById('visionneurImages');
        if (!root) {
            return;
        }
        initVisionneurImagesApp();
        renderDemoImage(root);
    };

    global.openXreaderDemoPdf = function openXreaderDemoPdf() {
        var root = global.document.getElementById('visionneurPdf');
        if (!root) {
            return;
        }
        initVisionneurPdfApp();
        renderDemoPdf(root);
    };

    function bindXreaderToolbar(root) {
        if (!root || root.dataset.xreaderBound === 'true') {
            return;
        }
        root.querySelectorAll('[data-xr-action]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var action = btn.getAttribute('data-xr-action');
                if (action === 'zoom-in') {
                    xreaderState.zoom = Math.min(400, xreaderState.zoom + 25);
                    syncXreaderZoom(root);
                } else if (action === 'zoom-out') {
                    xreaderState.zoom = Math.max(50, xreaderState.zoom - 25);
                    syncXreaderZoom(root);
                } else if (action === 'zoom-fit') {
                    xreaderState.zoom = 100;
                    syncXreaderZoom(root);
                } else if (action === 'sidebar') {
                    xreaderState.sidebar = !xreaderState.sidebar;
                    var sidebar = root.querySelector('#xreader-sidebar');
                    if (sidebar) {
                        if (xreaderState.sidebar) {
                            sidebar.removeAttribute('hidden');
                        } else {
                            sidebar.setAttribute('hidden', 'hidden');
                        }
                    }
                    btn.setAttribute('aria-pressed', xreaderState.sidebar ? 'true' : 'false');
                }
            });
        });
        root.dataset.xreaderBound = 'true';
    }

    function syncXreaderZoom(root) {
        var frame = root.querySelector('#mint-pdf-viewer-content .viewer-app__frame');
        if (frame) {
            frame.style.zoom = String(xreaderState.zoom / 100);
        }
        var zoomEl = root.querySelector('#xreader-zoom');
        if (zoomEl) {
            zoomEl.textContent = formatZoom(xreaderState.zoom);
        }
    }

    function syncXreaderPage(root) {
        var pageEl = root.querySelector('#xreader-page');
        if (pageEl) {
            if (xreaderState.pages > 0) {
                pageEl.textContent = 'Page ' + xreaderState.page + ' sur ' + xreaderState.pages;
            } else {
                pageEl.textContent = 'Page 0 sur 0';
            }
        }
        var prevBtn = root.querySelector('[data-xr-action="prev"]');
        var nextBtn = root.querySelector('[data-xr-action="next"]');
        if (prevBtn) {
            prevBtn.disabled = xreaderState.page <= 1;
        }
        if (nextBtn) {
            nextBtn.disabled = xreaderState.pages === 0 || xreaderState.page >= xreaderState.pages;
        }
    }

    function onXviewerRendered(root, payload) {
        var content = root.querySelector('#mint-image-viewer-content');
        var img = content ? content.querySelector('.viewer-app__image') : null;
        var nameEl = root.querySelector('#mint-image-viewer-filename');
        var winEl = getWindowEl(root, 'visionneur_images');
        if (payload && payload.name) {
            xviewerState.hasImage = true;
            if (nameEl) {
                nameEl.textContent = payload.name;
            }
            syncWindowTitle(winEl, payload.name + ' — ' + IMAGE_TITLE);
            if (img) {
                updateXviewerDims(root, img);
            }
            xviewerState.zoom = 100;
            xviewerState.rotate = 0;
            applyXviewerZoom(root);
        } else {
            xviewerState.hasImage = false;
            if (nameEl) {
                nameEl.textContent = 'Aucune image sélectionnée';
            }
            syncWindowTitle(winEl, IMAGE_TITLE);
        }
    }

    function onXreaderRendered(root, payload) {
        var nameEl = root.querySelector('#mint-pdf-viewer-filename');
        var winEl = getWindowEl(root, 'visionneur_pdf');
        var sidebar = root.querySelector('#xreader-sidebar');
        if (payload && payload.name) {
            xreaderState.pages = 1;
            xreaderState.page = 1;
            if (nameEl) {
                nameEl.textContent = payload.name;
            }
            syncWindowTitle(winEl, payload.name + ' — ' + PDF_TITLE);
            if (sidebar) {
                sidebar.innerHTML = '<p class="xreader-app__thumb is-active" aria-current="page">1</p>';
            }
        } else {
            xreaderState.pages = 0;
            xreaderState.page = 0;
            if (nameEl) {
                nameEl.textContent = 'Aucun document sélectionné';
            }
            syncWindowTitle(winEl, PDF_TITLE);
            if (sidebar) {
                sidebar.innerHTML = '<p class="xreader-app__sidebar-hint">Aucun document</p>';
            }
        }
        xreaderState.zoom = 100;
        syncXreaderZoom(root);
        syncXreaderPage(root);
    }

    function initVisionneurImagesApp(container) {
        var root = container ? container.querySelector('#visionneurImages') : global.document.getElementById('visionneurImages');
        if (!root) {
            return;
        }
        bindXviewerToolbar(root);
        syncWindowTitle(getWindowEl(root, 'visionneur_images'), IMAGE_TITLE);
        root.dataset.xviewerInit = 'true';
    }

    function initVisionneurPdfApp(container) {
        var root = container ? container.querySelector('#visionneurPdf') : global.document.getElementById('visionneurPdf');
        if (!root) {
            return;
        }
        bindXreaderToolbar(root);
        syncWindowTitle(getWindowEl(root, 'visionneur_pdf'), PDF_TITLE);
        root.dataset.xreaderInit = 'true';
    }

    global.onMintViewerRendered = function (appId) {
        var root;
        if (appId === 'visionneur_images') {
            root = global.document.getElementById('visionneurImages');
            if (root) {
                var payload = global.fileViewerState && global.fileViewerState.visionneur_images
                    ? global.fileViewerState.visionneur_images
                    : null;
                if (!payload && typeof global.window !== 'undefined') {
                    payload = null;
                }
                onXviewerRendered(root, payload);
            }
        }
        if (appId === 'visionneur_pdf') {
            root = global.document.getElementById('visionneurPdf');
            if (root) {
                var pdfPayload = null;
                if (global.fileViewerState && global.fileViewerState.visionneur_pdf) {
                    pdfPayload = global.fileViewerState.visionneur_pdf;
                }
                onXreaderRendered(root, pdfPayload);
            }
        }
    };

    global.initVisionneurImagesApp = initVisionneurImagesApp;
    global.initVisionneurPdfApp = initVisionneurPdfApp;

    global.document.addEventListener('capsule:window-opened', function (event) {
        if (!event.detail) {
            return;
        }
        if (event.detail.slotId === 'visionneur_images') {
            global.setTimeout(function () {
                initVisionneurImagesApp(event.detail.container);
            }, 30);
        }
        if (event.detail.slotId === 'visionneur_pdf') {
            global.setTimeout(function () {
                initVisionneurPdfApp(event.detail.container);
            }, 30);
        }
    });
}(typeof window !== 'undefined' ? window : globalThis));
