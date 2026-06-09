/**
 * Hooks smoke P-F3 vague 2 — 22 slots tier B (linux-mint).
 */

const INIT_BY_SLOT = {
  baobab: 'initBaobabApp',
  bulky: 'initBulkyApp',
  font_viewer: 'initFontViewerApp',
  gnome_disks: 'initGnomeDisksApp',
  gucharmap: 'initGucharmapApp',
  hypnotix: 'initHypnotixApp',
  libreoffice_draw: 'initLibreofficeDrawApp',
  libreoffice_impress: 'initLibreofficeImpressApp',
  mate_color_select: 'initMateColorSelectApp',
  mintbackup: 'initMintbackupApp',
  mintstick: 'initMintstickApp',
  mintstick_format: 'initMintstickFormatApp',
  mintwelcome: 'initMintwelcomeApp',
  power_stats: 'initPowerStatsApp',
  rhythmbox: 'initRhythmboxApp',
  simple_scan: 'initSimpleScanApp',
  thingy: 'initThingyApp',
  thunderbird: 'initThunderbirdApp',
  timeshift: 'initTimeshiftApp',
  transmission: 'initTransmissionApp',
  warpinator: 'initWarpinatorApp',
  webapp_manager: 'initWebappManagerApp',
};

const scopeSel = (slot) => `div[data-link="${slot}"]`;

const WAVE2_PLANS = {
  'baobab-open-disk': {
    prep: ['baobab'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="baobab"] #gnomeBaobabApp' },
      { type: 'textContains', selector: 'div[data-link="baobab"] .gnome-baobab__ring-center', text: '62 %' },
      { type: 'evaluateTruthy', fn: 'wave2BaobabInit' },
    ],
  },
  'baobab-place-home': {
    prep: ['baobab'],
    actions: [
      { type: 'click', selector: 'div[data-link="baobab"] .gnome-baobab__place:nth-child(2)' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'hasClass', selector: 'div[data-link="baobab"] .gnome-baobab__place:nth-child(2)', className: 'gnome-baobab__place--active' },
      { type: 'textContains', selector: 'div[data-link="baobab"] .gnome-baobab__ring-center', text: '34 %' },
    ],
  },
  'baobab-scan-run': {
    prep: ['baobab'],
    actions: [
      { type: 'click', selector: 'div[data-link="baobab"] .gnome-baobab__place:nth-child(2)' },
      { type: 'wait', ms: 60 },
      { type: 'click', selector: 'div[data-link="baobab"] .gnome-baobab__scan-btn' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'textContains', selector: 'div[data-link="baobab"] .gnome-baobab__scan-btn', text: 'Analyse' },
    ],
  },
  'bulky-open-preview': {
    prep: ['bulky'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="bulky"] #bulkyApp' },
      { type: 'textContains', selector: 'div[data-link="bulky"] .blk-app__preview', text: 'IMG_001.jpg' },
      { type: 'evaluateTruthy', fn: 'wave2BulkyInit' },
    ],
  },
  'bulky-prefix-edit': {
    prep: ['bulky'],
    actions: [
      { type: 'fill', selector: 'div[data-link="bulky"] #blk-prefix', value: 'VAC_' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'textContains', selector: 'div[data-link="bulky"] .blk-app__preview', text: 'VAC_001.jpg' },
    ],
  },
  'bulky-rename-apply': {
    prep: ['bulky'],
    actions: [
      { type: 'click', selector: 'div[data-link="bulky"] [data-blk-action="rename"]' },
      { type: 'wait', ms: 120 },
    ],
    assertions: [
      { type: 'textContains', selector: 'div[data-link="bulky"] #blk-body tr:first-child td:first-child', text: 'IMG_001.jpg' },
    ],
  },
  'font-viewer-open-list': {
    prep: ['font_viewer'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="font_viewer"] #fontViewerApp' },
      { type: 'childCountMin', selector: 'div[data-link="font_viewer"] .fnv-app__fonts', min: 3 },
      { type: 'evaluateTruthy', fn: 'wave2FontViewerInit' },
    ],
  },
  'font-viewer-select-noto': {
    prep: ['font_viewer'],
    actions: [
      { type: 'click', selector: 'div[data-link="font_viewer"] [data-font-id="noto"]' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'hasClass', selector: 'div[data-link="font_viewer"] [data-font-id="noto"]', className: 'is-selected' },
      { type: 'textContains', selector: 'div[data-link="font_viewer"] #fnv-meta', text: 'Noto Sans' },
    ],
  },
  'font-viewer-key-nav': {
    prep: ['font_viewer'],
    actions: [{ type: 'wave2Key', slot: 'font_viewer', target: '#fnv-font-list', key: 'ArrowDown' }],
    assertions: [
      { type: 'hasClass', selector: 'div[data-link="font_viewer"] [data-font-id="noto"]', className: 'is-selected' },
    ],
  },
  'gnome-disks-open-list': {
    prep: ['gnome_disks'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="gnome_disks"] #gnomeDisksApp' },
      { type: 'childCountMin', selector: 'div[data-link="gnome_disks"] #gdk-list', min: 2 },
      { type: 'evaluateTruthy', fn: 'wave2GnomeDisksInit' },
    ],
  },
  'gnome-disks-select-usb': {
    prep: ['gnome_disks'],
    actions: [
      { type: 'click', selector: 'div[data-link="gnome_disks"] .gdk-app__disk:nth-child(2)' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'hasClass', selector: 'div[data-link="gnome_disks"] .gdk-app__disk:nth-child(2)', className: 'is-selected' },
    ],
  },
  'gnome-disks-detail-panel': {
    prep: ['gnome_disks'],
    actions: [
      { type: 'click', selector: 'div[data-link="gnome_disks"] .gdk-app__disk:nth-child(2)' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'textContains', selector: 'div[data-link="gnome_disks"] #gdk-detail', text: 'Clé USB' },
    ],
  },
  'gucharmap-open-grid': {
    prep: ['gucharmap'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="gucharmap"] #gucharmapApp' },
      { type: 'evaluateTruthy', fn: 'wave2GucharmapGridReady' },
      { type: 'evaluateTruthy', fn: 'wave2GucharmapInit' },
    ],
  },
  'gucharmap-select-char': {
    prep: ['gucharmap'],
    actions: [
      { type: 'click', selector: 'div[data-link="gucharmap"] #gcm-grid .gcm-app__cell:nth-child(5)' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'textContains', selector: 'div[data-link="gucharmap"] #gcm-preview', text: 'sélectionné' },
    ],
  },
  'gucharmap-search-char': {
    prep: ['gucharmap'],
    actions: [
      { type: 'fill', selector: 'div[data-link="gucharmap"] #gcm-search', value: 'é' },
      { type: 'wait', ms: 100 },
    ],
    assertions: [
      { type: 'evaluateTruthy', fn: 'wave2GucharmapSearchVisible' },
    ],
  },
  'hypnotix-open-channels': {
    prep: ['hypnotix'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="hypnotix"] #hypnotixApp' },
      { type: 'childCountMin', selector: 'div[data-link="hypnotix"] #hyp-grid', min: 3 },
      { type: 'evaluateTruthy', fn: 'wave2HypnotixInit' },
    ],
  },
  'hypnotix-category-radio': {
    prep: ['hypnotix'],
    actions: [
      { type: 'click', selector: 'div[data-link="hypnotix"] [data-hyp-cat="radio"]' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'hasClass', selector: 'div[data-link="hypnotix"] [data-hyp-cat="radio"]', className: 'is-active' },
    ],
  },
  'hypnotix-channel-arte': {
    prep: ['hypnotix'],
    actions: [
      { type: 'click', selector: 'div[data-link="hypnotix"] [data-hyp-id="arte"]' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'textContains', selector: 'div[data-link="hypnotix"] #hyp-player', text: 'ARTE' },
    ],
  },
  'ldr-open-canvas': {
    prep: ['libreoffice_draw'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="libreoffice_draw"] #libreofficeDrawApp' },
      { type: 'selectorPresent', selector: 'div[data-link="libreoffice_draw"] #ldr-canvas' },
      { type: 'evaluateTruthy', fn: 'wave2LibreofficeDrawInit' },
    ],
  },
  'ldr-add-shape': {
    prep: ['libreoffice_draw'],
    actions: [
      { type: 'wave2LdrClickCanvas' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'evaluateTruthy', fn: 'wave2LdrShapeReady' },
    ],
  },
  'ldr-toolbar-title': {
    prep: ['libreoffice_draw'],
    assertions: [
      { type: 'textContains', selector: 'div[data-link="libreoffice_draw"] .ldr-app__title', text: 'Draw' },
    ],
  },
  'lim-open-slides': {
    prep: ['libreoffice_impress'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="libreoffice_impress"] #libreofficeImpressApp' },
      { type: 'evaluateTruthy', fn: 'wave2LimSlidesReady' },
      { type: 'evaluateTruthy', fn: 'wave2LibreofficeImpressInit' },
    ],
  },
  'lim-select-slide-2': {
    prep: ['libreoffice_impress'],
    actions: [
      { type: 'click', selector: 'div[data-link="libreoffice_impress"] .lim-app__slide:nth-child(2)' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'hasClass', selector: 'div[data-link="libreoffice_impress"] .lim-app__slide:nth-child(2)', className: 'is-active' },
    ],
  },
  'lim-stage-update': {
    prep: ['libreoffice_impress'],
    actions: [
      { type: 'click', selector: 'div[data-link="libreoffice_impress"] .lim-app__slide:nth-child(2)' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'textContains', selector: 'div[data-link="libreoffice_impress"] .lim-app__stage', text: 'Diapositive 2' },
    ],
  },
  'mcs-open-picker': {
    prep: ['mate_color_select'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="mate_color_select"] #mateColorSelectApp' },
      { type: 'evaluateTruthy', fn: 'wave2MateColorSwatchesReady' },
      { type: 'evaluateTruthy', fn: 'wave2MateColorSelectInit' },
    ],
  },
  'mcs-select-swatch': {
    prep: ['mate_color_select'],
    actions: [
      { type: 'click', selector: 'div[data-link="mate_color_select"] .mcs-app__swatch[data-mcs-color="#87cf3e"]' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'textContains', selector: 'div[data-link="mate_color_select"] #mcs-hex', text: '#87cf3e' },
    ],
  },
  'mcs-hex-update': {
    prep: ['mate_color_select'],
    actions: [
      { type: 'click', selector: 'div[data-link="mate_color_select"] .mcs-app__swatch[data-mcs-color="#f66151"]' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'textContains', selector: 'div[data-link="mate_color_select"] #mcs-hex', text: '#f66151' },
    ],
  },
  'mbk-open-wizard': {
    prep: ['mintbackup'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="mintbackup"] #mintbackupApp' },
      { type: 'selectorVisible', selector: 'div[data-link="mintbackup"] [data-mbk-step="source"]:not([hidden])' },
      { type: 'evaluateTruthy', fn: 'wave2MintbackupInit' },
    ],
  },
  'mbk-next-dest': {
    prep: ['mintbackup'],
    actions: [
      { type: 'click', selector: 'div[data-link="mintbackup"] [data-mbk-action="next"]' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="mintbackup"] [data-mbk-step="dest"]:not([hidden])' },
    ],
  },
  'mbk-browse-source': {
    prep: ['mintbackup'],
    actions: [
      { type: 'wave2MbkBrowseSource' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'inputValueContains', selector: 'div[data-link="mintbackup"] #mbk-source', text: 'Documents' },
    ],
  },
  'mstk-open-writer': {
    prep: ['mintstick'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="mintstick"] #mintstickApp' },
      { type: 'evaluateTruthy', fn: 'wave2MintstickInit' },
    ],
  },
  'mstk-browse-iso': {
    prep: ['mintstick'],
    actions: [
      { type: 'click', selector: 'div[data-link="mintstick"] [data-mstk-action="browse-iso"]' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'evaluateTruthy', fn: 'wave2MintstickIsoSelected' },
    ],
  },
  'mstk-write-ready': {
    prep: ['mintstick'],
    actions: [
      { type: 'click', selector: 'div[data-link="mintstick"] [data-mstk-action="browse-iso"]' },
      { type: 'wait', ms: 60 },
      { type: 'selectOption', selector: 'div[data-link="mintstick"] #mstk-device', value: 'sdb' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'evaluateTruthy', fn: 'wave2MintstickWriteReady' },
    ],
  },
  'mstk-fmt-open': {
    prep: ['mintstick_format'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="mintstick_format"] #mintstickFormatApp' },
      { type: 'evaluateTruthy', fn: 'wave2MintstickFormatInit' },
    ],
  },
  'mstk-fmt-select-device': {
    prep: ['mintstick_format'],
    actions: [
      { type: 'selectOption', selector: 'div[data-link="mintstick_format"] #mstk-fmt-device', value: 'sdb' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'evaluateTruthy', fn: 'wave2MintstickFormatReady' },
    ],
  },
  'mstk-fmt-run': {
    prep: ['mintstick_format'],
    actions: [
      { type: 'selectOption', selector: 'div[data-link="mintstick_format"] #mstk-fmt-device', value: 'sdb' },
      { type: 'wait', ms: 60 },
      { type: 'click', selector: 'div[data-link="mintstick_format"] [data-mstk-fmt-action="format"]' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'textContains', selector: 'div[data-link="mintstick_format"] .mstk-fmt-app__title', text: 'Formatage' },
    ],
  },
  'mtw-open-welcome': {
    prep: ['mintwelcome'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="mintwelcome"] #mintwelcomeApp' },
      { type: 'textContains', selector: 'div[data-link="mintwelcome"] .mwc-app__title', text: 'Bienvenue' },
      { type: 'evaluateTruthy', fn: 'wave2MintwelcomeInit' },
    ],
  },
  'mtw-tour-card': {
    prep: ['mintwelcome'],
    actions: [
      { type: 'click', selector: 'div[data-link="mintwelcome"] [data-mwc-action="tour"]' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'textContains', selector: 'div[data-link="mintwelcome"] .mwc-app__subtitle', text: 'Visite guidée' },
    ],
  },
  'mtw-startup-checkbox': {
    prep: ['mintwelcome'],
    assertions: [
      { type: 'selectorPresent', selector: 'div[data-link="mintwelcome"] #mwc-show-startup' },
    ],
  },
  'pwr-open-chart': {
    prep: ['power_stats'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="power_stats"] #powerStatsApp' },
      { type: 'evaluateTruthy', fn: 'wave2PowerStatsBarsReady' },
      { type: 'evaluateTruthy', fn: 'wave2PowerStatsInit' },
    ],
  },
  'pwr-select-bar': {
    prep: ['power_stats'],
    actions: [
      { type: 'wave2PwrSelectBar', index: 3 },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'evaluateTruthy', fn: 'wave2PwrBarSelected' },
    ],
  },
  'pwr-stats-legend': {
    prep: ['power_stats'],
    assertions: [
      { type: 'textContains', selector: 'div[data-link="power_stats"] .pwr-app__stats', text: '18,4 Wh' },
    ],
  },
  'rb-open-library': {
    prep: ['rhythmbox'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="rhythmbox"] #rhythmboxApp' },
      { type: 'childCountMin', selector: 'div[data-link="rhythmbox"] #rb-tracks', min: 2 },
      { type: 'evaluateTruthy', fn: 'wave2RhythmboxInit' },
    ],
  },
  'rb-select-track': {
    prep: ['rhythmbox'],
    actions: [
      { type: 'click', selector: 'div[data-link="rhythmbox"] #rb-tracks .rb-app__track:nth-child(2)' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'textContains', selector: 'div[data-link="rhythmbox"] .rb-app__now', text: 'Capsule Lab Mix' },
    ],
  },
  'rb-nav-podcasts': {
    prep: ['rhythmbox'],
    actions: [
      { type: 'click', selector: 'div[data-link="rhythmbox"] .rb-app__nav:nth-child(2)' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'hasClass', selector: 'div[data-link="rhythmbox"] .rb-app__nav:nth-child(2)', className: 'is-active' },
    ],
  },
  'scn-open-device': {
    prep: ['simple_scan'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="simple_scan"] #simpleScanApp' },
      { type: 'evaluateTruthy', fn: 'wave2SimpleScanInit' },
    ],
  },
  'scn-preview-scan': {
    prep: ['simple_scan'],
    actions: [
      { type: 'click', selector: 'div[data-link="simple_scan"] [data-scn-action="scan"]' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'textContains', selector: 'div[data-link="simple_scan"] #scn-preview', text: 'numérisation' },
    ],
  },
  'scn-save-pdf': {
    prep: ['simple_scan'],
    actions: [
      { type: 'click', selector: 'div[data-link="simple_scan"] [data-scn-action="scan"]' },
      { type: 'wait', ms: 60 },
    ],
    assertions: [
      { type: 'evaluateTruthy', fn: 'wave2SimpleScanSaveReady' },
    ],
  },
  'thy-open-books': {
    prep: ['thingy'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="thingy"] #thingyApp' },
      { type: 'childCountMin', selector: 'div[data-link="thingy"] #thy-list', min: 2 },
      { type: 'evaluateTruthy', fn: 'wave2ThingyInit' },
    ],
  },
  'thy-select-book': {
    prep: ['thingy'],
    actions: [
      { type: 'click', selector: 'div[data-link="thingy"] #thy-list .thy-app__item:nth-child(2)' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'hasClass', selector: 'div[data-link="thingy"] #thy-list .thy-app__item:nth-child(2)', className: 'is-selected' },
    ],
  },
  'thy-book-meta': {
    prep: ['thingy'],
    assertions: [
      { type: 'textContains', selector: 'div[data-link="thingy"] .thy-app__name', text: 'Guide Linux Mint' },
    ],
  },
  'tbd-open-inbox': {
    prep: ['thunderbird'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="thunderbird"] #thunderbirdApp' },
      { type: 'childCountMin', selector: 'div[data-link="thunderbird"] #tbd-msg-list', min: 1 },
      { type: 'evaluateTruthy', fn: 'wave2ThunderbirdInit' },
    ],
  },
  'tbd-select-folder': {
    prep: ['thunderbird'],
    actions: [
      { type: 'click', selector: 'div[data-link="thunderbird"] .tbd-app__folder:nth-child(2)' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'hasClass', selector: 'div[data-link="thunderbird"] .tbd-app__folder:nth-child(2)', className: 'is-selected' },
    ],
  },
  'tbd-read-message': {
    prep: ['thunderbird'],
    assertions: [
      { type: 'textContains', selector: 'div[data-link="thunderbird"] .tbd-app__msg-subject', text: 'Bienvenue' },
    ],
  },
  'tsh-open-dashboard': {
    prep: ['timeshift'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="timeshift"] #timeshiftApp' },
      { type: 'childCountMin', selector: 'div[data-link="timeshift"] #tsh-list', min: 2 },
      { type: 'evaluateTruthy', fn: 'wave2TimeshiftInit' },
    ],
  },
  'tsh-nav-schedule': {
    prep: ['timeshift'],
    actions: [
      { type: 'click', selector: 'div[data-link="timeshift"] [data-tsh-view="schedule"]' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'hasClass', selector: 'div[data-link="timeshift"] [data-tsh-view="schedule"]', className: 'is-active' },
    ],
  },
  'tsh-select-snap': {
    prep: ['timeshift'],
    actions: [
      { type: 'click', selector: 'div[data-link="timeshift"] #tsh-list .tsh-app__snap:nth-child(2)' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'hasClass', selector: 'div[data-link="timeshift"] #tsh-list .tsh-app__snap:nth-child(2)', className: 'is-selected' },
    ],
  },
  'trm-open-empty': {
    prep: ['transmission'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="transmission"] #transmissionApp' },
      { type: 'selectorVisible', selector: 'div[data-link="transmission"] #trm-empty' },
      { type: 'evaluateTruthy', fn: 'wave2TransmissionInit' },
    ],
  },
  'trm-add-torrent': {
    prep: ['transmission'],
    actions: [
      { type: 'click', selector: 'div[data-link="transmission"] [data-trm-action="add"]' },
      { type: 'wait', ms: 100 },
    ],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="transmission"] #trm-table:not([hidden])' },
    ],
  },
  'trm-filter-done': {
    prep: ['transmission'],
    actions: [
      { type: 'click', selector: 'div[data-link="transmission"] [data-trm-filter="done"]' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'hasClass', selector: 'div[data-link="transmission"] [data-trm-filter="done"]', className: 'is-active' },
    ],
  },
  'wrp-open-transfer': {
    prep: ['warpinator'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="warpinator"] #warpinatorApp' },
      { type: 'childCountMin', selector: 'div[data-link="warpinator"] #wrp-peer-list', min: 1 },
      { type: 'evaluateTruthy', fn: 'wave2WarpinatorInit' },
    ],
  },
  'wrp-send-files': {
    prep: ['warpinator'],
    actions: [
      { type: 'click', selector: 'div[data-link="warpinator"] [data-wrp-action="send"]' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'textContains', selector: 'div[data-link="warpinator"] .wrp-app__drop-hint', text: 'Sélection' },
    ],
  },
  'wrp-prefs': {
    prep: ['warpinator'],
    actions: [
      { type: 'click', selector: 'div[data-link="warpinator"] [data-wrp-action="prefs"]' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'textContains', selector: 'div[data-link="warpinator"] .wrp-app__drop-hint', text: 'Préférences' },
    ],
  },
  'wam-open-list': {
    prep: ['webapp_manager'],
    assertions: [
      { type: 'selectorVisible', selector: 'div[data-link="webapp_manager"] #webappManagerApp' },
      { type: 'childCountMin', selector: 'div[data-link="webapp_manager"] #wam-list', min: 1 },
      { type: 'evaluateTruthy', fn: 'wave2WebappManagerInit' },
    ],
  },
  'wam-select-app': {
    prep: ['webapp_manager'],
    assertions: [
      { type: 'textContains', selector: 'div[data-link="webapp_manager"] .wam-app__detail-title', text: 'Matrix' },
    ],
  },
  'wam-create-webapp': {
    prep: ['webapp_manager'],
    actions: [
      { type: 'click', selector: 'div[data-link="webapp_manager"] [data-wam-action="create"]' },
      { type: 'wait', ms: 80 },
    ],
    assertions: [
      { type: 'textContains', selector: 'div[data-link="webapp_manager"] #wam-status', text: 'création' },
    ],
  },
};

export const applyWave2Plan = (scenario, plan) => {
  const def = WAVE2_PLANS[scenario.id];
  if (!def) {
    return false;
  }
  if (def.prep && def.prep.length > 0) {
    plan.prepActions = def.prep.map((slot) => ({ type: 'wave2Init', slot }));
  }
  if (def.actions) {
    def.actions.forEach((a) => {
      plan.actions.push(a);
    });
  }
  if (def.assertions) {
    def.assertions.forEach((a) => {
      plan.assertions.push(a);
    });
  }
  return true;
};

export const runWave2PrepAction = async (page, action) => {
  if (action.type === 'wave2Init') {
    const fnName = INIT_BY_SLOT[action.slot];
    if (!fnName) {
      return false;
    }
    await page.evaluate((name) => {
      if (typeof window[name] === 'function') {
        window[name]();
      }
    }, fnName);
    return true;
  }
  if (action.type === 'wave2Key') {
    await page.evaluate(({ slot, target, key }) => {
      const scope = document.querySelector('div[data-link="' + slot + '"]');
      const el = scope ? scope.querySelector(target) : null;
      if (el) {
        el.focus();
        el.dispatchEvent(new KeyboardEvent('keydown', { key: key, bubbles: true, cancelable: true }));
      }
    }, { slot: action.slot, target: action.target, key: action.key });
    return true;
  }
  if (action.type === 'selectOption') {
    await page.selectOption(action.selector, action.value);
    return true;
  }
  if (action.type === 'wave2LdrClickCanvas') {
    await page.evaluate(() => {
      const canvas = document.querySelector('div[data-link="libreoffice_draw"] #ldr-canvas');
      if (canvas) {
        canvas.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      }
    });
    return true;
  }
  if (action.type === 'wave2PwrSelectBar') {
    await page.evaluate((index) => {
      const bars = document.querySelectorAll('div[data-link="power_stats"] .pwr-app__bar');
      const bar = bars[index - 1];
      if (bar) {
        bar.click();
      }
    }, action.index || 1);
    return true;
  }
  if (action.type === 'wave2MbkBrowseSource') {
    await page.evaluate(() => {
      if (typeof window.initMintbackupApp === 'function') {
        window.initMintbackupApp();
      }
      const btn = document.querySelector('div[data-link="mintbackup"] [data-mbk-action="browse-source"]');
      if (btn) {
        btn.click();
      }
    });
    return true;
  }
  return false;
};

export const evaluateWave2Truthy = (fn) => {
  if (fn === 'wave2BaobabInit') {
    const app = document.getElementById('gnomeBaobabApp');
    return !!(app && app.dataset.baobabInit === 'true');
  }
  if (fn === 'wave2BulkyInit') {
    const app = document.getElementById('bulkyApp');
    return !!(app && app.dataset.bulkyInit === 'true');
  }
  if (fn === 'wave2FontViewerInit') {
    const app = document.getElementById('fontViewerApp');
    return !!(app && app.dataset.fontViewerInit === 'true');
  }
  if (fn === 'wave2GnomeDisksInit') {
    const app = document.getElementById('gnomeDisksApp');
    return !!(app && app.dataset.gnomeDisksInit === 'true');
  }
  if (fn === 'wave2GucharmapInit') {
    const app = document.getElementById('gucharmapApp');
    return !!(app && app.dataset.gucharmapInit === 'true');
  }
  if (fn === 'wave2GucharmapGridReady') {
    const cells = document.querySelectorAll('div[data-link="gucharmap"] #gcm-grid .gcm-app__cell');
    return cells.length >= 20;
  }
  if (fn === 'wave2GucharmapSearchVisible') {
    const cells = document.querySelectorAll('div[data-link="gucharmap"] #gcm-grid .gcm-app__cell:not([hidden])');
    return cells.length > 0 && cells.length < 70;
  }
  if (fn === 'wave2MateColorSwatchesReady') {
    const sw = document.querySelectorAll('div[data-link="mate_color_select"] #mcs-swatches .mcs-app__swatch');
    return sw.length >= 4;
  }
  if (fn === 'wave2PowerStatsBarsReady') {
    const bars = document.querySelectorAll('div[data-link="power_stats"] .pwr-app__bar');
    return bars.length >= 3;
  }
  if (fn === 'wave2MintstickIsoSelected') {
    const input = document.querySelector('div[data-link="mintstick"] #mstk-iso');
    return !!(input && input.value && input.value.indexOf('.iso') >= 0);
  }
  if (fn === 'wave2HypnotixInit') {
    const app = document.getElementById('hypnotixApp');
    return !!(app && app.dataset.hypnotixInit === 'true');
  }
  if (fn === 'wave2LibreofficeDrawInit') {
    const app = document.getElementById('libreofficeDrawApp');
    return !!(app && app.dataset.libreofficeDrawInit === 'true');
  }
  if (fn === 'wave2LdrShapeReady') {
    return !!document.querySelector('div[data-link="libreoffice_draw"] .ldr-app__shape');
  }
  if (fn === 'wave2PwrBarSelected') {
    return !!document.querySelector('div[data-link="power_stats"] .pwr-app__bar.is-selected');
  }
  if (fn === 'wave2LibreofficeImpressInit') {
    const app = document.getElementById('libreofficeImpressApp');
    return !!(app && app.dataset.libreofficeImpressInit === 'true');
  }
  if (fn === 'wave2LimSlidesReady') {
    const slides = document.querySelectorAll('div[data-link="libreoffice_impress"] .lim-app__slide');
    return slides.length >= 2;
  }
  if (fn === 'wave2MateColorSelectInit') {
    const app = document.getElementById('mateColorSelectApp');
    return !!(app && app.dataset.mateColorSelectInit === 'true');
  }
  if (fn === 'wave2MintbackupInit') {
    const app = document.getElementById('mintbackupApp');
    return !!(app && app.dataset.mintbackupInit === 'true');
  }
  if (fn === 'wave2MintstickInit') {
    const app = document.getElementById('mintstickApp');
    return !!(app && app.dataset.mintstickInit === 'true');
  }
  if (fn === 'wave2MintstickWriteReady') {
    const btn = document.querySelector('div[data-link="mintstick"] [data-mstk-action="write"]');
    return !!(btn && !btn.disabled);
  }
  if (fn === 'wave2MintstickFormatInit') {
    const app = document.getElementById('mintstickFormatApp');
    return !!(app && app.dataset.mintstickFormatInit === 'true');
  }
  if (fn === 'wave2MintstickFormatReady') {
    const btn = document.querySelector('div[data-link="mintstick_format"] [data-mstk-fmt-action="format"]');
    return !!(btn && !btn.disabled);
  }
  if (fn === 'wave2MintwelcomeInit') {
    const app = document.getElementById('mintwelcomeApp');
    return !!(app && app.dataset.mintwelcomeInit === 'true');
  }
  if (fn === 'wave2PowerStatsInit') {
    const app = document.getElementById('powerStatsApp');
    return !!(app && app.dataset.powerStatsInit === 'true');
  }
  if (fn === 'wave2RhythmboxInit') {
    const app = document.getElementById('rhythmboxApp');
    return !!(app && app.dataset.rhythmboxInit === 'true');
  }
  if (fn === 'wave2SimpleScanInit') {
    const app = document.getElementById('simpleScanApp');
    return !!(app && app.dataset.simpleScanInit === 'true');
  }
  if (fn === 'wave2SimpleScanSaveReady') {
    const btn = document.querySelector('div[data-link="simple_scan"] [data-scn-action="save"]');
    return !!(btn && !btn.disabled);
  }
  if (fn === 'wave2ThingyInit') {
    const app = document.getElementById('thingyApp');
    return !!(app && app.dataset.thingyInit === 'true');
  }
  if (fn === 'wave2ThunderbirdInit') {
    const app = document.getElementById('thunderbirdApp');
    return !!(app && app.dataset.thunderbirdInit === 'true');
  }
  if (fn === 'wave2TimeshiftInit') {
    const app = document.getElementById('timeshiftApp');
    return !!(app && app.dataset.timeshiftInit === 'true');
  }
  if (fn === 'wave2TransmissionInit') {
    const app = document.getElementById('transmissionApp');
    return !!(app && app.dataset.transmissionInit === 'true');
  }
  if (fn === 'wave2WarpinatorInit') {
    const app = document.getElementById('warpinatorApp');
    return !!(app && app.dataset.warpinatorInit === 'true');
  }
  if (fn === 'wave2WebappManagerInit') {
    const app = document.getElementById('webappManagerApp');
    return !!(app && app.dataset.webappManagerInit === 'true');
  }
  return null;
};

export const WAVE2_SCENARIO_IDS = Object.keys(WAVE2_PLANS);

export { scopeSel, INIT_BY_SLOT, WAVE2_PLANS };
