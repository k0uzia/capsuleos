/**
 * AnduinOS — Applications favorites du menu Démarrer (ordre capture menu_dem.png).
 * Icônes : pack toolkits/gnome (pas cinnamon).
 */
const ANDUIN_MENU_FAVORITES = [
    {
        id: 'firefox',
        name: 'Navigateur Web Firefox',
        icon: './assets/images/toolkits/gnome/apps/firefox.svg',
        dataLink: 'firefox'
    },
    {
        id: 'files',
        name: 'Fichiers',
        icon: './assets/images/toolkits/gnome/apps/dash/org.gnome.Nautilus.svg',
        dataLink: 'nemo'
    },
    {
        id: 'terminal',
        name: 'Terminal',
        icon: './assets/images/toolkits/gnome/apps/dash/org.gnome.Ptyxis.svg',
        dataLink: 'terminal'
    },
    {
        id: 'software',
        name: 'Logiciel',
        icon: './assets/images/toolkits/gnome/apps/dash/org.gnome.Software.svg',
        dataLink: 'update_manager'
    },
    {
        id: 'photos',
        name: 'Photos',
        icon: './assets/images/toolkits/gnome/apps/overview/org.gnome.Snapshot.svg',
        dataLink: null
    },
    {
        id: 'camera',
        name: 'Caméra',
        icon: './assets/images/toolkits/gnome/apps/overview/org.gnome.Snapshot.svg',
        dataLink: null
    },
    {
        id: 'text-editor',
        name: 'Éditeur de texte',
        icon: './assets/images/toolkits/gnome/apps/dash/org.gnome.TextEditor.svg',
        dataLink: 'text_editor'
    },
    {
        id: 'clocks',
        name: 'Horloges',
        icon: './assets/images/toolkits/gnome/apps/overview/org.gnome.clocks.svg',
        dataLink: null
    },
    {
        id: 'calculator',
        name: 'Calculatrice',
        icon: './assets/images/toolkits/gnome/apps/overview/org.gnome.Calculator.png',
        dataLink: null
    },
    {
        id: 'calendar',
        name: 'Agenda',
        icon: './assets/images/toolkits/gnome/apps/dash/org.gnome.Calendar.svg',
        dataLink: null
    },
    {
        id: 'evince',
        name: 'Visionneur de docume…',
        icon: './assets/images/toolkits/gnome/apps/overview/org.gnome.Yelp.svg',
        dataLink: 'visionneur_pdf'
    },
    {
        id: 'videos',
        name: 'Vidéos',
        icon: './assets/images/toolkits/gnome/apps/overview/org.gnome.Showtime.svg',
        dataLink: 'lecteur_multimedia'
    },
    {
        id: 'seahorse',
        name: 'Mots de passe et clés',
        icon: './assets/images/toolkits/gnome/apps/org.gnome.Settings-wacom-symbolic.svg',
        dataLink: null
    },
    {
        id: 'music',
        name: 'Musique',
        icon: './assets/images/toolkits/gnome/apps/overview/org.gnome.Characters.svg',
        dataLink: null
    },
    {
        id: 'baobab',
        name: 'Analyseur d\'utilisation…',
        icon: './assets/images/toolkits/gnome/apps/overview/org.gnome.Boxes.svg',
        dataLink: null
    },
    {
        id: 'settings',
        name: 'Paramètres',
        icon: './assets/images/toolkits/gnome/apps/overview/org.gnome.Settings.svg',
        dataLink: 'themes'
    },
    {
        id: 'system-monitor',
        name: 'Moniteur système',
        icon: './assets/images/toolkits/gnome/apps/user-info.svg',
        dataLink: null
    }
];
