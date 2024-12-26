let data = [];
let filteredData = [];
let selectedColors = new Set();
let selectedItems = new Set();
let currentSortField = 'ID';
let currentSortOrder = "asc"; // Default sort order
let currentlyOpenRow = null; // Track the currently open details row

function formatPriceIcelandic(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Load JSON data
async function loadData() {
    const response = await fetch("2425.json");
    data = await response.json();
    filteredData = [...data];

    initializeDoubleRangeSlider();
    populateColorDropdown();
    applyFilters();
}

// Initialize the double range slider
function initializeDoubleRangeSlider() {
    const minSlider = document.getElementById("minPrice");
    const maxSlider = document.getElementById("maxPrice");
    const priceRangeDisplay = document.getElementById("priceRangeDisplay");

    // Dynamically determine the min and max price
    const minPriceValue = Math.min(...data.map(item => item.PRICE));
    const maxPriceValue = Math.max(...data.map(item => item.PRICE));

    // Set the slider attributes dynamically
    minSlider.min = minPriceValue;
    minSlider.max = maxPriceValue;
    minSlider.value = minPriceValue;

    maxSlider.min = minPriceValue;
    maxSlider.max = maxPriceValue;
    maxSlider.value = maxPriceValue;

    // Update the displayed range
    updatePriceRangeDisplay(minPriceValue, maxPriceValue);

    minSlider.addEventListener("input", () => {
        if (parseInt(minSlider.value) >= parseInt(maxSlider.value)) {
            minSlider.value = maxSlider.value - 1;
        }
        updatePriceRangeDisplay(minSlider.value, maxSlider.value);
        applyFilters();
    });

    maxSlider.addEventListener("input", () => {
        if (parseInt(maxSlider.value) <= parseInt(minSlider.value)) {
            maxSlider.value = parseInt(minSlider.value) + 1;
        }
        updatePriceRangeDisplay(minSlider.value, maxSlider.value);
        applyFilters();
    });

    function updatePriceRangeDisplay(min, max) {
        priceRangeDisplay.textContent = `Verðbil: ${formatPriceIcelandic(min)} - ${formatPriceIcelandic(max)} kr.`;
    }
}

// Populate the color dropdown
function populateColorDropdown() {
    const dropdown = $("#colorDropdown");
    const allColors = new Set(data.flatMap(item => item.COLORS));

    dropdown.empty();
    allColors.forEach(color => {
        const label = $(`<label><input type="checkbox" value="${color}" checked> ${color}</label>`);
        label.find("input").on("change", applyFilters);
        dropdown.append(label);
        selectedColors.add(color);
    });
}

// Toggle the color dropdown
$("#toggleColorDropdown").on("click", () => {
    $("#colorDropdown").toggle();
});

// Apply filters and update the table
function applyFilters() {
    const minPriceValue = parseInt(document.getElementById("minPrice").value);
    const maxPriceValue = parseInt(document.getElementById("maxPrice").value);

    selectedColors.clear();
    document.querySelectorAll("#colorDropdown input:checked").forEach(checkbox => {
        selectedColors.add(checkbox.value);
    });

    filteredData = data.filter(item =>
        item.PRICE >= minPriceValue &&
        item.PRICE <= maxPriceValue &&
        item.COLORS.some(color => selectedColors.has(color))
    );

    sortTable(currentSortField, false);
    renderTable(filteredData);
    renderCards(filteredData);
}

function applySearchFilter() {
    const query = document.getElementById("searchBox").value.toLowerCase();

    filteredData = data.filter(item => {
        // Check if the query matches any relevant fields
        return (
            item.NAME.toLowerCase().includes(query) ||
            item.DESCRIPTION.toLowerCase().includes(query) ||
            item.COLORS.some(color => color.toLowerCase().includes(query)) ||
            item.PRICE.toString().includes(query) ||
            formatPriceIcelandic(item.PRICE).toString().includes(query)||
            item.SHOTS.toString().includes(query) ||
            item.DURATION.toString().includes(query) ||
            item.WEIGHT?.toString().includes(query) // Optional chaining for null/undefined values
        );
    });

    renderTable(filteredData);
}

// Render the table
function renderTable(dataToRender) {
    const tbody = $("#dataBody");
    tbody.empty();

    if (!dataToRender.length) {
        tbody.append(`<tr><td colspan="14">No data available</td></tr>`);
        return;
    }

    dataToRender.forEach(item => {
        const row = $(` 
            <tr>
                <td><input type="checkbox" data-id="${item.ID}"></td>
                <td class="is-hidden-mobile">${item.ID}</td>
                <td class="name-cell">${item.NAME}</td>
                <td>${formatPriceIcelandic(item.PRICE)}</td>
                <td>${item.COLORS.join(", ")}</td>
                <td>${item.SHOTS}</td>
                <td>${item.DURATION}</td>
                <td>${item.NOISE}</td>
                <td>${item.VISUAL}</td>
                <td class="is-hidden-mobile">${item.WEIGHT || "N/A"}</td>
                <td class="is-hidden-mobile">${item.SECONDS_PER_SHOT.toFixed(2)}</td>
                <td class="is-hidden-mobile">${item.PRICE_PER_SHOT.toFixed(2)}</td>
                <td class="is-hidden-mobile">${item.PRICE_PER_SECOND.toFixed(2)}</td>
                <td class="is-hidden-mobile">${item.PRICE_PER_KG !== "#DIV/0!" ? item.PRICE_PER_KG.toFixed(2) : "N/A"}</td>
            </tr>
        `);

        const detailsRow = $(` 
            <tr class="details-row">
                <td colspan="14">
                    <div class="box">
                        <div class="columns">
                            <div class="column is-one-third">
                                <img src="${item['IMAGE URL']}" alt="Image not available" class="detail-image">
                            </div>
                            <div class="column">
                                <p class="content">${item.DESCRIPTION}</p>
                            </div>
                            <div class="column is-one-third">
                                <iframe src="${convertToEmbedURL(item['VIDEO URL'])}" allowfullscreen class="detail-video"></iframe>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        `);

        row.find(".name-cell").on("click", () => {
            if (currentlyOpenRow && currentlyOpenRow !== detailsRow) {
                currentlyOpenRow.hide();
            }
            detailsRow.toggle();
            currentlyOpenRow = detailsRow.is(":visible") ? detailsRow : null;
        });
        row.find("input[type='checkbox']").on("change", handleSelection);
        tbody.append(row, detailsRow);
    });

    updateCheckboxState(); // Check if the limit is reached
}

function renderCards(dataToRender) {
    const cardContainer = $("#cardView");
    cardContainer.empty();

    if (!dataToRender.length) {
        cardContainer.append(`<p>Engar vörur fundust.</p>`);
        return;
    }

    let currentlyOpenCard = null; // Track the currently open card

    dataToRender.forEach(item => {
        const card = $(`
            <div class="card">
                <div class="card-header">
                    <img src="${item['IMAGE URL']}" alt="Mynd ekki tiltæk" style="max-width: 30%;">
                    <h2 class="subtitle">${item.NAME}</h2>
                </div>
                <div class="card-content">
                    <div class="details-row">
                        <span><strong>Verð:</strong> ${formatPriceIcelandic(item.PRICE)}</span>
                        <span><strong>Skot:</strong> ${item.SHOTS}</span>
                        <span><strong>Lengd:</strong> ${item.DURATION}</span>
                    </div>
                    <p><strong>Litir:</strong> ${item.COLORS.join(", ")}</p>
                    <div class="card-details" style="display: none;">
                    <div class="details-row">
                        <span><strong>Hávaði:</strong> ${item.NOISE}</span>
                        <span><strong>Fegurð:</strong> ${item.VISUAL}</span>
                        <span><strong>Þyngd:</strong> ${item.WEIGHT}</span>
                    </div>
                    <div class="details-row">
                        <span><strong>sek/skot:</strong> ${item.SECONDS_PER_SHOT}</span>
                        <span><strong>kr/skot:</strong> ${item.PRICE_PER_SHOT}</span>
                    </div>
                    <div class="details-row">
                        <span><strong>kr/sek:</strong> ${item.PRICE_PER_SECOND}</span>
                        <span><strong>kr/kg:</strong> ${item.PRICE_PER_KG}</span>
                    </div>
                    <br>
                    <span>${item.DESCRIPTION}</span>
                    <iframe src="${convertToEmbedURL(item['VIDEO URL'])}" allowfullscreen class="card-video"></iframe>
                </div>
                </div>
                <div class="card-footer">
                    <button class="button is-small is-link expand-details">Sjá nánar</button>
                </div>
            </div>
        `);

        // Expand/Collapse functionality
        card.find(".expand-details").on("click", function () {
            const details = $(this).closest(".card").find(".card-details");
            const button = $(this); // Reference to the clicked button
        
            // If there's an open card and it's not the same as the current one, close it
            if (currentlyOpenCard && currentlyOpenCard[0] !== details[0]) {
                currentlyOpenCard.hide();
                // Reset the button text for the previously open card
                currentlyOpenCard.closest(".card").find(".expand-details").text("Sjá nánar");
            }
        
            // Toggle the current card's details
            details.toggle();
        
            // Update button text based on the visibility of the details
            if (details.is(":visible")) {
                button.text("Loka");
                currentlyOpenCard = details; // Update the currently open card tracker
            } else {
                button.text("Sjá nánar");
                currentlyOpenCard = null; // No card is open
            }
        });

        cardContainer.append(card);
    });
}

// Convert video URLs to embeddable format
function convertToEmbedURL(url) {
    if (url.includes("youtube.com")) {
        return url.replace("watch?v=", "embed/");
    }
    return url;
}

// Handle row selection for comparison
function handleSelection() {
    const id = $(this).data("id");
    if (this.checked) {
        selectedItems.add(id);
    } else {
        selectedItems.delete(id);
    }
    updateCheckboxState();
    updateCompareButton();
}

// Restrict selection to 4 items
function updateCheckboxState() {
    const checkboxes = $("#dataBody input[type='checkbox']");
    checkboxes.each(function () {
        if (selectedItems.size >= 4 && !$(this).is(":checked")) {
            $(this).prop("disabled", true);
        } else {
            $(this).prop("disabled", false);
        }
    });
}

// Update the visibility of the compare button
function updateCompareButton() {
    if (selectedItems.size >= 2 && selectedItems.size <= 4) {
        $("#compareButton").show();
    } else {
        $("#compareButton").hide();
    }
}

function renderComparisonModal() {
    const selectedItemsArray = Array.from(selectedItems).map(id =>
        data.find(item => item.ID === parseInt(id))
    );

    // Define attributes to display
    const attributeRows = [
        { label: "Verð", key: "PRICE" },
        { label: "Skot", key: "SHOTS" },
        { label: "Lengd(Sek)", key: "DURATION" },
        { label: "Hávaði", key: "NOISE" },
        { label: "Fegurð", key: "VISUAL" },
        { label: "Þyngd", key: "WEIGHT" },
        { label: "Sek/Skot", key: "SECONDS_PER_SHOT" },
        { label: "Verð/Skot", key: "PRICE_PER_SHOT" },
        { label: "Verð/Sek", key: "PRICE_PER_SECOND" },
        { label: "Verð/KG", key: "PRICE_PER_KG" },
        { label: "Litir", key: "COLORS" },
        { label: "Lýsing", key: "DESCRIPTION" },
    ];

    // Build the table rows
    const tableRows = attributeRows
        .map(attr => {
            const cells = selectedItemsArray
                .map(item => {
                    if (attr.key === "DESCRIPTION") {
                        // Limit description length
                        return `<td>${item[attr.key] ? item[attr.key].slice(0, 150) + (item[attr.key].length > 150 ? "..." : "") : "N/A"}</td>`;
                    } else if (Array.isArray(item[attr.key])) {
                        // Handle arrays (e.g., Colors)
                        return `<td>${item[attr.key].join(", ")}</td>`;
                    } else if (attr.key === "PRICE") {
                        // Handle arrays (e.g., Colors)
                        return `<td>${formatPriceIcelandic(item[attr.key])}</td>`;
                    }
                    return `<td>${item[attr.key] !== undefined ? item[attr.key] : "N/A"}</td>`;
                })
                .join("");
            return `<tr><th>${attr.label}</th>${cells}</tr>`;
        })
        .join("");

    // Build the header row with images and names
    const headerRow = `
        <tr>
            <th></th>
            ${selectedItemsArray
                .map(item => `
                    <th>
                        <figure class="image is-128x128" style="margin: 0 auto;">
                            <img src="${item['IMAGE URL']}" alt="${item.NAME}" class="detail-image">
                        </figure>
                        <p class="has-text-centered has-text-weight-bold">${item.NAME}</p>
                    </th>`)
                .join("")}
        </tr>
    `;

    // Combine the header and body
    const comparisonTable = `
        <table class="table" style="border: none;">
            <thead>${headerRow}</thead>
            <tbody>${tableRows}</tbody>
        </table>
    `;

    // Render the table in the modal
    $("#comparisonContent").html(comparisonTable);
    $("#compareModal").addClass("is-active");
    $("#compareButton").hide();
}

// Close the modal
$(".modal-close, .modal-background").on("click", () => {
    // Hide the comparison modal
    $("#compareModal").removeClass("is-active");

    // Hide the compare button

    // Clear all selected items and uncheck checkboxes
    selectedItems.clear();
    $("#dataBody input[type='checkbox']").prop("checked", false);

    // Re-enable all checkboxes
    $("#dataBody input[type='checkbox']").prop("disabled", false);
});

// Sort the table by a specific field
function sortTable(field, toggleOrder = true) {
    if (toggleOrder) {
        if (currentSortField === field) {
            currentSortOrder = currentSortOrder === "asc" ? "desc" : "asc";
        } else {
            currentSortField = field;
            currentSortOrder = "asc";
        }
    }

    // Perform the sort
    filteredData.sort((a, b) => {
        if (a[field] > b[field]) return currentSortOrder === "asc" ? 1 : -1;
        if (a[field] < b[field]) return currentSortOrder === "asc" ? -1 : 1;
        return 0;
    });

    updateSortIcons(field);
    renderTable(filteredData);
}

function updateSortIcons(activeField) {
    $(".sort-icon").each(function () {
        const field = $(this).data("field");
        if (field === activeField) {
            $(this).attr("data-active", "true");
            $(this).attr("data-order", currentSortOrder);

            // Update Font Awesome icon class
            if (currentSortOrder === "asc") {
                $(this).removeClass("fa-sort-numeric-up-alt").addClass("fa-sort-numeric-down");
            } else {
                $(this).removeClass("fa-sort-numeric-down").addClass("fa-sort-numeric-up-alt");
            }
        } else {
            $(this).attr("data-active", "false");
            $(this).removeClass("fa-sort-numeric-down fa-sort-numeric-up-alt");
        }
    });
}

$("#sortDropdown .dropdown-trigger").on("click", function () {
    $("#sortDropdown").toggleClass("is-active"); // Toggle the dropdown menu visibility
});

// Sort items when an option is clicked
$("#sortDropdown .dropdown-item").on("click", function (event) {
    event.preventDefault(); // Prevent default link behavior

    const sortField = $(this).data("sort"); // Get the field to sort by
    currentSortField = sortField; // Update the global sort field
    currentSortOrder = "asc"; // Default to ascending order on mobile

    sortTable(sortField); // Call the existing sort function for consistency
    renderCards(filteredData); // Re-render cards to reflect new sorting
});

// Initialize the app
$(document).ready(() => {
    loadData();
    $("#searchBox").on("input", applySearchFilter);
    $("#compareButton").on("click", renderComparisonModal);
});