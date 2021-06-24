"use strict";

const TST_ID = "treestyletab@piro.sakura.ne.jp";

const DEFAULT_SETTINGS = {
  saturation: 60,
  lightness: 70,
  colors: 15,
  activeSaturate: 120,
  activeBrightness: 120,
  activeBold: true,
  hoverSaturate: 110,
  hoverBrightness: 110,
  hosts: [
    { host: 'example.com', regexp: false, color: '#FF7700', disabled: true },
    { host: '.*\\.google\\..*', regexp: true, color: '#7171FF', disabled: true },
  ],
};

var ColoredTabs = {
  state: {
    'inited': false,
  },

  init() {
    browser.storage.sync.get().then(function(settingsStored) {
      ColoredTabs.settings = {}
      Object.assign(ColoredTabs.settings, DEFAULT_SETTINGS, settingsStored);

      ColoredTabs.state = {
        'tabsHost': [],
        'tabsClass': [],
        'inited': false,
      };
          // console.log(ColoredTabs.settings);

      if(ColoredTabs.settings.hosts) {
        ColoredTabs.settings.hosts.forEach(function(hostsItem) {
          if(hostsItem.disabled !== true && hostsItem.color.length > 3) {
            if(hostsItem.regexp == true) {
              if(ColoredTabs.state.hostsRegexp === undefined) {
                ColoredTabs.state.hostsRegexp = [];
                ColoredTabs.state.hostsRegexpColor = [];
              }
              ColoredTabs.state.hostsRegexp.push(hostsItem.host);
              ColoredTabs.state.hostsRegexpColor.push(hostsItem.color);
            } else {
              if(ColoredTabs.state.hostsMatch === undefined) {
                ColoredTabs.state.hostsMatch = [];
                ColoredTabs.state.hostsMatchColor = [];
              }
              ColoredTabs.state.hostsMatch.push(hostsItem.host);
              ColoredTabs.state.hostsMatchColor.push(hostsItem.color);
            }
          }
        });
      }

      ColoredTabs.colorizeAllTabs();
      browser.tabs.onUpdated.addListener(ColoredTabs.checkTabChanges);
      browser.tabs.onRemoved.addListener(ColoredTabs.removeTabInfo)
  //         browser.tabs.onCreated.addListener(ColoredTabs.handleCreated);

      // console.log(ColoredTabs.state);

      ColoredTabs.state.inited = true;
    });
  },

//     handleCreated(tab) {
//       console.log("handleCreated tab id " + tab.id + " tab url " + tab.url);
//       if(tab.url.indexOf('about:') === 0)
//         return;
//       let host = new URL(tab.url);
//       host = host.hostname.toString();
//       ColoredTabs.colorizeTab(tab.id, host);
//     },

  checkTabChanges(tabId, changeInfo, tab) {
//       console.log("checkTabChanges tab id " + tabId + " tab url " + tab.url);
//       console.log(changeInfo);
    if(typeof changeInfo.url === 'undefined' || tab.url.indexOf('about:') === 0)
      return;
    let host = new URL(changeInfo.url);
    host = host.hostname.toString();
    if(host != ColoredTabs.state.tabsHost[tabId]) {
      ColoredTabs.state.tabsHost[tabId] = host;
      ColoredTabs.colorizeTab(tabId, host);
    }
  },
  removeTabInfo(tabId, removeInfo) {
//       console.log("removeTabInfo tab id " + tabId);
    delete ColoredTabs.state.tabsHost[tabId];
    delete ColoredTabs.state.tabsClass[tabId];
  },
  colorizeAllTabs() {
//       console.log('colorizeAllTabs() start');
    let css = `
.tab.active {filter: saturate(` + ColoredTabs.settings.activeSaturate + `%) brightness(` + ColoredTabs.settings.activeBrightness + `%);}
.tab:hover {filter: saturate(` + ColoredTabs.settings.hoverSaturate + `%) brightness(` + ColoredTabs.settings.hoverBrightness + `%);}`;

    if(ColoredTabs.settings.activeBold == true) {
      css += '.tab.active .label{font-weight:bold}';
    }

    for(let i = 0; i < 360; i += (360 / ColoredTabs.settings.colors)) {
      let hue = Math.round(i);

      css += `
.tab.coloredTabsHue${hue} {
  --tst-color-tabs-bg-hue: ${hue};
  --tst-color-tabs-bg-saturation: ${ColoredTabs.settings.saturation}%;
  --tst-color-tabs-bg-lightness: ${ColoredTabs.settings.lightness}%;
  --tst-color-tabs-bg-color: hsl(
    var(--tst-colortabs-bg-hue), 
    var(--tst-color-tabs-bg-saturation),
    var(--tst-color-tabs-bg-lightness)
  );

  background-color: var(--tst-color-tabs-bg-color);
}`;
    }

    if(ColoredTabs.state.hostsMatchColor !== undefined) {
      ColoredTabs.state.hostsMatchColor.forEach((element, index) => css += `.tab.coloredTabsHostMatch` + index + ` {background-color: ` + element + `;}`);
    }
    if(ColoredTabs.state.hostsRegexpColor !== undefined) {
      ColoredTabs.state.hostsRegexpColor.forEach((element, index) => css += `.tab.coloredTabsHostRegexp` + index + ` {background-color: ` + element + `;}`);
    }
    // console.log(css);

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
    let tabClass = null;
    let index = null;
    if ((ColoredTabs.state.hostsMatch !== undefined) && (index = ColoredTabs.state.hostsMatch.indexOf(host) > -1)) {
      tabClass = 'coloredTabsHostMatch' + ColoredTabs.state.hostsMatch.indexOf(host);
    } else if (ColoredTabs.state.hostsRegexp !== undefined) {
      for (let i = 0; i < ColoredTabs.state.hostsRegexp.length; i++) {
        if(host.match(ColoredTabs.state.hostsRegexp[i])) {
          tabClass = 'coloredTabsHostRegexp' + i;
          break;
        }
      }
    }
    if(tabClass === null) {
      tabClass = 'coloredTabsHue' + Math.round((ColoredTabs.hash(host) % ColoredTabs.settings.colors) * (360 / ColoredTabs.settings.colors));
    }

    // console.log("colorizeTab tabId " + tabId + ", host " + host + " hash " + ColoredTabs.hash(host) + " step " + (ColoredTabs.hash(host) % ColoredTabs.settings.colors) + " tabClass " + tabClass);

    if(ColoredTabs.state.tabsClass[tabId] != tabClass) {
      browser.runtime.sendMessage(TST_ID, {
        type:  'add-tab-state',
        tabs:  [tabId],
        state: tabClass,
      });
      if(typeof ColoredTabs.state.tabsClass[tabId] !== undefined) {
        browser.runtime.sendMessage(TST_ID, {
          type:  'remove-tab-state',
          tabs:  [tabId],
          state: ColoredTabs.state.tabsClass[tabId],
        });
      }
      ColoredTabs.state.tabsClass[tabId] = tabClass;
    }
  },

  hash(s) {
    for(var i=0, h=1; i<s.length; i++)
      h=Math.imul(h+s.charCodeAt(i)|0, 2654435761);
    return (h^h>>>17)>>>0;
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
        listeningTypes: ["ready", "sidebar-show", "permissions-changed"],
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
//     console.log('handleTSTMessage ' + message.type);
//     console.log(message);

    switch (message.type) {
        case "ready":
          registerToTST();
          ColoredTabs.init();
        case "sidebar-show":
        case "permissions-changed":
          if(ColoredTabs.state.inited != true) {
//             console.log('TST ready, initializing ColoredTabs');
            ColoredTabs.init();
          } else {
//             console.log('ColoredTabs already inited, so call colorizeAllTabs');
            ColoredTabs.colorizeAllTabs();
          }
          break;
    }
}


registerToTST();
browser.runtime.onMessageExternal.addListener(handleTSTMessage);
