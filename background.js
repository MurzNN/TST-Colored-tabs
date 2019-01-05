"use strict";

const TST_ID = "treestyletab@piro.sakura.ne.jp";

const DEFAULT_SETTINGS = {
  saturation: 60,
  lightness: 70,
  css: '',
  active: {
    saturation: 60,
    lightness: 60,
    css: 'font-weight: bold;',
  },
  hover: {
    saturation: 60,
    lightness: 65,
    css: '',
  },
};

var ColoredTabs = {
    init() {
      ColoredTabs.state.inited = true;
      browser.storage.sync.get(DEFAULT_SETTINGS).then(function(settings) {
        ColoredTabs.settings = settings;
        ColoredTabs.state.hashUsed = [];
        ColoredTabs.colorizeAllTabs();
        browser.tabs.onUpdated.addListener(ColoredTabs.checkTabChanges);
        browser.tabs.onCreated.addListener(ColoredTabs.handleCreated);
      });
    },
    
    handleCreated(tab) {
      console.log("tab url " + tab.url);
      if(tab.url.indexOf('about:') === 0)
        return;
      let host = new URL(tab.url);
      host = host.hostname.toString();
      ColoredTabs.colorizeTab(tab.id, host);
    },
    
    checkTabChanges(tabId, changeInfo, tab) {
      if(typeof changeInfo.url === 'undefined') {
       return;
      }
      let host = new URL(tab.url);
      host = host.hostname.toString();
      ColoredTabs.colorizeTab(tabId, host);
    },
    
    colorizeAllTabs() {
      ColoredTabs.state.css = '';
      if(ColoredTabs.settings.active.css !== '') {
        ColoredTabs.state.css = ColoredTabs.state.css + `
        .tab.active {
        ` + ColoredTabs.settings.active.css + `
        }
        `;
      }
      if(ColoredTabs.settings.hover.css !== '') {
        ColoredTabs.state.css = ColoredTabs.state.css + `
        .tab:hover {
        ` + ColoredTabs.settings.hover.css + `
        }
        `;
      }
      browser.runtime.sendMessage(TST_ID, {
          type: "register-self",
          style: ColoredTabs.state.css,
      });
      
      browser.tabs.query({}).then(function(tabs){
        for (let tab of tabs) {
          let host = new URL(tab.url);
          host = host.hostname.toString();
          console.log('colorize tab id ' + tab.id + ' host ' + host);
          ColoredTabs.colorizeTab(tab.id, host);
        }
      }, onError);
      console.log('colorizeAllTabs() fin');
    },
    
    colorizeTab(tabId, host, oldHost = null) {
      console.log("colorizeTab tabId " + tabId + ", host " + host);
      let hash = ColoredTabs.hash(host) % 360;
      
      if(typeof ColoredTabs.state.tabHash[tabId] !== 'undefined') {
        browser.runtime.sendMessage(TST_ID, {
          type:  'remove-tab-state',
          tabs:  [tabId],
          state: 'coloredTabs' + ColoredTabs.state.tabHash[tabId],
        });
      }
      
      if(typeof ColoredTabs.state.hashUsed[hash] === 'undefined') {
      
        ColoredTabs.state.hashUsed[hash] = true;
        let hashColor = 'hsl(' + hash + ',' + ColoredTabs.settings.saturation + '%,' + ColoredTabs.settings.lightness + '%)';
        let hashColorHover = 'hsl(' + hash + ',' + ColoredTabs.settings.hover.saturation + '%,' + ColoredTabs.settings.hover.lightness + '%)';
        let hashColorActive = 'hsl(' + hash + ',' + ColoredTabs.settings.active.saturation + '%,' + ColoredTabs.settings.active.lightness + '%)';
        
        ColoredTabs.state.css = ColoredTabs.state.css + `
          .tab.coloredTabs` + hash + ` {
            background-color: ` + hashColor + `;
          }
          .tab.coloredTabs` + hash + `:hover {
            background-color: ` + hashColorHover + `;
          }
          .tab.coloredTabs` + hash + `.active {
            background-color: ` + hashColorActive + `;
          }
          `;

        browser.runtime.sendMessage(TST_ID, {
          type: "register-self",
          style: ColoredTabs.state.css,
        });
      }
      
      browser.runtime.sendMessage(TST_ID, {
        type:  'add-tab-state',
        tabs:  [tabId],
        state: 'coloredTabs' + hash,
      });
      ColoredTabs.state.tabHash[tabId] = hash;
    },
    
    hash(s) {
      for(var i=0, h=1; i<s.length; i++)
        h=Math.imul(h+s.charCodeAt(i)|0, 2654435761);
      return (h^h>>>17)>>>0;
    },
    
    state: {
      'hashUsed': {},
      'tabHash': {},
      'inited': false,
    },
}

function onError(error) {
  console.log(`Error: ${error}`);
}

async function registerToTST() {
    try {
      const self = await browser.management.getSelf();
      await browser.runtime.sendMessage(TST_ID, {
        type: "register-self",
        name: self.id,
        listeningTypes: ["ready", "sidebar-hide", "sidebar-show"],
      });
    } catch(e) {
      // Could not register
      console.log("Tree Style Tab extension needed for TST Colored Tabs, but can't be detected. Please install or enable it.")
      return false;
    }

    return true;
}

async function handleTSTMessage(message, sender) {
    if(sender.id !== TST_ID) {
        return;
    }
    
    switch (message.type) {
        case "ready":
          registerToTST();
        case "sidebar-show":
          if(ColoredTabs.state.inited != true) {
            console.log('TST ready, initializing ColoredTabs');
            ColoredTabs.init();
          } else {
            console.log('ColoredTabs already inited');
            ColoredTabs.colorizeAllTabs();
          }
          break;
    }
}

registerToTST();
browser.runtime.onMessageExternal.addListener(handleTSTMessage);
