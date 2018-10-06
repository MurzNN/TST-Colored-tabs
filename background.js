"use strict";

const TST_ID = "treestyletab@piro.sakura.ne.jp";
const DEFAULT_SETTINGS = {
};

// The current settings
let settings;

// Load settings, setup listeners and register to TST
(async () => {
    settings = await browser.storage.local.get(DEFAULT_SETTINGS);
    await browser.storage.local.set(settings); // Save any missing defaults

    browser.storage.onChanged.addListener(handleSettingsChange);
    browser.runtime.onMessageExternal.addListener(handleTSTMessage);

    // Register directly in case we are activated after TST
    await registerToTST();
})();


async function handleSettingsChange(changes) {
    for(let key in changes) {
        let change = changes[key];
        if(change.newValue !== undefined) {
            settings[key] = change.newValue;
        }
    }
}

async function registerToTST() {
    try {
        const self = await browser.management.getSelf();
        await browser.runtime.sendMessage(TST_ID, {
            type: "register-self",
            name: self.id,
            listeningTypes: ["ready", "tab-mouseover", "tab-mouseout"],
              style: `
                .tab.style1 {
                  background-color: red !important;
                  border: 2px solid green !important;
                }
                .tab.style2 {
                  background-color: blue !important;
                  border: 5px solid yellow !important;
                }
              `
        });
    } catch(e) {
        // Could not register
        console.log("Could not register to TST")
        return false;
    }

    return true;
}

async function activateTab(tab) {
    try {
        await browser.runtime.sendMessage(TST_ID, {
            type: "focus",
            tab: tab
        });
    } catch(e) {
        // Happens when the tab is closed during the timeout
    }
}


let timer = null;
function startTimer(tab) {
    let callback = async () => {
        timer = null;
        await activateTab(tab);
    };
    timer = setTimeout(callback, settings["switching-delay"]);
}
function stopTimer() {
    if(timer !== null) {
        clearTimeout(timer);
        timer = null;
    }
}

async function handleTSTMessage(message, sender) {
    if(sender.id !== TST_ID) {
        return;
    }
// console.log(message.type);

    switch (message.type) {
        case "ready":
            registerToTST();
            
            browser.runtime.sendMessage(TST_ID, {
              type: 'register-self',
            });

            break;

        case "tab-mouseover":
//             stopTimer();
//           console.log('tab-mouseover: yeaa 214');

//             let tab = message.tab;
//             console.log(tab.url);
            console.log("tab-mouseover - URL: " + message.tab.url + " id " + message.tab.id);
              // define colors
            
//             browser.runtime.sendMessage(TST_ID, {
//               type: 'register-self',
//               style: `
//                 .tab.style1 {
//                   background-color: red !important;
//                   border: 2px solid green !important;
//                 }
//                 .tab.style2 {
//                   background-color: blue !important;
//                   border: 5px solid yellow !important;
//                 }
//               `
//             });
//         message.tab.style.background = 'yellow';
//         message.tab.style.background = 'linear-gradient(to left, #ff0000 0%, #00ff00  100%)'; 
//         getTabById(message.tab.id).style.background = 'green';
//         getTabById(message.tab.id).style.background = `linear-gradient(to left, #ff0000 0%, #00ff00  100%)`; 
if((message.tab.id % 2) == 1) {
  browser.runtime.sendMessage(TST_ID, {
    type:  'add-tab-state',
    tabs:  [message.tab.id],
    state: 'style1'
  });
} else {
  browser.runtime.sendMessage(TST_ID, {
    type:  'add-tab-state',
    tabs:  [message.tab.id],
    state: 'style2'
  });
}
//   browser.runtime.sendMessage(kTST_ID, {
//     type:  'add-tab-state',
//     tabs:  [tab.id],
//     state: 'style2'
//   });            
//             startTimer(tab.id);
            console.log("tab-mouseover - URL: " + message.tab.url + " id " + message.tab.id + " FIN");
            break;

    }
}
