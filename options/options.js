"use strict";

// Load settings and setup listeners
(async () => {
    let settings = await browser.storage.local.get();
    applySettings(settings);

    for(let input of document.querySelectorAll("input")) {
        input.addEventListener("input", handleInputInput);
    }
})();

function applySettings(settings) {
    for(let key in settings) {
        let element = document.getElementById(key);
        if(element) {
            element.value = settings[key];
        }
    }
}

function handleInputInput(event) {
    let target = event.target;

    let value = target.value;
    if(target.type === "number") {
        value = parseInt(value);
    }

    browser.storage.local.set({
        [target.id]: value,
    });
}
