"use strict";

const TST_ID = "treestyletab@piro.sakura.ne.jp";

const DEFAULT_SETTINGS = {
  saturation: 60,
  lightness: 70,
  colors: 15,
  active: {
    saturation: 60,
    lightness: 60,
    bold: true,
  },
  hover: {
    saturation: 60,
    lightness: 65,
  },
};

var ColoredTabs = {
    init() {
      browser.storage.sync.get(DEFAULT_SETTINGS).then(function(settings) {
//         console.log('init settings');
        ColoredTabs.settings = settings;
        ColoredTabs.colorizeAllTabs();
        browser.tabs.onUpdated.addListener(ColoredTabs.checkTabChanges);
        browser.tabs.onCreated.addListener(ColoredTabs.handleCreated);
        ColoredTabs.state.inited = true;
//         console.log('init settings fin');
      });
    },
    
    handleCreated(tab) {
//       console.log("tab url " + tab.url);
      if(tab.url.indexOf('about:') === 0)
        return;
      let host = new URL(tab.url);
      host = host.hostname.toString();
      ColoredTabs.colorizeTab(tab.id, host);
    },
    
    checkTabChanges(tabId, changeInfo, tab) {
      if(typeof changeInfo.url === 'undefined' || tab.url.indexOf('about:') === 0)
        return;
      let host = new URL(tab.url);
      host = host.hostname.toString();
      ColoredTabs.colorizeTab(tabId, host);
    },
    
    colorizeAllTabs() {
//       console.log('colorizeAllTabs() start');
      let css = '';
      if(ColoredTabs.settings.active.bold == true) {
        css += '.tab.active .label{font-weight:bold}';
      }
      for(let i = 0; i < 360; i += (360 / ColoredTabs.settings.colors)) {
        let hue = Math.round(i);
        css += `
.tab.coloredTabsHue` + hue + ` {background-color: hsl(` + hue + `,` + ColoredTabs.settings.saturation + `%,` + ColoredTabs.settings.lightness + `%);}
.tab.coloredTabsHue` + hue + `.active {background-color: hsl(` + hue + `,` + ColoredTabs.settings.active.saturation + `%,` + ColoredTabs.settings.active.lightness + `%);}
.tab.coloredTabsHue` + hue + `:hover {background-color: hsl(` + hue + `,` + ColoredTabs.settings.hover.saturation + `%,` + ColoredTabs.settings.hover.lightness + `%);}`;
      }
//       console.log(css);
     
      browser.runtime.sendMessage(TST_ID, {
          type: "register-self",
          style: css,
      });
      
      browser.tabs.query({}).then(function(tabs){
        for (let tab of tabs) {
          let host = new URL(tab.url);
          host = host.hostname.toString();
//           console.log('colorize tab id ' + tab.id + ' host ' + host);
          ColoredTabs.colorizeTab(tab.id, host);
        }
      }, onError);
    },
    
    colorizeTab(tabId, host) {
      let hue = Math.round((ColoredTabs.hash(host) % ColoredTabs.settings.colors) * (360 / ColoredTabs.settings.colors));
//       console.log("colorizeTab tabId " + tabId + ", host " + host + " hash " + ColoredTabs.hash(host) + " step " + (ColoredTabs.hash(host) % ColoredTabs.settings.colors) + " hue " + hue);
      
      if(ColoredTabs.state.tabHue[tabId] != hue) {
        browser.runtime.sendMessage(TST_ID, {
          type:  'add-tab-state',
          tabs:  [tabId],
          state: 'coloredTabsHue' + hue,
        });
        if(typeof ColoredTabs.state.tabHue[tabId] !== 'undefined') {
          browser.runtime.sendMessage(TST_ID, {
            type:  'remove-tab-state',
            tabs:  [tabId],
            state: 'coloredTabsHue' + ColoredTabs.state.tabHue[tabId],
          });
        }
        ColoredTabs.state.tabHue[tabId] = hue;
      }
    },
    
    hash(s) {
      for(var i=0, h=1; i<s.length; i++)
        h=Math.imul(h+s.charCodeAt(i)|0, 2654435761);
      return (h^h>>>17)>>>0;
    },
    
    state: {
      'tabHue': {},
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
//             console.log('TST ready, initializing ColoredTabs');
            ColoredTabs.init();
          } else {
//             console.log('ColoredTabs already inited');
            ColoredTabs.colorizeAllTabs();
          }
          break;
    }
}

registerToTST();
browser.runtime.onMessageExternal.addListener(handleTSTMessage);
