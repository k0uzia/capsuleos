/**
 * Registre clusters CapsuleOS (généré).
 * Source : etc/capsuleos/cluster-registry.json
 * Regénérer : node usr/lib/capsuleos/tools/build-cluster-registry.mjs
 */
(function (global) {
    'use strict';
    const REGISTRY = {
  "version": 1,
  "updated": "2026-06-04",
  "description": "Hiérarchie des gabarits CapsuleOS — kernel → branch → toolkit → cluster.",
  "clusters": [
    {
      "id": "toolkit.cinnamon",
      "level": "toolkit",
      "kernelId": "linux",
      "toolkitId": "cinnamon",
      "chromeContract": "cinnamon",
      "behaviorsModule": "usr/lib/capsuleos/shells/linux/cinnamon-window-behaviors.js"
    },
    {
      "id": "toolkit.gnome",
      "level": "toolkit",
      "kernelId": "linux",
      "toolkitId": "gnome",
      "chromeContract": "gnome",
      "behaviorsModule": "usr/lib/capsuleos/shells/linux/gnome-window-behaviors.js"
    },
    {
      "id": "toolkit.kde",
      "level": "toolkit",
      "kernelId": "linux",
      "toolkitId": "kde",
      "chromeContract": "kde"
    },
    {
      "id": "toolkit.cosmic",
      "level": "toolkit",
      "kernelId": "linux",
      "toolkitId": "cosmic",
      "chromeContract": "cosmic"
    },
    {
      "id": "explorer.nemo.cinnamon",
      "level": "cluster",
      "kernelId": "linux",
      "toolkitId": "cinnamon",
      "parentId": "toolkit.cinnamon",
      "slotId": "nemo",
      "templateId": "nemo",
      "paths": {
        "html": "usr/share/capsuleos/linux/explorers/nemo/shell.html",
        "css": [
          "usr/share/capsuleos/linux/explorers/nemo/base.css"
        ]
      }
    },
    {
      "id": "explorer.nemo.gnome",
      "level": "cluster",
      "kernelId": "linux",
      "toolkitId": "gnome",
      "parentId": "toolkit.gnome",
      "slotId": "nemo",
      "templateId": "nemo-gnome",
      "paths": {
        "html": "usr/share/capsuleos/linux/explorers/nautilus/shell-gnome.html",
        "css": [
          "usr/share/capsuleos/linux/explorers/nemo/base.css",
          "usr/share/capsuleos/linux/explorers/nautilus/header-gnome.css"
        ]
      }
    },
    {
      "id": "explorer.nautilus.gnome",
      "level": "cluster",
      "kernelId": "linux",
      "toolkitId": "gnome",
      "parentId": "toolkit.gnome",
      "slotId": "nemo",
      "templateId": "nautilus",
      "paths": {
        "html": "usr/share/capsuleos/linux/explorers/nautilus/shell-gnome.html",
        "css": [
          "usr/share/capsuleos/linux/explorers/nemo/base.css",
          "usr/share/capsuleos/linux/explorers/nautilus/header-gnome.css"
        ]
      }
    },
    {
      "id": "explorer.dolphin.kde",
      "level": "cluster",
      "kernelId": "linux",
      "toolkitId": "kde",
      "parentId": "toolkit.kde",
      "slotId": "nemo",
      "templateId": "dolphin",
      "paths": {
        "html": "usr/share/capsuleos/linux/explorers/dolphin/shell.html",
        "css": [
          "usr/share/capsuleos/linux/explorers/nemo/base.css",
          "usr/share/capsuleos/linux/explorers/dolphin/base.css"
        ]
      }
    },
    {
      "id": "explorer.nemo.cosmic",
      "level": "cluster",
      "kernelId": "linux",
      "toolkitId": "cosmic",
      "parentId": "toolkit.cosmic",
      "slotId": "nemo",
      "templateId": "nemo-cosmic",
      "paths": {
        "html": "usr/share/capsuleos/linux/explorers/nautilus/shell-cosmic.html",
        "css": [
          "usr/share/capsuleos/linux/explorers/nemo/base.css"
        ]
      }
    },
    {
      "id": "cluster.app.firefox",
      "level": "cluster",
      "kernelId": "linux",
      "slotId": "firefox",
      "templateId": "firefox",
      "paths": {
        "html": "usr/share/capsuleos/linux/apps/firefox.html",
        "css": [
          "usr/share/capsuleos/linux/apps/style/firefox.base.css"
        ]
      }
    },
    {
      "id": "cluster.app.terminal",
      "level": "cluster",
      "kernelId": "linux",
      "slotId": "terminal",
      "templateId": "terminal",
      "paths": {
        "html": "usr/share/capsuleos/linux/apps/terminal.html",
        "css": [
          "usr/share/capsuleos/linux/apps/style/terminal.base.css"
        ]
      }
    },
    {
      "id": "toolkit.windows-shell",
      "level": "toolkit",
      "kernelId": "windows-nt",
      "toolkitId": "windows-shell",
      "chromeContract": "windows-shell"
    },
    {
      "id": "toolkit.macos-aqua",
      "level": "toolkit",
      "kernelId": "darwin",
      "toolkitId": "macos-aqua"
    }
  ]
};
    const BY_ID = {
  "toolkit.cinnamon": {
    "id": "toolkit.cinnamon",
    "level": "toolkit",
    "kernelId": "linux",
    "toolkitId": "cinnamon",
    "chromeContract": "cinnamon",
    "behaviorsModule": "usr/lib/capsuleos/shells/linux/cinnamon-window-behaviors.js"
  },
  "toolkit.gnome": {
    "id": "toolkit.gnome",
    "level": "toolkit",
    "kernelId": "linux",
    "toolkitId": "gnome",
    "chromeContract": "gnome",
    "behaviorsModule": "usr/lib/capsuleos/shells/linux/gnome-window-behaviors.js"
  },
  "toolkit.kde": {
    "id": "toolkit.kde",
    "level": "toolkit",
    "kernelId": "linux",
    "toolkitId": "kde",
    "chromeContract": "kde"
  },
  "toolkit.cosmic": {
    "id": "toolkit.cosmic",
    "level": "toolkit",
    "kernelId": "linux",
    "toolkitId": "cosmic",
    "chromeContract": "cosmic"
  },
  "explorer.nemo.cinnamon": {
    "id": "explorer.nemo.cinnamon",
    "level": "cluster",
    "kernelId": "linux",
    "toolkitId": "cinnamon",
    "parentId": "toolkit.cinnamon",
    "slotId": "nemo",
    "templateId": "nemo",
    "paths": {
      "html": "usr/share/capsuleos/linux/explorers/nemo/shell.html",
      "css": [
        "usr/share/capsuleos/linux/explorers/nemo/base.css"
      ]
    }
  },
  "explorer.nemo.gnome": {
    "id": "explorer.nemo.gnome",
    "level": "cluster",
    "kernelId": "linux",
    "toolkitId": "gnome",
    "parentId": "toolkit.gnome",
    "slotId": "nemo",
    "templateId": "nemo-gnome",
    "paths": {
      "html": "usr/share/capsuleos/linux/explorers/nautilus/shell-gnome.html",
      "css": [
        "usr/share/capsuleos/linux/explorers/nemo/base.css",
        "usr/share/capsuleos/linux/explorers/nautilus/header-gnome.css"
      ]
    }
  },
  "explorer.nautilus.gnome": {
    "id": "explorer.nautilus.gnome",
    "level": "cluster",
    "kernelId": "linux",
    "toolkitId": "gnome",
    "parentId": "toolkit.gnome",
    "slotId": "nemo",
    "templateId": "nautilus",
    "paths": {
      "html": "usr/share/capsuleos/linux/explorers/nautilus/shell-gnome.html",
      "css": [
        "usr/share/capsuleos/linux/explorers/nemo/base.css",
        "usr/share/capsuleos/linux/explorers/nautilus/header-gnome.css"
      ]
    }
  },
  "explorer.dolphin.kde": {
    "id": "explorer.dolphin.kde",
    "level": "cluster",
    "kernelId": "linux",
    "toolkitId": "kde",
    "parentId": "toolkit.kde",
    "slotId": "nemo",
    "templateId": "dolphin",
    "paths": {
      "html": "usr/share/capsuleos/linux/explorers/dolphin/shell.html",
      "css": [
        "usr/share/capsuleos/linux/explorers/nemo/base.css",
        "usr/share/capsuleos/linux/explorers/dolphin/base.css"
      ]
    }
  },
  "explorer.nemo.cosmic": {
    "id": "explorer.nemo.cosmic",
    "level": "cluster",
    "kernelId": "linux",
    "toolkitId": "cosmic",
    "parentId": "toolkit.cosmic",
    "slotId": "nemo",
    "templateId": "nemo-cosmic",
    "paths": {
      "html": "usr/share/capsuleos/linux/explorers/nautilus/shell-cosmic.html",
      "css": [
        "usr/share/capsuleos/linux/explorers/nemo/base.css"
      ]
    }
  },
  "cluster.app.firefox": {
    "id": "cluster.app.firefox",
    "level": "cluster",
    "kernelId": "linux",
    "slotId": "firefox",
    "templateId": "firefox",
    "paths": {
      "html": "usr/share/capsuleos/linux/apps/firefox.html",
      "css": [
        "usr/share/capsuleos/linux/apps/style/firefox.base.css"
      ]
    }
  },
  "cluster.app.terminal": {
    "id": "cluster.app.terminal",
    "level": "cluster",
    "kernelId": "linux",
    "slotId": "terminal",
    "templateId": "terminal",
    "paths": {
      "html": "usr/share/capsuleos/linux/apps/terminal.html",
      "css": [
        "usr/share/capsuleos/linux/apps/style/terminal.base.css"
      ]
    }
  },
  "toolkit.windows-shell": {
    "id": "toolkit.windows-shell",
    "level": "toolkit",
    "kernelId": "windows-nt",
    "toolkitId": "windows-shell",
    "chromeContract": "windows-shell"
  },
  "toolkit.macos-aqua": {
    "id": "toolkit.macos-aqua",
    "level": "toolkit",
    "kernelId": "darwin",
    "toolkitId": "macos-aqua"
  }
};
    const BY_TEMPLATE = {
  "nemo": {
    "id": "explorer.nemo.cinnamon",
    "level": "cluster",
    "kernelId": "linux",
    "toolkitId": "cinnamon",
    "parentId": "toolkit.cinnamon",
    "slotId": "nemo",
    "templateId": "nemo",
    "paths": {
      "html": "usr/share/capsuleos/linux/explorers/nemo/shell.html",
      "css": [
        "usr/share/capsuleos/linux/explorers/nemo/base.css"
      ]
    }
  },
  "nemo-gnome": {
    "id": "explorer.nemo.gnome",
    "level": "cluster",
    "kernelId": "linux",
    "toolkitId": "gnome",
    "parentId": "toolkit.gnome",
    "slotId": "nemo",
    "templateId": "nemo-gnome",
    "paths": {
      "html": "usr/share/capsuleos/linux/explorers/nautilus/shell-gnome.html",
      "css": [
        "usr/share/capsuleos/linux/explorers/nemo/base.css",
        "usr/share/capsuleos/linux/explorers/nautilus/header-gnome.css"
      ]
    }
  },
  "nautilus": {
    "id": "explorer.nautilus.gnome",
    "level": "cluster",
    "kernelId": "linux",
    "toolkitId": "gnome",
    "parentId": "toolkit.gnome",
    "slotId": "nemo",
    "templateId": "nautilus",
    "paths": {
      "html": "usr/share/capsuleos/linux/explorers/nautilus/shell-gnome.html",
      "css": [
        "usr/share/capsuleos/linux/explorers/nemo/base.css",
        "usr/share/capsuleos/linux/explorers/nautilus/header-gnome.css"
      ]
    }
  },
  "dolphin": {
    "id": "explorer.dolphin.kde",
    "level": "cluster",
    "kernelId": "linux",
    "toolkitId": "kde",
    "parentId": "toolkit.kde",
    "slotId": "nemo",
    "templateId": "dolphin",
    "paths": {
      "html": "usr/share/capsuleos/linux/explorers/dolphin/shell.html",
      "css": [
        "usr/share/capsuleos/linux/explorers/nemo/base.css",
        "usr/share/capsuleos/linux/explorers/dolphin/base.css"
      ]
    }
  },
  "nemo-cosmic": {
    "id": "explorer.nemo.cosmic",
    "level": "cluster",
    "kernelId": "linux",
    "toolkitId": "cosmic",
    "parentId": "toolkit.cosmic",
    "slotId": "nemo",
    "templateId": "nemo-cosmic",
    "paths": {
      "html": "usr/share/capsuleos/linux/explorers/nautilus/shell-cosmic.html",
      "css": [
        "usr/share/capsuleos/linux/explorers/nemo/base.css"
      ]
    }
  },
  "firefox": {
    "id": "cluster.app.firefox",
    "level": "cluster",
    "kernelId": "linux",
    "slotId": "firefox",
    "templateId": "firefox",
    "paths": {
      "html": "usr/share/capsuleos/linux/apps/firefox.html",
      "css": [
        "usr/share/capsuleos/linux/apps/style/firefox.base.css"
      ]
    }
  },
  "terminal": {
    "id": "cluster.app.terminal",
    "level": "cluster",
    "kernelId": "linux",
    "slotId": "terminal",
    "templateId": "terminal",
    "paths": {
      "html": "usr/share/capsuleos/linux/apps/terminal.html",
      "css": [
        "usr/share/capsuleos/linux/apps/style/terminal.base.css"
      ]
    }
  }
};

    global.CapsuleClusterRegistry = {
        version: REGISTRY.version,
        get(id) { return BY_ID[id] || null; },
        byTemplateId(templateId) { return BY_TEMPLATE[templateId] || null; },
        resolveHtmlPath(templateId, appsBase) {
            const cluster = BY_TEMPLATE[templateId];
            if (!cluster || !cluster.paths || !cluster.paths.html) {
                return null;
            }
            const html = cluster.paths.html;
            if (html.startsWith('usr/share/')) {
                const rel = appsBase.replace(/\/apps$/, '').replace(/\/linux\/apps$/, '');
                if (appsBase.includes('linux/apps')) {
                    return html.replace('usr/share/capsuleos/linux/', appsBase.replace(/\/apps$/, '/') );
                }
                return html;
            }
            return html;
        },
        resolveCssStack(templateId) {
            const cluster = BY_TEMPLATE[templateId];
            return cluster && cluster.paths && cluster.paths.css ? cluster.paths.css : [];
        },
        all() { return REGISTRY.clusters.slice(); }
    };
}(typeof window !== 'undefined' ? window : globalThis));
