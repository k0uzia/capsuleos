/**
 * Visite guidée GNOME — simulation org.gnome.Tour (cartes d'accueil + navigation).
 */
(function initGnomeTourApp(global) {
    'use strict';

    var STEPS = [
        {
            title: 'Bienvenue dans GNOME',
            illus: 'welcome',
            lead: 'Découvrez Rocky Linux 10 et les raccourcis essentiels du bureau GNOME.',
            bullets: [
                'Super — ouvrir l’Aperçu et rechercher des applications',
                'Alt+Tab — changer de fenêtre',
                'Paramètres rapides — volume, réseau, thème'
            ]
        },
        {
            title: 'Aperçu des activités',
            illus: 'overview',
            lead: 'Appuyez sur la touche Super pour afficher l’Aperçu : applications, fenêtres et espaces de travail.',
            bullets: [
                'Cliquez sur une application pour la lancer',
                'Tapez pour rechercher un programme ou un fichier',
                'Échap — revenir au bureau'
            ]
        },
        {
            title: 'Espaces de travail',
            illus: 'workspaces',
            lead: 'Organisez vos fenêtres sur plusieurs bureaux virtuels pour garder un bureau dégagé.',
            bullets: [
                'Super + Page Haut / Page Bas — changer d’espace',
                'Glissez une fenêtre vers le bord pour la déplacer',
                'L’Aperçu affiche tous vos espaces côte à côte'
            ]
        },
        {
            title: 'Rechercher',
            illus: 'search',
            lead: 'La recherche intégrée trouve rapidement applications, paramètres et fichiers.',
            bullets: [
                'Super puis saisir — recherche globale',
                'Flèches — parcourir les résultats',
                'Entrée — ouvrir la sélection'
            ]
        },
        {
            title: 'C’est parti !',
            illus: 'finish',
            lead: 'Personnalisez Rocky Linux dans Paramètres et explorez les applications de l’Aperçu.',
            bullets: [
                'Paramètres — apparence, réseau, comptes',
                'Visite guidée — relancer depuis l’Aperçu',
                'Profitez de votre bureau GNOME'
            ]
        }
    ];

    var activeStep = 0;

    function renderDots(root, count, active) {
        var dots = root.querySelector('#gnome-tour-dots');
        if (!dots) {
            return;
        }
        dots.innerHTML = '';
        for (var i = 0; i < count; i += 1) {
            var dot = document.createElement('span');
            dot.className = 'gnome-tour__dot';
            if (i === active) {
                dot.classList.add('gnome-tour__dot--active');
            }
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', 'Étape ' + (i + 1));
            dot.setAttribute('aria-selected', i === active ? 'true' : 'false');
            dots.appendChild(dot);
        }
    }

    function renderBullets(list, items) {
        list.innerHTML = '';
        items.forEach(function (text) {
            var li = document.createElement('li');
            li.textContent = text;
            list.appendChild(li);
        });
    }

    function renderStep(root, index) {
        var step = STEPS[index];
        if (!step) {
            return;
        }
        var title = root.querySelector('#gnome-tour-title');
        var illus = root.querySelector('#gnome-tour-illus');
        var lead = root.querySelector('#gnome-tour-lead');
        var bullets = root.querySelector('#gnome-tour-bullets');
        var prev = root.querySelector('#gnome-tour-prev');
        var next = root.querySelector('#gnome-tour-next');
        if (title) {
            title.textContent = step.title;
        }
        if (illus) {
            illus.className = 'gnome-tour__illus gnome-tour__illus--' + step.illus;
            illus.setAttribute('aria-label', step.title);
        }
        if (lead) {
            lead.textContent = step.lead;
        }
        if (bullets) {
            renderBullets(bullets, step.bullets);
        }
        if (prev) {
            prev.hidden = index === 0;
        }
        if (next) {
            next.textContent = index === STEPS.length - 1 ? 'Terminer' : 'Suivant';
            next.setAttribute('aria-label', index === STEPS.length - 1 ? 'Terminer la visite' : 'Étape suivante');
        }
        renderDots(root, STEPS.length, index);
    }

    function goToStep(root, index) {
        if (index < 0 || index >= STEPS.length) {
            return;
        }
        activeStep = index;
        renderStep(root, activeStep);
    }

    function bindNavigation(root) {
        var prev = root.querySelector('#gnome-tour-prev');
        var next = root.querySelector('#gnome-tour-next');
        if (prev) {
            prev.addEventListener('click', function () {
                goToStep(root, activeStep - 1);
            });
        }
        if (next) {
            next.addEventListener('click', function () {
                if (activeStep < STEPS.length - 1) {
                    goToStep(root, activeStep + 1);
                }
            });
        }
    }

    function initTourApp() {
        var root = document.getElementById('gnomeTourApp');
        if (!root || root.dataset.tourReady === '1') {
            return;
        }
        root.dataset.tourReady = '1';
        activeStep = 0;
        bindNavigation(root);
        renderStep(root, activeStep);
    }

    global.initTourApp = initTourApp;
}(typeof window !== 'undefined' ? window : this));
