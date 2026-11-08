/* app.js - used by every page. Navbar, footer, cards and checkboxes are written in the HTML, this only makes things happen */


/* Helpers */

function findOne(selector, parent = document) {
    return parent.querySelector(selector);
}

function findAll(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
}

// body data-page: home, scenes, scene, characters or character
const page = document.body.dataset.page;


/* Links that go nowhere */

function showToast(message) {
    findOne("#toastText").textContent = message;
    bootstrap.Toast.getOrCreateInstance(findOne("#linkToast")).show();
}

// links with data-goes show where they would go
for (const link of findAll("a[data-goes]")) {
    link.onclick = function (event) {
        event.preventDefault();
        showToast("This would go to " + link.dataset.goes + ".");

        // close the phone menu so the message can be seen
        const menu = bootstrap.Offcanvas.getInstance(findOne("#menu"));
        if (menu) menu.hide();
    };
}


/* Spoilers */

// saved in the browser as "on" or "off", blocked unless it says "off"
function spoilersAreBlocked() {
    return localStorage.getItem("blockSpoilers") !== "off";
}

// clicking blocked text reveals it
function makeRevealable(element) {
    element.onclick = function () {
        if (element.classList.contains("spoiler-on")) {
            element.classList.add("revealed");
        }
    };
}

// blocks or unblocks everything marked data-spoil
function refreshSpoilers() {
    const blocked = spoilersAreBlocked();

    for (const element of findAll("[data-spoil]")) {
        makeRevealable(element);
        element.classList.remove("revealed");
        element.classList.toggle("spoiler-on", blocked);
    }
}

const spoilerSwitch = findOne("#spoilerSwitch");
const spoilerSwitchText = findOne("#spoilerSwitchState");

function showSwitchState() {
    spoilerSwitch.checked = spoilersAreBlocked();
    spoilerSwitchText.textContent = spoilerSwitch.checked ? "BLOCKED" : "UNBLOCKED";
}

// flipping the switch saves it and updates the page
spoilerSwitch.onchange = function () {
    localStorage.setItem("blockSpoilers", spoilerSwitch.checked ? "on" : "off");
    showSwitchState();
    refreshSpoilers();
};

// when the modal opens, show the saved choice and cover the sample again
findOne("#spoilerModal").addEventListener("show.bs.modal", function () {
    showSwitchState();
    findOne("#spoilerSample").classList.remove("revealed");
});

// the modal sits above other modals (like Compare), so raise its backdrop too
findOne("#spoilerModal").addEventListener("shown.bs.modal", function () {
    const backdrops = findAll(".modal-backdrop");
    backdrops[backdrops.length - 1].style.zIndex = 1085;
});

makeRevealable(findOne("#spoilerSample"));
refreshSpoilers();


/* Scenes page */

if (page === "scenes") {
    const grid = findOne("#grid");
    const cards = findAll(".scene", grid);
    const checkboxes = findAll("#areaFilters input");
    const sortBox = findOne("#sort");
    const clearButton = findOne("#clearFilters");

    function updateScenes() {
        // ticked areas (none ticked shows everything)
        const ticked = [];
        for (const box of checkboxes) {
            if (box.checked) ticked.push(box.value);
        }
        clearButton.disabled = (ticked.length === 0);
        findOne("#resultsFor").textContent = (ticked.length === 0) ? "All areas" : ticked.join(", ");

        // sort A-Z or Z-A
        const direction = (sortBox.value === "za") ? -1 : 1;
        cards.sort(function (a, b) {
            return a.dataset.name.localeCompare(b.dataset.name) * direction;
        });

        // put the cards back in order and hide the ones not in a ticked area
        let shown = 0;
        for (const card of cards) {
            grid.append(card);
            const show = (ticked.length === 0) || ticked.includes(card.dataset.area);
            card.hidden = !show;
            if (show) shown++;
        }
        findOne("#noScenes").hidden = (shown > 0);
    }

    for (const box of checkboxes) {
        box.onchange = updateScenes;
    }
    sortBox.onchange = updateScenes;

    clearButton.onclick = function () {
        for (const box of checkboxes) box.checked = false;
        updateScenes();
    };

    updateScenes();
}


/* Characters page */

if (page === "characters") {
    const list = findOne("#list");
    const rows = findAll(".char-row", list);
    const searchBox = findOne("#search");
    const sortBox = findOne("#sort");
    const clearButton = findOne("#clearSearch");

    function updateCharacters() {
        const searchText = searchBox.value.trim().toLowerCase();

        // the x only shows when there is text
        clearButton.hidden = (searchBox.value === "");

        const direction = (sortBox.value === "za") ? -1 : 1;
        rows.sort(function (a, b) {
            return a.dataset.name.localeCompare(b.dataset.name) * direction;
        });

        let shown = 0;
        for (const row of rows) {
            list.append(row);
            const matches = row.dataset.name.toLowerCase().includes(searchText);
            row.hidden = !matches;
            if (matches) shown++;
        }
        findOne("#noCharacters").hidden = (shown > 0);
    }

    function clearSearch() {
        searchBox.value = "";
        updateCharacters();
    }

    searchBox.oninput = updateCharacters;
    sortBox.onchange = updateCharacters;
    clearButton.onclick = clearSearch;

    updateCharacters();
}


/* Scene page: copy hex codes */

if (page === "scene") {
    for (const swatch of findAll(".swatch")) {
        swatch.onclick = function () {
            const hexCode = swatch.dataset.hex;

            // put the code in the hidden box, select it and copy it
            const copyBox = findOne("#copyBox");
            copyBox.value = hexCode;
            copyBox.select();
            const worked = document.execCommand("copy");

            if (worked) {
                showToast("Copied " + hexCode + " to your clipboard.");
            } else {
                showToast("Could not copy. The code is " + hexCode + ".");
            }
        };
    }
}


/* Character page: gallery lightbox */

if (page === "character") {
    const lightbox = findOne("#lightbox");
    const carouselElement = findOne("#lightboxCarousel");
    const slides = findAll(".carousel-item", carouselElement);

    bootstrap.Carousel.getOrCreateInstance(carouselElement, {
        interval: false,
        wrap: true
    });

    // show the image that was clicked (each gallery button has data-index 0 to 3)
    lightbox.addEventListener("show.bs.modal", function (event) {
        const clickedIndex = Number(event.relatedTarget.dataset.index);
        slides.forEach(function (slide, index) {
            slide.classList.toggle("active", index === clickedIndex);
        });
    });
}
