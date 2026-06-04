/**
 * Profils skin CapsuleOS (généré).
 * Source : etc/capsuleos/profiles/*.json
 * Regénérer : node usr/lib/capsuleos/tools/build-skin-profiles.mjs
 */
window.CAPSULE_SKIN_PROFILES = {
  "anduinos": {
    "id": "linux-anduinos",
    "version": 1,
    "family": "linux",
    "vendor": "anduin",
    "displayName": "AnduinOS",
    "bodyId": "anduinos",
    "embedKey": "anduinos",
    "tier": "P3",
    "status": "active",
    "paths": {
      "facade": "OS/linux/families/debian/anduinos/index.html",
      "skin": "home/Debian/AnduinOS/index.html"
    },
    "toolkit": {
      "id": "gnome",
      "shell": "gnome"
    },
    "assets": {
      "assetsBase": "../../../usr/share/capsuleos/assets",
      "toolkitPack": "toolkits/gnome",
      "vendorPack": "vendors/anduin",
      "iconPacks": [
        "icons/gnome"
      ]
    },
    "capsuleGlobals": {
      "CAPSULE_APPS_BASE": "../../../usr/share/capsuleos/linux/apps",
      "CAPSULE_SKIN_BASE": ".",
      "CAPSULE_STRINGS_URL": "./content/strings.json",
      "CAPSULE_EXPLORER_DISPLAY_NAME": "Fichiers",
      "CAPSULE_EXPLORER_TEMPLATE": "nemo-gnome",
      "CAPSULE_EMBED_SKIN_KEY": "anduinos",
      "CAPSULE_SITE_HOME": "../../../index.html",
      "CAPSULE_LINUX_HUB": "../../../OS/linux/index.html",
      "CAPSULE_TERMINAL_OS_FAMILY": "linux",
      "CAPSULE_TERMINAL_PROFILE": "debian"
    }
  },
  "debian-kde": {
    "id": "linux-debian-kde",
    "version": 1,
    "family": "linux",
    "vendor": "debian",
    "displayName": "Debian KDE (Plasma)",
    "bodyId": "debian-kde",
    "embedKey": "debiankde",
    "tier": "P2",
    "status": "active",
    "paths": {
      "facade": "OS/linux/families/debian/debian-kde/index.html",
      "skin": "home/Debian/Debian-KDE/index.html"
    },
    "toolkit": {
      "id": "kde",
      "shell": "plasma"
    },
    "assets": {
      "assetsBase": "../../../usr/share/capsuleos/assets",
      "toolkitPack": "toolkits/kde",
      "vendorPack": "vendors/debian",
      "iconPacks": [
        "icons/kde"
      ]
    },
    "capsuleGlobals": {
      "CAPSULE_APPS_BASE": "../../../usr/share/capsuleos/linux/apps",
      "CAPSULE_SKIN_BASE": ".",
      "CAPSULE_STRINGS_URL": "./content/strings.json",
      "CAPSULE_EXPLORER_DISPLAY_NAME": "Dolphin",
      "CAPSULE_EXPLORER_TEMPLATE": "dolphin",
      "CAPSULE_EMBED_SKIN_KEY": "debiankde",
      "CAPSULE_SITE_HOME": "../../../index.html",
      "CAPSULE_LINUX_HUB": "../../../OS/linux/index.html",
      "CAPSULE_TERMINAL_OS_FAMILY": "linux",
      "CAPSULE_TERMINAL_PROFILE": "debian",
      "CAPSULE_EXPLORER_APP_ID": "nemo",
      "CAPSULE_EXPLORER_SKIN_KEY": "dolphin"
    }
  },
  "fedora": {
    "id": "linux-fedora",
    "version": 1,
    "family": "linux",
    "vendor": "fedora",
    "displayName": "Fedora Workstation",
    "bodyId": "fedora",
    "embedKey": "fedora",
    "tier": "P1",
    "status": "active",
    "paths": {
      "facade": "OS/linux/families/redhat/fedora/index.html",
      "skin": "home/RedHat/Fedora/index.html"
    },
    "toolkit": {
      "id": "gnome",
      "shell": "gnome"
    },
    "assets": {
      "assetsBase": "../../../usr/share/capsuleos/assets",
      "toolkitPack": "toolkits/gnome",
      "vendorPack": "vendors/fedora",
      "iconPacks": [
        "icons/gnome"
      ]
    },
    "capsuleGlobals": {
      "CAPSULE_APPS_BASE": "../../../usr/share/capsuleos/linux/apps",
      "CAPSULE_SKIN_BASE": ".",
      "CAPSULE_STRINGS_URL": "./content/strings.json",
      "CAPSULE_EXPLORER_DISPLAY_NAME": "Fichiers",
      "CAPSULE_EXPLORER_TEMPLATE": "nemo",
      "CAPSULE_EMBED_SKIN_KEY": "fedora",
      "CAPSULE_SITE_HOME": "../../../index.html",
      "CAPSULE_LINUX_HUB": "../../../OS/linux/index.html",
      "CAPSULE_TERMINAL_OS_FAMILY": "linux",
      "CAPSULE_TERMINAL_PROFILE": "fedora",
      "CAPSULE_CHECKLIST_STORAGE_KEY": "fedora-checklist"
    }
  },
  "mint": {
    "id": "linux-mint",
    "version": 1,
    "family": "linux",
    "vendor": "mint",
    "displayName": "Linux Mint (Cinnamon)",
    "bodyId": "mint",
    "embedKey": "mint",
    "tier": "P0",
    "status": "active",
    "paths": {
      "facade": "OS/linux/families/debian/mint/index.html",
      "skin": "home/Debian/Mint/index.html"
    },
    "toolkit": {
      "id": "cinnamon",
      "shell": "cinnamon"
    },
    "assets": {
      "assetsBase": "../../../usr/share/capsuleos/assets",
      "toolkitPack": "toolkits/cinnamon",
      "vendorPack": "vendors/mint",
      "iconPacks": [
        "icons/cinnamon"
      ]
    },
    "capsuleGlobals": {
      "CAPSULE_APPS_BASE": "../../../usr/share/capsuleos/linux/apps",
      "CAPSULE_SKIN_BASE": ".",
      "CAPSULE_STRINGS_URL": "./content/strings.json",
      "CAPSULE_EXPLORER_DISPLAY_NAME": "Nemo",
      "CAPSULE_EXPLORER_TEMPLATE": "nemo",
      "CAPSULE_EMBED_SKIN_KEY": "mint",
      "CAPSULE_SITE_HOME": "../../../index.html",
      "CAPSULE_LINUX_HUB": "../../../OS/linux/index.html",
      "CAPSULE_TERMINAL_OS_FAMILY": "linux",
      "CAPSULE_TERMINAL_PROFILE": "debian",
      "CAPSULE_CHECKLIST_STORAGE_KEY": "mint-checklist",
      "CAPSULE_WINDOW_CONTEXT": {
        "family": "linux",
        "draggable": true,
        "resizable": true,
        "forceOnOpen": true,
        "requireHeader": true,
        "headerLayout": "capsule",
        "edgeTiling": true,
        "skipSlots": [
          "mainMenu"
        ],
        "bounds": {
          "mainSelector": "object#desktop, #desktop",
          "desktopSelector": "object#desktop, #desktop",
          "footerSelector": "footer, #tableau",
          "subtractFooter": false
        }
      }
    }
  },
  "mx-kde": {
    "id": "linux-mx-kde",
    "version": 1,
    "family": "linux",
    "vendor": "mx",
    "displayName": "MX Linux KDE",
    "bodyId": "mx-kde",
    "embedKey": "mxkde",
    "tier": "P1",
    "status": "active",
    "paths": {
      "facade": "OS/linux/families/debian/mx-kde/index.html",
      "skin": "home/Debian/MX-KDE/index.html"
    },
    "toolkit": {
      "id": "kde",
      "shell": "plasma"
    },
    "assets": {
      "assetsBase": "../../../usr/share/capsuleos/assets",
      "toolkitPack": "toolkits/kde",
      "vendorPack": "vendors/mx",
      "iconPacks": [
        "icons/kde"
      ]
    },
    "capsuleGlobals": {
      "CAPSULE_APPS_BASE": "../../../usr/share/capsuleos/linux/apps",
      "CAPSULE_SKIN_BASE": ".",
      "CAPSULE_STRINGS_URL": "./content/strings.json",
      "CAPSULE_EXPLORER_DISPLAY_NAME": "Dolphin",
      "CAPSULE_EXPLORER_TEMPLATE": "dolphin",
      "CAPSULE_EMBED_SKIN_KEY": "mxkde",
      "CAPSULE_SITE_HOME": "../../../index.html",
      "CAPSULE_LINUX_HUB": "../../../OS/linux/index.html",
      "CAPSULE_TERMINAL_OS_FAMILY": "linux",
      "CAPSULE_TERMINAL_PROFILE": "debian",
      "CAPSULE_CHECKLIST_STORAGE_KEY": "mxkde-checklist",
      "CAPSULE_EXPLORER_APP_ID": "nemo",
      "CAPSULE_EXPLORER_SKIN_KEY": "dolphin",
      "CAPSULE_TEMPLATE_OVERRIDES": {
        "update_manager": "../../../usr/share/capsuleos/linux/apps/update_manager_kde.html"
      },
      "CAPSULE_TERMINAL_USER": "mx-linux",
      "CAPSULE_TERMINAL_HOST": "mx"
    }
  },
  "opensuse": {
    "id": "linux-opensuse",
    "version": 1,
    "family": "linux",
    "vendor": "opensuse",
    "displayName": "openSUSE Tumbleweed",
    "bodyId": "opensuse",
    "embedKey": "opensuse",
    "tier": "P1",
    "status": "active",
    "paths": {
      "facade": "OS/linux/families/suse/opensuse/index.html",
      "skin": "home/SUSE/openSUSE/index.html"
    },
    "toolkit": {
      "id": "kde",
      "shell": "plasma"
    },
    "assets": {
      "assetsBase": "../../../usr/share/capsuleos/assets",
      "toolkitPack": "toolkits/kde",
      "vendorPack": "vendors/opensuse",
      "iconPacks": [
        "icons/kde"
      ]
    },
    "capsuleGlobals": {
      "CAPSULE_APPS_BASE": "../../../usr/share/capsuleos/linux/apps",
      "CAPSULE_SKIN_BASE": ".",
      "CAPSULE_STRINGS_URL": "./content/strings.json",
      "CAPSULE_EXPLORER_DISPLAY_NAME": "Dolphin",
      "CAPSULE_EXPLORER_TEMPLATE": "dolphin",
      "CAPSULE_EMBED_SKIN_KEY": "opensuse",
      "CAPSULE_SITE_HOME": "../../../index.html",
      "CAPSULE_LINUX_HUB": "../../../OS/linux/index.html",
      "CAPSULE_TERMINAL_OS_FAMILY": "linux",
      "CAPSULE_TERMINAL_PROFILE": "debian",
      "CAPSULE_EXPLORER_APP_ID": "nemo",
      "CAPSULE_EXPLORER_SKIN_KEY": "dolphin"
    }
  },
  "popos": {
    "id": "linux-popos",
    "version": 1,
    "family": "linux",
    "vendor": "popos",
    "displayName": "Pop!_OS",
    "bodyId": "popos",
    "embedKey": "popos",
    "tier": "P2",
    "status": "active",
    "paths": {
      "facade": "OS/linux/families/debian/popos/index.html",
      "skin": "home/Debian/PopOS/index.html"
    },
    "toolkit": {
      "id": "cosmic",
      "shell": "cosmic"
    },
    "assets": {
      "assetsBase": "../../../usr/share/capsuleos/assets",
      "toolkitPack": "toolkits/cosmic",
      "vendorPack": "vendors/popos",
      "iconPacks": [
        "icons/gnome"
      ]
    },
    "capsuleGlobals": {
      "CAPSULE_APPS_BASE": "../../../usr/share/capsuleos/linux/apps",
      "CAPSULE_SKIN_BASE": ".",
      "CAPSULE_STRINGS_URL": "./content/strings.json",
      "CAPSULE_EXPLORER_DISPLAY_NAME": "Fichiers",
      "CAPSULE_EXPLORER_TEMPLATE": "nemo-cosmic",
      "CAPSULE_EMBED_SKIN_KEY": "popos",
      "CAPSULE_SITE_HOME": "../../../index.html",
      "CAPSULE_LINUX_HUB": "../../../OS/linux/index.html",
      "CAPSULE_TERMINAL_OS_FAMILY": "linux",
      "CAPSULE_TERMINAL_PROFILE": "debian"
    }
  },
  "ubuntu": {
    "id": "linux-ubuntu",
    "version": 1,
    "family": "linux",
    "vendor": "ubuntu",
    "displayName": "Ubuntu 25.10",
    "bodyId": "ubuntu",
    "embedKey": "ubuntu",
    "tier": "P0",
    "status": "active",
    "paths": {
      "facade": "OS/linux/families/debian/ubuntu/index.html",
      "skin": "home/Debian/Ubuntu/index.html"
    },
    "toolkit": {
      "id": "gnome",
      "shell": "gnome"
    },
    "assets": {
      "assetsBase": "../../../usr/share/capsuleos/assets",
      "toolkitPack": "toolkits/gnome",
      "vendorPack": "vendors/ubuntu",
      "iconPacks": [
        "icons/gnome"
      ]
    },
    "capsuleGlobals": {
      "CAPSULE_APPS_BASE": "../../../usr/share/capsuleos/linux/apps",
      "CAPSULE_SKIN_BASE": ".",
      "CAPSULE_STRINGS_URL": "./content/strings.json",
      "CAPSULE_EXPLORER_DISPLAY_NAME": "Fichiers",
      "CAPSULE_EXPLORER_TEMPLATE": "nemo-gnome",
      "CAPSULE_EMBED_SKIN_KEY": "ubuntu",
      "CAPSULE_SITE_HOME": "../../../index.html",
      "CAPSULE_LINUX_HUB": "../../../OS/linux/index.html",
      "CAPSULE_TERMINAL_OS_FAMILY": "linux",
      "CAPSULE_TERMINAL_PROFILE": "debian",
      "CAPSULE_CHECKLIST_STORAGE_KEY": "ubuntu-checklist",
      "CAPSULE_EXPLORER_SKIN_KEY": "nemo-gnome"
    }
  }
};
window.CAPSULE_SKIN_PROFILES_BY_ID = {
  "linux-anduinos": {
    "id": "linux-anduinos",
    "version": 1,
    "family": "linux",
    "vendor": "anduin",
    "displayName": "AnduinOS",
    "bodyId": "anduinos",
    "embedKey": "anduinos",
    "tier": "P3",
    "status": "active",
    "paths": {
      "facade": "OS/linux/families/debian/anduinos/index.html",
      "skin": "home/Debian/AnduinOS/index.html"
    },
    "toolkit": {
      "id": "gnome",
      "shell": "gnome"
    },
    "assets": {
      "assetsBase": "../../../usr/share/capsuleos/assets",
      "toolkitPack": "toolkits/gnome",
      "vendorPack": "vendors/anduin",
      "iconPacks": [
        "icons/gnome"
      ]
    },
    "capsuleGlobals": {
      "CAPSULE_APPS_BASE": "../../../usr/share/capsuleos/linux/apps",
      "CAPSULE_SKIN_BASE": ".",
      "CAPSULE_STRINGS_URL": "./content/strings.json",
      "CAPSULE_EXPLORER_DISPLAY_NAME": "Fichiers",
      "CAPSULE_EXPLORER_TEMPLATE": "nemo-gnome",
      "CAPSULE_EMBED_SKIN_KEY": "anduinos",
      "CAPSULE_SITE_HOME": "../../../index.html",
      "CAPSULE_LINUX_HUB": "../../../OS/linux/index.html",
      "CAPSULE_TERMINAL_OS_FAMILY": "linux",
      "CAPSULE_TERMINAL_PROFILE": "debian"
    }
  },
  "linux-debian-kde": {
    "id": "linux-debian-kde",
    "version": 1,
    "family": "linux",
    "vendor": "debian",
    "displayName": "Debian KDE (Plasma)",
    "bodyId": "debian-kde",
    "embedKey": "debiankde",
    "tier": "P2",
    "status": "active",
    "paths": {
      "facade": "OS/linux/families/debian/debian-kde/index.html",
      "skin": "home/Debian/Debian-KDE/index.html"
    },
    "toolkit": {
      "id": "kde",
      "shell": "plasma"
    },
    "assets": {
      "assetsBase": "../../../usr/share/capsuleos/assets",
      "toolkitPack": "toolkits/kde",
      "vendorPack": "vendors/debian",
      "iconPacks": [
        "icons/kde"
      ]
    },
    "capsuleGlobals": {
      "CAPSULE_APPS_BASE": "../../../usr/share/capsuleos/linux/apps",
      "CAPSULE_SKIN_BASE": ".",
      "CAPSULE_STRINGS_URL": "./content/strings.json",
      "CAPSULE_EXPLORER_DISPLAY_NAME": "Dolphin",
      "CAPSULE_EXPLORER_TEMPLATE": "dolphin",
      "CAPSULE_EMBED_SKIN_KEY": "debiankde",
      "CAPSULE_SITE_HOME": "../../../index.html",
      "CAPSULE_LINUX_HUB": "../../../OS/linux/index.html",
      "CAPSULE_TERMINAL_OS_FAMILY": "linux",
      "CAPSULE_TERMINAL_PROFILE": "debian",
      "CAPSULE_EXPLORER_APP_ID": "nemo",
      "CAPSULE_EXPLORER_SKIN_KEY": "dolphin"
    }
  },
  "linux-fedora": {
    "id": "linux-fedora",
    "version": 1,
    "family": "linux",
    "vendor": "fedora",
    "displayName": "Fedora Workstation",
    "bodyId": "fedora",
    "embedKey": "fedora",
    "tier": "P1",
    "status": "active",
    "paths": {
      "facade": "OS/linux/families/redhat/fedora/index.html",
      "skin": "home/RedHat/Fedora/index.html"
    },
    "toolkit": {
      "id": "gnome",
      "shell": "gnome"
    },
    "assets": {
      "assetsBase": "../../../usr/share/capsuleos/assets",
      "toolkitPack": "toolkits/gnome",
      "vendorPack": "vendors/fedora",
      "iconPacks": [
        "icons/gnome"
      ]
    },
    "capsuleGlobals": {
      "CAPSULE_APPS_BASE": "../../../usr/share/capsuleos/linux/apps",
      "CAPSULE_SKIN_BASE": ".",
      "CAPSULE_STRINGS_URL": "./content/strings.json",
      "CAPSULE_EXPLORER_DISPLAY_NAME": "Fichiers",
      "CAPSULE_EXPLORER_TEMPLATE": "nemo",
      "CAPSULE_EMBED_SKIN_KEY": "fedora",
      "CAPSULE_SITE_HOME": "../../../index.html",
      "CAPSULE_LINUX_HUB": "../../../OS/linux/index.html",
      "CAPSULE_TERMINAL_OS_FAMILY": "linux",
      "CAPSULE_TERMINAL_PROFILE": "fedora",
      "CAPSULE_CHECKLIST_STORAGE_KEY": "fedora-checklist"
    }
  },
  "linux-mint": {
    "id": "linux-mint",
    "version": 1,
    "family": "linux",
    "vendor": "mint",
    "displayName": "Linux Mint (Cinnamon)",
    "bodyId": "mint",
    "embedKey": "mint",
    "tier": "P0",
    "status": "active",
    "paths": {
      "facade": "OS/linux/families/debian/mint/index.html",
      "skin": "home/Debian/Mint/index.html"
    },
    "toolkit": {
      "id": "cinnamon",
      "shell": "cinnamon"
    },
    "assets": {
      "assetsBase": "../../../usr/share/capsuleos/assets",
      "toolkitPack": "toolkits/cinnamon",
      "vendorPack": "vendors/mint",
      "iconPacks": [
        "icons/cinnamon"
      ]
    },
    "capsuleGlobals": {
      "CAPSULE_APPS_BASE": "../../../usr/share/capsuleos/linux/apps",
      "CAPSULE_SKIN_BASE": ".",
      "CAPSULE_STRINGS_URL": "./content/strings.json",
      "CAPSULE_EXPLORER_DISPLAY_NAME": "Nemo",
      "CAPSULE_EXPLORER_TEMPLATE": "nemo",
      "CAPSULE_EMBED_SKIN_KEY": "mint",
      "CAPSULE_SITE_HOME": "../../../index.html",
      "CAPSULE_LINUX_HUB": "../../../OS/linux/index.html",
      "CAPSULE_TERMINAL_OS_FAMILY": "linux",
      "CAPSULE_TERMINAL_PROFILE": "debian",
      "CAPSULE_CHECKLIST_STORAGE_KEY": "mint-checklist",
      "CAPSULE_WINDOW_CONTEXT": {
        "family": "linux",
        "draggable": true,
        "resizable": true,
        "forceOnOpen": true,
        "requireHeader": true,
        "headerLayout": "capsule",
        "edgeTiling": true,
        "skipSlots": [
          "mainMenu"
        ],
        "bounds": {
          "mainSelector": "object#desktop, #desktop",
          "desktopSelector": "object#desktop, #desktop",
          "footerSelector": "footer, #tableau",
          "subtractFooter": false
        }
      }
    }
  },
  "linux-mx-kde": {
    "id": "linux-mx-kde",
    "version": 1,
    "family": "linux",
    "vendor": "mx",
    "displayName": "MX Linux KDE",
    "bodyId": "mx-kde",
    "embedKey": "mxkde",
    "tier": "P1",
    "status": "active",
    "paths": {
      "facade": "OS/linux/families/debian/mx-kde/index.html",
      "skin": "home/Debian/MX-KDE/index.html"
    },
    "toolkit": {
      "id": "kde",
      "shell": "plasma"
    },
    "assets": {
      "assetsBase": "../../../usr/share/capsuleos/assets",
      "toolkitPack": "toolkits/kde",
      "vendorPack": "vendors/mx",
      "iconPacks": [
        "icons/kde"
      ]
    },
    "capsuleGlobals": {
      "CAPSULE_APPS_BASE": "../../../usr/share/capsuleos/linux/apps",
      "CAPSULE_SKIN_BASE": ".",
      "CAPSULE_STRINGS_URL": "./content/strings.json",
      "CAPSULE_EXPLORER_DISPLAY_NAME": "Dolphin",
      "CAPSULE_EXPLORER_TEMPLATE": "dolphin",
      "CAPSULE_EMBED_SKIN_KEY": "mxkde",
      "CAPSULE_SITE_HOME": "../../../index.html",
      "CAPSULE_LINUX_HUB": "../../../OS/linux/index.html",
      "CAPSULE_TERMINAL_OS_FAMILY": "linux",
      "CAPSULE_TERMINAL_PROFILE": "debian",
      "CAPSULE_CHECKLIST_STORAGE_KEY": "mxkde-checklist",
      "CAPSULE_EXPLORER_APP_ID": "nemo",
      "CAPSULE_EXPLORER_SKIN_KEY": "dolphin",
      "CAPSULE_TEMPLATE_OVERRIDES": {
        "update_manager": "../../../usr/share/capsuleos/linux/apps/update_manager_kde.html"
      },
      "CAPSULE_TERMINAL_USER": "mx-linux",
      "CAPSULE_TERMINAL_HOST": "mx"
    }
  },
  "linux-opensuse": {
    "id": "linux-opensuse",
    "version": 1,
    "family": "linux",
    "vendor": "opensuse",
    "displayName": "openSUSE Tumbleweed",
    "bodyId": "opensuse",
    "embedKey": "opensuse",
    "tier": "P1",
    "status": "active",
    "paths": {
      "facade": "OS/linux/families/suse/opensuse/index.html",
      "skin": "home/SUSE/openSUSE/index.html"
    },
    "toolkit": {
      "id": "kde",
      "shell": "plasma"
    },
    "assets": {
      "assetsBase": "../../../usr/share/capsuleos/assets",
      "toolkitPack": "toolkits/kde",
      "vendorPack": "vendors/opensuse",
      "iconPacks": [
        "icons/kde"
      ]
    },
    "capsuleGlobals": {
      "CAPSULE_APPS_BASE": "../../../usr/share/capsuleos/linux/apps",
      "CAPSULE_SKIN_BASE": ".",
      "CAPSULE_STRINGS_URL": "./content/strings.json",
      "CAPSULE_EXPLORER_DISPLAY_NAME": "Dolphin",
      "CAPSULE_EXPLORER_TEMPLATE": "dolphin",
      "CAPSULE_EMBED_SKIN_KEY": "opensuse",
      "CAPSULE_SITE_HOME": "../../../index.html",
      "CAPSULE_LINUX_HUB": "../../../OS/linux/index.html",
      "CAPSULE_TERMINAL_OS_FAMILY": "linux",
      "CAPSULE_TERMINAL_PROFILE": "debian",
      "CAPSULE_EXPLORER_APP_ID": "nemo",
      "CAPSULE_EXPLORER_SKIN_KEY": "dolphin"
    }
  },
  "linux-popos": {
    "id": "linux-popos",
    "version": 1,
    "family": "linux",
    "vendor": "popos",
    "displayName": "Pop!_OS",
    "bodyId": "popos",
    "embedKey": "popos",
    "tier": "P2",
    "status": "active",
    "paths": {
      "facade": "OS/linux/families/debian/popos/index.html",
      "skin": "home/Debian/PopOS/index.html"
    },
    "toolkit": {
      "id": "cosmic",
      "shell": "cosmic"
    },
    "assets": {
      "assetsBase": "../../../usr/share/capsuleos/assets",
      "toolkitPack": "toolkits/cosmic",
      "vendorPack": "vendors/popos",
      "iconPacks": [
        "icons/gnome"
      ]
    },
    "capsuleGlobals": {
      "CAPSULE_APPS_BASE": "../../../usr/share/capsuleos/linux/apps",
      "CAPSULE_SKIN_BASE": ".",
      "CAPSULE_STRINGS_URL": "./content/strings.json",
      "CAPSULE_EXPLORER_DISPLAY_NAME": "Fichiers",
      "CAPSULE_EXPLORER_TEMPLATE": "nemo-cosmic",
      "CAPSULE_EMBED_SKIN_KEY": "popos",
      "CAPSULE_SITE_HOME": "../../../index.html",
      "CAPSULE_LINUX_HUB": "../../../OS/linux/index.html",
      "CAPSULE_TERMINAL_OS_FAMILY": "linux",
      "CAPSULE_TERMINAL_PROFILE": "debian"
    }
  },
  "linux-ubuntu": {
    "id": "linux-ubuntu",
    "version": 1,
    "family": "linux",
    "vendor": "ubuntu",
    "displayName": "Ubuntu 25.10",
    "bodyId": "ubuntu",
    "embedKey": "ubuntu",
    "tier": "P0",
    "status": "active",
    "paths": {
      "facade": "OS/linux/families/debian/ubuntu/index.html",
      "skin": "home/Debian/Ubuntu/index.html"
    },
    "toolkit": {
      "id": "gnome",
      "shell": "gnome"
    },
    "assets": {
      "assetsBase": "../../../usr/share/capsuleos/assets",
      "toolkitPack": "toolkits/gnome",
      "vendorPack": "vendors/ubuntu",
      "iconPacks": [
        "icons/gnome"
      ]
    },
    "capsuleGlobals": {
      "CAPSULE_APPS_BASE": "../../../usr/share/capsuleos/linux/apps",
      "CAPSULE_SKIN_BASE": ".",
      "CAPSULE_STRINGS_URL": "./content/strings.json",
      "CAPSULE_EXPLORER_DISPLAY_NAME": "Fichiers",
      "CAPSULE_EXPLORER_TEMPLATE": "nemo-gnome",
      "CAPSULE_EMBED_SKIN_KEY": "ubuntu",
      "CAPSULE_SITE_HOME": "../../../index.html",
      "CAPSULE_LINUX_HUB": "../../../OS/linux/index.html",
      "CAPSULE_TERMINAL_OS_FAMILY": "linux",
      "CAPSULE_TERMINAL_PROFILE": "debian",
      "CAPSULE_CHECKLIST_STORAGE_KEY": "ubuntu-checklist",
      "CAPSULE_EXPLORER_SKIN_KEY": "nemo-gnome"
    }
  }
};
