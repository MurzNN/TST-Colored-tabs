/*
Store the currently selected settings using browser.storage.sync.
*/

function settingsSave(e) {

  settingsCurrent = {
    saturation: document.querySelector("#saturation").value,
    lightness: document.querySelector("#lightness").value,
    colors: document.querySelector("#colors").value,

    activeSaturate: document.querySelector("#active-saturate").value,
    activeBrightness: document.querySelector("#active-brightness").value,
    activeBold: document.querySelector("#active-bold").checked,

    hoverSaturate: document.querySelector("#hover-saturate").value,
    hoverBrightness: document.querySelector("#hover-brightness").value,
  };

  settingsCurrent.hosts = [];
  document.querySelectorAll("table.hosts tbody tr").forEach(function(hostsItem) {
    settingsCurrent.hosts.push({
      host: hostsItem.querySelector("input[name='host[]']").value,
      regexp: hostsItem.querySelector("input[name='regexp[]']").checked ? true : false,
      color: hostsItem.querySelector("input[name='color[]']").value,
      disabled: hostsItem.querySelector("input[name='disabled[]']").checked ? true : false,
    });
  });
  browser.storage.sync.clear().then(function() {
    browser.storage.sync.set(settingsCurrent).then(function() {
      ColoredTabs.init();
    }, onError);
  });
  e.preventDefault();
}

function settingsReset(e) {
  let settings = DEFAULT_SETTINGS;
  settingsFormFill(settings);
  e.preventDefault();
}

/*
Update the options UI with the settings values retrieved from storage,
or the default settings if the stored settings are empty.
*/
function settingsFormFill(settings) {

  // console.log(settings);

  document.querySelector("#saturation").value = settings.saturation || "";
  document.querySelector("#lightness").value = settings.lightness || "";
  document.querySelector("#colors").value = settings.colors || "";

  document.querySelector("#active-saturate").value = settings.activeSaturate || "";
  document.querySelector("#active-brightness").value = settings.activeBrightness || "";
  document.querySelector("#active-bold").checked = settings.activeBold || "";

  document.querySelector("#hover-saturate").value = settings.hoverSaturate || "";
  document.querySelector("#hover-brightness").value = settings.hoverBrightness || "";


  document.querySelector("table.hosts tbody").innerHTML = '';

  if(settings.hosts) {
    settings.hosts.forEach(function(hostsItem) {
      hostsAdd(null, hostsItem);
    });
  } else {
    hostsAdd(null, {});
  }

  // const hostsTemplate = document.querySelector("template.host-item table tbody tr");
}

function hostsAdd(hostsItemPrev = null, data = {}) {
  const hostsTemplate = Sanitizer.createSafeHTML(document.querySelector("template").innerHTML);
  // console.log(hostsTemplate);

// hostsItem.className = "row";
// box.setAttribute("draggable", true);
  let hostsItem = document.createElement('tr');
  hostsItem.insertAdjacentHTML('beforeend', Sanitizer.unwrapSafeHTML(hostsTemplate));
  hostsItem.querySelector("input[name='host[]']").value = data.host || '';
  hostsItem.querySelector("input[name='regexp[]']").checked = data.regexp || false;
  hostsItem.querySelector("input[name='color[]']").value = data.color || '#00ff00';
  hostsItem.querySelector("input[name='disabled[]']").checked = data.disabled ? true : false;

  // hostsItem = hostsTemplate.cloneNode(true);
  // console.log(hostsItem)
  // // hostsItem = document.createElement('tr');
  // // hostsItem.innerHTML = '<td>xxxx2 sda</td>';
  // document.querySelector("table.hosts tbody").appendChild(hostsTemplate);
  document.querySelector("table.hosts tbody").appendChild(hostsItem);

  if (hostsItemPrev) {
    hostsItemPrev.parentNode.insertBefore(hostsItem, hostsItemPrev.nextSibling);
  }
  else {
    document.querySelector("table.hosts tbody").appendChild(hostsItem);
  }
}

function onError(e) {
  console.error(e);
}

/*
On opening the options page, fetch stored settings and update the UI with them.
*/
// settingsReset();
// let settingsStored = ColoredTabs.settingsLoad();
// settingsFormFill(settingsStored);

browser.storage.sync.get().then(function(settingsSaved) {
  settings = {}
  Object.assign(settings, DEFAULT_SETTINGS, settingsSaved);
  settingsFormFill(settings);
});

/*
On submit, save the currently selected settings.
*/
document.querySelector("#save-button").addEventListener("click", settingsSave);

document.querySelector("#reset-button").addEventListener("click", settingsReset);

document.querySelector("table.hosts").addEventListener("click", (e) => {
  if (e.target.className == "browser-style add-button") {
    hostsAdd(e.target.parentNode.parentNode);
	}	else if (e.target.className == "browser-style del-button") {
    e.target.parentNode.parentNode.remove();
    if (document.querySelectorAll("table.hosts tbody tr").length == 0) {
      hostsAdd();
    }
  }
});
