/**
 * Catalogue magasin CapsuleOS (généré).
 * Sources : store-installable-apps.json · slots-manifest.json · presentation-bindings.json
 * Regénérer : node usr/lib/capsuleos/tools/generate-store-catalog.mjs
 */
(function initCapsuleStoreCatalog(global) {
  'use strict';
  global.CAPSULE_STORE_APPS_BY_REGISTRY = {
  "linux-alma": [
    {
      "id": "calendar",
      "storeSlot": "calendar",
      "title": "Agenda",
      "sub": "Calendrier et rendez-vous",
      "desc": "Consultez vos événements et rendez-vous (Flatpak org.gnome.Calendar).",
      "version": "47.0",
      "size": "~5 Mo",
      "iconClass": "gnome-software__cardicon--calendar",
      "slot": "calendar",
      "source": "flatpak",
      "categories": [
        "productivity"
      ],
      "placement": {
        "overview": true,
        "dash": true
      }
    },
    {
      "id": "file-roller",
      "storeSlot": "file_roller",
      "title": "Gestionnaire d'archives",
      "sub": "Archives compressées",
      "desc": "Créez, ouvrez et extrayez des archives (tar, zip, …).",
      "version": "43.0",
      "size": "~2 Mo",
      "iconClass": "gnome-software__cardicon--file-roller",
      "slot": "file_roller",
      "source": "rpm",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "libreoffice",
      "storeSlot": "libreoffice_startcenter",
      "title": "LibreOffice",
      "sub": "Suite bureautique",
      "desc": "Suite bureautique libre — Writer, Calc, Impress (Flatpak Flathub).",
      "version": "24.8",
      "size": "~280 Mo",
      "iconClass": "gnome-software__cardicon--libreoffice",
      "slot": "librewriter",
      "source": "flatpak",
      "categories": [
        "productivity",
        "creation"
      ],
      "placement": {
        "overview": true,
        "dash": true
      }
    },
    {
      "id": "thunderbird",
      "storeSlot": "thunderbird",
      "title": "Thunderbird",
      "sub": "Messagerie électronique",
      "desc": "Client de messagerie libre (Flatpak org.mozilla.Thunderbird).",
      "version": "128.0",
      "size": "~85 Mo",
      "iconClass": "gnome-software__cardicon--thunderbird",
      "slot": "thunderbird",
      "source": "flatpak",
      "categories": [
        "productivity"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "transmission",
      "storeSlot": "transmission",
      "title": "Transmission",
      "sub": "Client BitTorrent",
      "desc": "Téléchargez des fichiers via BitTorrent (Flatpak com.transmissionbt.Transmission).",
      "version": "4.0",
      "size": "~8 Mo",
      "iconClass": "gnome-software__cardicon--transmission",
      "slot": "transmission",
      "source": "flatpak",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "rhythmbox",
      "storeSlot": "rhythmbox",
      "title": "Rhythmbox",
      "sub": "Lecteur de musique",
      "desc": "Organisez et écoutez votre bibliothèque musicale (RPM rhythmbox).",
      "version": "3.4",
      "size": "~12 Mo",
      "iconClass": "gnome-software__cardicon--rhythmbox",
      "slot": "rhythmbox",
      "source": "rpm",
      "categories": [
        "multimedia"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "lecteur-multimedia",
      "storeSlot": "lecteur_multimedia",
      "title": "Lecteur vidéo",
      "sub": "Celluloid",
      "desc": "Lisez vos fichiers vidéo (Flatpak io.github.celluloid_player.Celluloid).",
      "version": "0.27",
      "size": "~5 Mo",
      "iconClass": "gnome-software__cardicon--lecteur-multimedia",
      "slot": "lecteur_multimedia",
      "source": "flatpak",
      "categories": [
        "multimedia"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "drawing",
      "storeSlot": "drawing",
      "title": "Dessin",
      "sub": "Dessin et annotation",
      "desc": "Dessinez et annotez des images (Flatpak com.github.maoschanz.drawing).",
      "version": "1.2",
      "size": "~3 Mo",
      "iconClass": "gnome-software__cardicon--drawing",
      "slot": "drawing",
      "source": "flatpak",
      "categories": [
        "creation"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "simple-scan",
      "storeSlot": "simple_scan",
      "title": "Numérisation",
      "sub": "Numérisation",
      "desc": "Numérisez des documents avec votre scanner (RPM simple-scan).",
      "version": "46.0",
      "size": "~4 Mo",
      "iconClass": "gnome-software__cardicon--simple-scan",
      "slot": "simple_scan",
      "source": "rpm",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "warpinator",
      "storeSlot": "warpinator",
      "title": "Warpinator",
      "sub": "Partage de fichiers",
      "desc": "Envoyez des fichiers sur le réseau local (Flatpak org.x.Warpinator).",
      "version": "1.0",
      "size": "~2 Mo",
      "iconClass": "gnome-software__cardicon--warpinator",
      "slot": "warpinator",
      "source": "flatpak",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "timeshift",
      "storeSlot": "timeshift",
      "title": "Timeshift",
      "sub": "Sauvegardes système",
      "desc": "Créez des instantanés du système (Flatpak com.timeshift.TimeShift).",
      "version": "24.0",
      "size": "~15 Mo",
      "iconClass": "gnome-software__cardicon--timeshift",
      "slot": "timeshift",
      "source": "flatpak",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    }
  ],
  "linux-rocky": [
    {
      "id": "calendar",
      "storeSlot": "calendar",
      "title": "Agenda",
      "sub": "Calendrier et rendez-vous",
      "desc": "Consultez vos événements et rendez-vous (Flatpak org.gnome.Calendar).",
      "version": "47.0",
      "size": "~5 Mo",
      "iconClass": "gnome-software__cardicon--calendar",
      "slot": "calendar",
      "source": "flatpak",
      "categories": [
        "productivity"
      ],
      "placement": {
        "overview": true,
        "dash": true
      }
    },
    {
      "id": "file-roller",
      "storeSlot": "file_roller",
      "title": "Gestionnaire d'archives",
      "sub": "Archives compressées",
      "desc": "Créez, ouvrez et extrayez des archives (tar, zip, …).",
      "version": "43.0",
      "size": "~2 Mo",
      "iconClass": "gnome-software__cardicon--file-roller",
      "slot": "file_roller",
      "source": "rpm",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "libreoffice",
      "storeSlot": "libreoffice_startcenter",
      "title": "LibreOffice",
      "sub": "Suite bureautique",
      "desc": "Suite bureautique libre — Writer, Calc, Impress (Flatpak Flathub).",
      "version": "24.8",
      "size": "~280 Mo",
      "iconClass": "gnome-software__cardicon--libreoffice",
      "slot": "librewriter",
      "source": "flatpak",
      "categories": [
        "productivity",
        "creation"
      ],
      "placement": {
        "overview": true,
        "dash": true
      }
    },
    {
      "id": "thunderbird",
      "storeSlot": "thunderbird",
      "title": "Thunderbird",
      "sub": "Messagerie électronique",
      "desc": "Client de messagerie libre (Flatpak org.mozilla.Thunderbird).",
      "version": "128.0",
      "size": "~85 Mo",
      "iconClass": "gnome-software__cardicon--thunderbird",
      "slot": "thunderbird",
      "source": "rpm",
      "categories": [
        "productivity"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "transmission",
      "storeSlot": "transmission",
      "title": "Transmission",
      "sub": "Client BitTorrent",
      "desc": "Téléchargez des fichiers via BitTorrent (Flatpak com.transmissionbt.Transmission).",
      "version": "4.0",
      "size": "~8 Mo",
      "iconClass": "gnome-software__cardicon--transmission",
      "slot": "transmission",
      "source": "rpm",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "rhythmbox",
      "storeSlot": "rhythmbox",
      "title": "Rhythmbox",
      "sub": "Lecteur de musique",
      "desc": "Organisez et écoutez votre bibliothèque musicale (RPM rhythmbox).",
      "version": "3.4",
      "size": "~12 Mo",
      "iconClass": "gnome-software__cardicon--rhythmbox",
      "slot": "rhythmbox",
      "source": "rpm",
      "categories": [
        "multimedia"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "lecteur-multimedia",
      "storeSlot": "lecteur_multimedia",
      "title": "Lecteur vidéo",
      "sub": "Celluloid",
      "desc": "Lisez vos fichiers vidéo (Flatpak io.github.celluloid_player.Celluloid).",
      "version": "0.27",
      "size": "~5 Mo",
      "iconClass": "gnome-software__cardicon--lecteur-multimedia",
      "slot": "lecteur_multimedia",
      "source": "flatpak",
      "categories": [
        "multimedia"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "drawing",
      "storeSlot": "drawing",
      "title": "Dessin",
      "sub": "Dessin et annotation",
      "desc": "Dessinez et annotez des images (Flatpak com.github.maoschanz.drawing).",
      "version": "1.2",
      "size": "~3 Mo",
      "iconClass": "gnome-software__cardicon--drawing",
      "slot": "drawing",
      "source": "flatpak",
      "categories": [
        "creation"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "simple-scan",
      "storeSlot": "simple_scan",
      "title": "Numérisation",
      "sub": "Numérisation",
      "desc": "Numérisez des documents avec votre scanner (RPM simple-scan).",
      "version": "46.0",
      "size": "~4 Mo",
      "iconClass": "gnome-software__cardicon--simple-scan",
      "slot": "simple_scan",
      "source": "rpm",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "warpinator",
      "storeSlot": "warpinator",
      "title": "Warpinator",
      "sub": "Partage de fichiers",
      "desc": "Envoyez des fichiers sur le réseau local (Flatpak org.x.Warpinator).",
      "version": "1.0",
      "size": "~2 Mo",
      "iconClass": "gnome-software__cardicon--warpinator",
      "slot": "warpinator",
      "source": "flatpak",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "timeshift",
      "storeSlot": "timeshift",
      "title": "Timeshift",
      "sub": "Sauvegardes système",
      "desc": "Créez des instantanés du système (Flatpak com.timeshift.TimeShift).",
      "version": "24.0",
      "size": "~15 Mo",
      "iconClass": "gnome-software__cardicon--timeshift",
      "slot": "timeshift",
      "source": "flatpak",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    }
  ],
  "linux-fedora": [
    {
      "id": "calendar",
      "storeSlot": "calendar",
      "title": "Agenda",
      "sub": "Calendrier et rendez-vous",
      "desc": "Consultez vos événements et rendez-vous (Flatpak org.gnome.Calendar).",
      "version": "47.0",
      "size": "~5 Mo",
      "iconClass": "gnome-software__cardicon--calendar",
      "slot": "calendar",
      "source": "rpm",
      "categories": [
        "productivity"
      ],
      "placement": {
        "overview": true,
        "dash": true
      }
    },
    {
      "id": "file-roller",
      "storeSlot": "file_roller",
      "title": "Gestionnaire d'archives",
      "sub": "Archives compressées",
      "desc": "Créez, ouvrez et extrayez des archives (tar, zip, …).",
      "version": "43.0",
      "size": "~2 Mo",
      "iconClass": "gnome-software__cardicon--file-roller",
      "slot": "file_roller",
      "source": "rpm",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "libreoffice",
      "storeSlot": "libreoffice_startcenter",
      "title": "LibreOffice",
      "sub": "Suite bureautique",
      "desc": "Suite bureautique libre — Writer, Calc, Impress (Flatpak Flathub).",
      "version": "24.8",
      "size": "~280 Mo",
      "iconClass": "gnome-software__cardicon--libreoffice",
      "slot": "librewriter",
      "source": "rpm",
      "categories": [
        "productivity",
        "creation"
      ],
      "placement": {
        "overview": true,
        "dash": true
      }
    },
    {
      "id": "thunderbird",
      "storeSlot": "thunderbird",
      "title": "Thunderbird",
      "sub": "Messagerie électronique",
      "desc": "Client de messagerie libre (Flatpak org.mozilla.Thunderbird).",
      "version": "128.0",
      "size": "~85 Mo",
      "iconClass": "gnome-software__cardicon--thunderbird",
      "slot": "thunderbird",
      "source": "rpm",
      "categories": [
        "productivity"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "transmission",
      "storeSlot": "transmission",
      "title": "Transmission",
      "sub": "Client BitTorrent",
      "desc": "Téléchargez des fichiers via BitTorrent (Flatpak com.transmissionbt.Transmission).",
      "version": "4.0",
      "size": "~8 Mo",
      "iconClass": "gnome-software__cardicon--transmission",
      "slot": "transmission",
      "source": "rpm",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "rhythmbox",
      "storeSlot": "rhythmbox",
      "title": "Rhythmbox",
      "sub": "Lecteur de musique",
      "desc": "Organisez et écoutez votre bibliothèque musicale (RPM rhythmbox).",
      "version": "3.4",
      "size": "~12 Mo",
      "iconClass": "gnome-software__cardicon--rhythmbox",
      "slot": "rhythmbox",
      "source": "rpm",
      "categories": [
        "multimedia"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "lecteur-multimedia",
      "storeSlot": "lecteur_multimedia",
      "title": "Lecteur vidéo",
      "sub": "Celluloid",
      "desc": "Lisez vos fichiers vidéo (Flatpak io.github.celluloid_player.Celluloid).",
      "version": "0.27",
      "size": "~5 Mo",
      "iconClass": "gnome-software__cardicon--lecteur-multimedia",
      "slot": "lecteur_multimedia",
      "source": "rpm",
      "categories": [
        "multimedia"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "drawing",
      "storeSlot": "drawing",
      "title": "Dessin",
      "sub": "Dessin et annotation",
      "desc": "Dessinez et annotez des images (Flatpak com.github.maoschanz.drawing).",
      "version": "1.2",
      "size": "~3 Mo",
      "iconClass": "gnome-software__cardicon--drawing",
      "slot": "drawing",
      "source": "flatpak",
      "categories": [
        "creation"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "simple-scan",
      "storeSlot": "simple_scan",
      "title": "Numérisation",
      "sub": "Numérisation",
      "desc": "Numérisez des documents avec votre scanner (RPM simple-scan).",
      "version": "46.0",
      "size": "~4 Mo",
      "iconClass": "gnome-software__cardicon--simple-scan",
      "slot": "simple_scan",
      "source": "rpm",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "warpinator",
      "storeSlot": "warpinator",
      "title": "Warpinator",
      "sub": "Partage de fichiers",
      "desc": "Envoyez des fichiers sur le réseau local (Flatpak org.x.Warpinator).",
      "version": "1.0",
      "size": "~2 Mo",
      "iconClass": "gnome-software__cardicon--warpinator",
      "slot": "warpinator",
      "source": "flatpak",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "timeshift",
      "storeSlot": "timeshift",
      "title": "Timeshift",
      "sub": "Sauvegardes système",
      "desc": "Créez des instantanés du système (Flatpak com.timeshift.TimeShift).",
      "version": "24.0",
      "size": "~15 Mo",
      "iconClass": "gnome-software__cardicon--timeshift",
      "slot": "timeshift",
      "source": "rpm",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    }
  ],
  "linux-ubuntu": [
    {
      "id": "calendar",
      "storeSlot": "calendar",
      "title": "Agenda",
      "sub": "Calendrier et rendez-vous",
      "desc": "Consultez vos événements et rendez-vous (Flatpak org.gnome.Calendar).",
      "version": "47.0",
      "size": "~5 Mo",
      "iconClass": "gnome-software__cardicon--calendar",
      "slot": "calendar",
      "source": "flatpak",
      "categories": [
        "productivity"
      ],
      "placement": {
        "overview": true,
        "dash": true
      }
    },
    {
      "id": "file-roller",
      "storeSlot": "file_roller",
      "title": "Gestionnaire d'archives",
      "sub": "Archives compressées",
      "desc": "Créez, ouvrez et extrayez des archives (tar, zip, …).",
      "version": "43.0",
      "size": "~2 Mo",
      "iconClass": "gnome-software__cardicon--file-roller",
      "slot": "file_roller",
      "source": "deb",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "libreoffice",
      "storeSlot": "libreoffice_startcenter",
      "title": "LibreOffice",
      "sub": "Suite bureautique",
      "desc": "Suite bureautique libre — Writer, Calc, Impress (Flatpak Flathub).",
      "version": "24.8",
      "size": "~280 Mo",
      "iconClass": "gnome-software__cardicon--libreoffice",
      "slot": "librewriter",
      "source": "deb",
      "categories": [
        "productivity",
        "creation"
      ],
      "placement": {
        "overview": true,
        "dash": true
      }
    },
    {
      "id": "thunderbird",
      "storeSlot": "thunderbird",
      "title": "Thunderbird",
      "sub": "Messagerie électronique",
      "desc": "Client de messagerie libre (Flatpak org.mozilla.Thunderbird).",
      "version": "128.0",
      "size": "~85 Mo",
      "iconClass": "gnome-software__cardicon--thunderbird",
      "slot": "thunderbird",
      "source": "snap",
      "categories": [
        "productivity"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "transmission",
      "storeSlot": "transmission",
      "title": "Transmission",
      "sub": "Client BitTorrent",
      "desc": "Téléchargez des fichiers via BitTorrent (Flatpak com.transmissionbt.Transmission).",
      "version": "4.0",
      "size": "~8 Mo",
      "iconClass": "gnome-software__cardicon--transmission",
      "slot": "transmission",
      "source": "deb",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "rhythmbox",
      "storeSlot": "rhythmbox",
      "title": "Rhythmbox",
      "sub": "Lecteur de musique",
      "desc": "Organisez et écoutez votre bibliothèque musicale (RPM rhythmbox).",
      "version": "3.4",
      "size": "~12 Mo",
      "iconClass": "gnome-software__cardicon--rhythmbox",
      "slot": "rhythmbox",
      "source": "deb",
      "categories": [
        "multimedia"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "lecteur-multimedia",
      "storeSlot": "lecteur_multimedia",
      "title": "Lecteur vidéo",
      "sub": "Celluloid",
      "desc": "Lisez vos fichiers vidéo (Flatpak io.github.celluloid_player.Celluloid).",
      "version": "0.27",
      "size": "~5 Mo",
      "iconClass": "gnome-software__cardicon--lecteur-multimedia",
      "slot": "lecteur_multimedia",
      "source": "deb",
      "categories": [
        "multimedia"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "drawing",
      "storeSlot": "drawing",
      "title": "Dessin",
      "sub": "Dessin et annotation",
      "desc": "Dessinez et annotez des images (Flatpak com.github.maoschanz.drawing).",
      "version": "1.2",
      "size": "~3 Mo",
      "iconClass": "gnome-software__cardicon--drawing",
      "slot": "drawing",
      "source": "flatpak",
      "categories": [
        "creation"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "simple-scan",
      "storeSlot": "simple_scan",
      "title": "Numérisation",
      "sub": "Numérisation",
      "desc": "Numérisez des documents avec votre scanner (RPM simple-scan).",
      "version": "46.0",
      "size": "~4 Mo",
      "iconClass": "gnome-software__cardicon--simple-scan",
      "slot": "simple_scan",
      "source": "deb",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "warpinator",
      "storeSlot": "warpinator",
      "title": "Warpinator",
      "sub": "Partage de fichiers",
      "desc": "Envoyez des fichiers sur le réseau local (Flatpak org.x.Warpinator).",
      "version": "1.0",
      "size": "~2 Mo",
      "iconClass": "gnome-software__cardicon--warpinator",
      "slot": "warpinator",
      "source": "flatpak",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "timeshift",
      "storeSlot": "timeshift",
      "title": "Timeshift",
      "sub": "Sauvegardes système",
      "desc": "Créez des instantanés du système (Flatpak com.timeshift.TimeShift).",
      "version": "24.0",
      "size": "~15 Mo",
      "iconClass": "gnome-software__cardicon--timeshift",
      "slot": "timeshift",
      "source": "apt",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    }
  ],
  "linux-mint": [],
  "linux-popos": [
    {
      "id": "calendar",
      "storeSlot": "calendar",
      "title": "Agenda",
      "sub": "Calendrier et rendez-vous",
      "desc": "Consultez vos événements et rendez-vous (Flatpak org.gnome.Calendar).",
      "version": "47.0",
      "size": "~5 Mo",
      "iconClass": "gnome-software__cardicon--calendar",
      "slot": "calendar",
      "source": "flatpak",
      "categories": [
        "productivity"
      ],
      "placement": {
        "overview": true,
        "dash": true
      }
    },
    {
      "id": "file-roller",
      "storeSlot": "file_roller",
      "title": "Gestionnaire d'archives",
      "sub": "Archives compressées",
      "desc": "Créez, ouvrez et extrayez des archives (tar, zip, …).",
      "version": "43.0",
      "size": "~2 Mo",
      "iconClass": "gnome-software__cardicon--file-roller",
      "slot": "file_roller",
      "source": "deb",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "libreoffice",
      "storeSlot": "libreoffice_startcenter",
      "title": "LibreOffice",
      "sub": "Suite bureautique",
      "desc": "Suite bureautique libre — Writer, Calc, Impress (Flatpak Flathub).",
      "version": "24.8",
      "size": "~280 Mo",
      "iconClass": "gnome-software__cardicon--libreoffice",
      "slot": "librewriter",
      "source": "deb",
      "categories": [
        "productivity",
        "creation"
      ],
      "placement": {
        "overview": true,
        "dash": true
      }
    },
    {
      "id": "thunderbird",
      "storeSlot": "thunderbird",
      "title": "Thunderbird",
      "sub": "Messagerie électronique",
      "desc": "Client de messagerie libre (Flatpak org.mozilla.Thunderbird).",
      "version": "128.0",
      "size": "~85 Mo",
      "iconClass": "gnome-software__cardicon--thunderbird",
      "slot": "thunderbird",
      "source": "rpm",
      "categories": [
        "productivity"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "transmission",
      "storeSlot": "transmission",
      "title": "Transmission",
      "sub": "Client BitTorrent",
      "desc": "Téléchargez des fichiers via BitTorrent (Flatpak com.transmissionbt.Transmission).",
      "version": "4.0",
      "size": "~8 Mo",
      "iconClass": "gnome-software__cardicon--transmission",
      "slot": "transmission",
      "source": "deb",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "rhythmbox",
      "storeSlot": "rhythmbox",
      "title": "Rhythmbox",
      "sub": "Lecteur de musique",
      "desc": "Organisez et écoutez votre bibliothèque musicale (RPM rhythmbox).",
      "version": "3.4",
      "size": "~12 Mo",
      "iconClass": "gnome-software__cardicon--rhythmbox",
      "slot": "rhythmbox",
      "source": "deb",
      "categories": [
        "multimedia"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "lecteur-multimedia",
      "storeSlot": "lecteur_multimedia",
      "title": "Lecteur vidéo",
      "sub": "Celluloid",
      "desc": "Lisez vos fichiers vidéo (Flatpak io.github.celluloid_player.Celluloid).",
      "version": "0.27",
      "size": "~5 Mo",
      "iconClass": "gnome-software__cardicon--lecteur-multimedia",
      "slot": "lecteur_multimedia",
      "source": "deb",
      "categories": [
        "multimedia"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "drawing",
      "storeSlot": "drawing",
      "title": "Dessin",
      "sub": "Dessin et annotation",
      "desc": "Dessinez et annotez des images (Flatpak com.github.maoschanz.drawing).",
      "version": "1.2",
      "size": "~3 Mo",
      "iconClass": "gnome-software__cardicon--drawing",
      "slot": "drawing",
      "source": "flatpak",
      "categories": [
        "creation"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "simple-scan",
      "storeSlot": "simple_scan",
      "title": "Numérisation",
      "sub": "Numérisation",
      "desc": "Numérisez des documents avec votre scanner (RPM simple-scan).",
      "version": "46.0",
      "size": "~4 Mo",
      "iconClass": "gnome-software__cardicon--simple-scan",
      "slot": "simple_scan",
      "source": "deb",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "warpinator",
      "storeSlot": "warpinator",
      "title": "Warpinator",
      "sub": "Partage de fichiers",
      "desc": "Envoyez des fichiers sur le réseau local (Flatpak org.x.Warpinator).",
      "version": "1.0",
      "size": "~2 Mo",
      "iconClass": "gnome-software__cardicon--warpinator",
      "slot": "warpinator",
      "source": "flatpak",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "timeshift",
      "storeSlot": "timeshift",
      "title": "Timeshift",
      "sub": "Sauvegardes système",
      "desc": "Créez des instantanés du système (Flatpak com.timeshift.TimeShift).",
      "version": "24.0",
      "size": "~15 Mo",
      "iconClass": "gnome-software__cardicon--timeshift",
      "slot": "timeshift",
      "source": "deb",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    }
  ],
  "linux-anduinos": [
    {
      "id": "calendar",
      "storeSlot": "calendar",
      "title": "Agenda",
      "sub": "Calendrier et rendez-vous",
      "desc": "Consultez vos événements et rendez-vous (Flatpak org.gnome.Calendar).",
      "version": "47.0",
      "size": "~5 Mo",
      "iconClass": "gnome-software__cardicon--calendar",
      "slot": "calendar",
      "source": "flatpak",
      "categories": [
        "productivity"
      ],
      "placement": {
        "overview": true,
        "dash": true
      }
    },
    {
      "id": "file-roller",
      "storeSlot": "file_roller",
      "title": "Gestionnaire d'archives",
      "sub": "Archives compressées",
      "desc": "Créez, ouvrez et extrayez des archives (tar, zip, …).",
      "version": "43.0",
      "size": "~2 Mo",
      "iconClass": "gnome-software__cardicon--file-roller",
      "slot": "file_roller",
      "source": "deb",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "libreoffice",
      "storeSlot": "libreoffice_startcenter",
      "title": "LibreOffice",
      "sub": "Suite bureautique",
      "desc": "Suite bureautique libre — Writer, Calc, Impress (Flatpak Flathub).",
      "version": "24.8",
      "size": "~280 Mo",
      "iconClass": "gnome-software__cardicon--libreoffice",
      "slot": "librewriter",
      "source": "flatpak",
      "categories": [
        "productivity",
        "creation"
      ],
      "placement": {
        "overview": true,
        "dash": true
      }
    },
    {
      "id": "thunderbird",
      "storeSlot": "thunderbird",
      "title": "Thunderbird",
      "sub": "Messagerie électronique",
      "desc": "Client de messagerie libre (Flatpak org.mozilla.Thunderbird).",
      "version": "128.0",
      "size": "~85 Mo",
      "iconClass": "gnome-software__cardicon--thunderbird",
      "slot": "thunderbird",
      "source": "flatpak",
      "categories": [
        "productivity"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "transmission",
      "storeSlot": "transmission",
      "title": "Transmission",
      "sub": "Client BitTorrent",
      "desc": "Téléchargez des fichiers via BitTorrent (Flatpak com.transmissionbt.Transmission).",
      "version": "4.0",
      "size": "~8 Mo",
      "iconClass": "gnome-software__cardicon--transmission",
      "slot": "transmission",
      "source": "flatpak",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "rhythmbox",
      "storeSlot": "rhythmbox",
      "title": "Rhythmbox",
      "sub": "Lecteur de musique",
      "desc": "Organisez et écoutez votre bibliothèque musicale (RPM rhythmbox).",
      "version": "3.4",
      "size": "~12 Mo",
      "iconClass": "gnome-software__cardicon--rhythmbox",
      "slot": "rhythmbox",
      "source": "deb",
      "categories": [
        "multimedia"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "lecteur-multimedia",
      "storeSlot": "lecteur_multimedia",
      "title": "Lecteur vidéo",
      "sub": "Celluloid",
      "desc": "Lisez vos fichiers vidéo (Flatpak io.github.celluloid_player.Celluloid).",
      "version": "0.27",
      "size": "~5 Mo",
      "iconClass": "gnome-software__cardicon--lecteur-multimedia",
      "slot": "lecteur_multimedia",
      "source": "flatpak",
      "categories": [
        "multimedia"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "drawing",
      "storeSlot": "drawing",
      "title": "Dessin",
      "sub": "Dessin et annotation",
      "desc": "Dessinez et annotez des images (Flatpak com.github.maoschanz.drawing).",
      "version": "1.2",
      "size": "~3 Mo",
      "iconClass": "gnome-software__cardicon--drawing",
      "slot": "drawing",
      "source": "flatpak",
      "categories": [
        "creation"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "simple-scan",
      "storeSlot": "simple_scan",
      "title": "Numérisation",
      "sub": "Numérisation",
      "desc": "Numérisez des documents avec votre scanner (RPM simple-scan).",
      "version": "46.0",
      "size": "~4 Mo",
      "iconClass": "gnome-software__cardicon--simple-scan",
      "slot": "simple_scan",
      "source": "deb",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "warpinator",
      "storeSlot": "warpinator",
      "title": "Warpinator",
      "sub": "Partage de fichiers",
      "desc": "Envoyez des fichiers sur le réseau local (Flatpak org.x.Warpinator).",
      "version": "1.0",
      "size": "~2 Mo",
      "iconClass": "gnome-software__cardicon--warpinator",
      "slot": "warpinator",
      "source": "flatpak",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    },
    {
      "id": "timeshift",
      "storeSlot": "timeshift",
      "title": "Timeshift",
      "sub": "Sauvegardes système",
      "desc": "Créez des instantanés du système (Flatpak com.timeshift.TimeShift).",
      "version": "24.0",
      "size": "~15 Mo",
      "iconClass": "gnome-software__cardicon--timeshift",
      "slot": "timeshift",
      "source": "flatpak",
      "categories": [
        "utilities"
      ],
      "placement": {
        "overview": true
      }
    }
  ],
  "linux-kde-neon": [],
  "linux-opensuse": []
};
}(typeof window !== 'undefined' ? window : globalThis));
