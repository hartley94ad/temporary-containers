class TmpStorage {
  constructor(background) {
    this.background = background;
    this.loaded = false;
    this.installed = false;
    this.local = null;
    this.preferencesDefault = {
      automaticMode: {
        active: false,
        newTab: 'created'
      },
      notifications: false,
      container: {
        namePrefix: 'tmp',
        color: 'toolbar',
        colorRandom: false,
        icon: 'circle',
        iconRandom: false,
        numberMode: 'keep',
        removal: '15minutes'
      },
      iconColor: 'default',
      isolation: {
        active: true,
        global: {
          navigation: {
            action: 'never'
          },
          mouseClick: {
            middle: {
              action: 'never',
              container: 'default'
            },
            ctrlleft: {
              action: 'never',
              container: 'default'
            },
            left: {
              action: 'never',
              container: 'default'
            }
          },
          excluded: {},
          excludedContainers: {}
        },
        domain: [],
        mac: {
          action: 'disabled',
        }
      },
      browserActionPopup: false,
      pageAction: false,
      contextMenu: true,
      contextMenuBookmarks: false,
      keyboardShortcuts: {
        AltC: true,
        AltP: true,
        AltN: false,
        AltShiftC: false,
        AltX: false
      },
      replaceTabs: false,
      closeRedirectorTabs: {
        active: false,
        delay: 2000,
        domains: ['t.co', 'outgoing.prod.mozaws.net']
      },
      ignoreRequests: ['getpocket.com', 'addons.mozilla.org'],
      cookies: {
        domain: {}
      },
      deletesHistory: {
        active: false,
        automaticMode: 'never',
        contextMenu: false,
        contextMenuBookmarks: false,
        containerAlwaysPerDomain: 'never',
        containerIsolation: 'never',
        containerRemoval: 'instant',
        containerMouseClicks: 'never',
        statistics: false
      },
      statistics: false,
      ui: {
        expandPreferences: false,
        popupDefaultTab: 'isolation-per-domain'
      },
    };

    this.storageDefault = {
      tempContainerCounter: 0,
      tempContainers: {},
      tempContainersNumbers: [],
      statistics: {
        startTime: new Date,
        containersDeleted: 0,
        cookiesDeleted: 0,
        cacheDeleted: 0,
        deletesHistory: {
          containersDeleted: 0,
          cookiesDeleted: 0,
          urlsDeleted: 0
        }
      },
      preferences: this.preferencesDefault,
      version: false
    };
  }

  async load() {
    this.local = await browser.storage.local.get();

    // empty storage *should* mean new install
    if (!this.local || !Object.keys(this.local).length) {
      return this.install();
    }
    debug('[load] storage loaded', this.local);
    if (this.addMissingStorageKeys()) {
      await this.persist();
    }
    this.loaded = true;
    return true;
  }

  async persist() {
    try {
      if (!this.local || !Object.keys(this.local).length) {
        debug('[persist] tried to persist corrupt storage', this.local);
        return false;
      }
      await browser.storage.local.set(this.local);
      debug('[persist] storage persisted');
      return true;
    } catch (error) {
      debug('[persist] something went wrong while trying to persist the storage', error);
      return false;
    }
  }

  async install() {
    debug('[install] initializing storage');
    this.local = JSON.parse(JSON.stringify(this.storageDefault));
    this.local.version = this.background.version;

    if (this.background.browserVersion < 67) {
      this.local.preferences.container.color = 'red';
    }

    if (!await this.persist()) {
      debug('[install] something went wrong while initializing storage');
      return false;
    }
    debug('[install] storage initialized', this.local);
    this.installed = true;
    return true;
  }

  async addMissingStorageKeys() {
    let storagePersistNeeded = false;
    const checkStorage = (storageDefault, storage) => {
      Object.keys(storageDefault).map(key => {
        if (storage[key] === undefined) {
          debug('[addMissingStorageKeys] storage key not found, setting default', key, storageDefault[key]);
          storage[key] = storageDefault[key];
          storagePersistNeeded = true;
        } else if (typeof storage[key] === 'object') {
          checkStorage(storageDefault[key], storage[key]);
        }
      });
    };
    checkStorage(this.storageDefault, this.local);

    return storagePersistNeeded;
  }
}

window.TmpStorage = TmpStorage;