/*
Store the currently selected settings using browser.storage.sync.
*/

function storeSettings() {
  browser.storage.sync.set({
    saturation: document.querySelector("#saturation").value,
    lightness: document.querySelector("#lightness").value,
    colors: document.querySelector("#colors").value,
    active: {
      saturation: document.querySelector("#active-saturation").value,
      lightness: document.querySelector("#active-lightness").value,
      bold: document.querySelector("#active-bold").checked,
    },
    hover: {
      saturation: document.querySelector("#hover-saturation").value,
      lightness: document.querySelector("#hover-lightness").value,
    },
  });
  ColoredTabs.init();
}

function resetSettings() {
  let settings = DEFAULT_SETTINGS;
  updateUI(settings);
  ColoredTabs.init();
}

/*
Update the options UI with the settings values retrieved from storage,
or the default settings if the stored settings are empty.
*/
function updateUI(storedSettings) {
  document.querySelector("#saturation").value = storedSettings.saturation || "";
  document.querySelector("#lightness").value = storedSettings.lightness || "";
  document.querySelector("#colors").value = storedSettings.colors || "";
  
  document.querySelector("#active-saturation").value = storedSettings.active.saturation || "";
  document.querySelector("#active-lightness").value = storedSettings.active.lightness || "";
  document.querySelector("#active-bold").checked = storedSettings.active.bold || "";
  
  document.querySelector("#hover-saturation").value = storedSettings.hover.saturation || "";
  document.querySelector("#hover-lightness").value = storedSettings.hover.lightness || "";
}

function onError(e) {
  console.error(e);
}

/*
On opening the options page, fetch stored settings and update the UI with them.
*/
const gettingStoredSettings = browser.storage.sync.get(DEFAULT_SETTINGS);
gettingStoredSettings.then(updateUI, onError);

/*
On submit, save the currently selected settings.
*/
document.querySelector("#save-button").addEventListener("click", storeSettings);
document.querySelector("#reset-button").addEventListener("click", resetSettings);
