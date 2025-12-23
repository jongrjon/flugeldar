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
    const response = await fetch("2526.json");
    data = await response.json();
    filteredData = [...data];

    initializeDoubleRangeSlider();
    populateColorDropdown();
    applyFilters();
}

function initializeDoubleRangeSlider() {
    const minSlider = document.getElementById("minPrice");
    const maxSlider = document.getElementById("maxPrice");
    const priceRangeDisplay = document.getElementById("priceRangeDisplay");

    // Dynamically determine the min and max price
    const minPriceValue = Math.min(...data.map(item => item.PRICE));
    const maxPriceValue = Math.max(...data.map(item => item.PRICE));
    const sliderRange = maxPriceValue - minPriceValue;

    // Set the minimum spacing to 10% of the range
    const minSpacing = Math.round(sliderRange * 0.1);

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
        const minValue = parseInt(minSlider.value);
        const maxValue = parseInt(maxSlider.value);

        // Enforce minimum spacing
        if (minValue >= maxValue - minSpacing) {
            minSlider.value = maxValue - minSpacing;
        }

        updatePriceRangeDisplay(minSlider.value, maxSlider.value);
        applyFilters();
    });

    maxSlider.addEventListener("input", () => {
        const minValue = parseInt(minSlider.value);
        const maxValue = parseInt(maxSlider.value);

        // Enforce minimum spacing
        if (maxValue <= minValue + minSpacing) {
            maxSlider.value = minValue + minSpacing;
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

    // Add "Hreinsa" and "Velja Allt" buttons
    const clearButton = $('<button class="button is-small is-danger">Hreinsa</button>');
    const selectAllButton = $('<button class="button is-small is-primary">Velja Allt</button>');

    clearButton.on("click", () => {
        dropdown.find("input[type='checkbox']").prop("checked", false);
        selectedColors.clear();
        applyFilters(); // Reapply filters after clearing
    });

    selectAllButton.on("click", () => {
        dropdown.find("input[type='checkbox']").prop("checked", true);
        selectedColors.clear();
        allColors.forEach(color => selectedColors.add(color));
        applyFilters(); // Reapply filters after selecting all
    });

    dropdown.append(clearButton, selectAllButton);

    // Add checkboxes for each color
    allColors.forEach(color => {
        const label = $(`<label><input type="checkbox" value="${color}" checked> ${color}</label>`);
        label.find("input").on("change", function () {
            if (this.checked) {
                selectedColors.add(color);
            } else {
                selectedColors.delete(color);
            }
            applyFilters(); // Reapply filters on individual checkbox change
        });
        dropdown.append(label);
    });
}


// Toggle the color dropdown
$("#toggleColorDropdown").on("click", (event) => {
    event.stopPropagation(); // Prevent the click from bubbling to the document
    $("#colorDropdown").toggle();
});

// Close the dropdown when clicking outside
$(document).on("click", (event) => {
    const dropdown = $("#colorDropdown");
    const button = $("#toggleColorDropdown");

    // Check if the click is outside the dropdown or the button
    if (!dropdown.is(event.target) && dropdown.has(event.target).length === 0 && 
        !button.is(event.target) && button.has(event.target).length === 0) {
        dropdown.hide(); // Hide the dropdown
    }
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
            item.ID?.toString().includes(query)||
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

        // Attach click event to the name-cell to toggle details row
        row.find(".name-cell").on("click", function () {
            const existingDetailsRow = row.next(".details-row");

            if (existingDetailsRow.length) {
                existingDetailsRow.remove();
                currentlyOpenRow = null;
                return;
            }

            const detailsRow = createDetailsRow(item);
            row.after(detailsRow);
            detailsRow.show(); // Ensure it is visible
            detailsRow[0].offsetHeight; // Trigger reflow
            currentlyOpenRow = detailsRow;

            // Log the current DOM state
        });

        row.find("input[type='checkbox']").on("change", handleSelection);

        tbody.append(row);
    });

    updateCheckboxState();
}



function createDetailsRow(item) {
    return $(`
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
                </div>
                <div class="card-footer">
                    <button class="button is-small is-link expand-details">Sjá nánar</button>
                </div>
            </div>
        `);

        // Expand/Collapse functionality
        card.find(".expand-details").on("click", function () {
            const cardBody = $(this).closest(".card").find(".card-content");
            const button = $(this); // Reference to the clicked button

            // Remove existing details from any open card
            if (currentlyOpenCard && currentlyOpenCard[0] !== cardBody[0]) {
                currentlyOpenCard.find(".card-details").remove();
                currentlyOpenCard.closest(".card").find(".expand-details").text("Sjá nánar");
                currentlyOpenCard = null;
            }

            // Check if details are already appended
            const existingDetails = cardBody.find(".card-details");
            if (existingDetails.length) {
                existingDetails.remove(); // Remove details if they exist
                button.text("Sjá nánar");
                currentlyOpenCard = null; // No card is open
                return;
            }

            // Create and append card details
            const details = createCardDetails(item);
            cardBody.append(details);
            button.text("Loka"); // Update button text
            currentlyOpenCard = cardBody; // Update the currently open card tracker
        });

        cardContainer.append(card);
    });
}

function createCardDetails(item) {
    return $(`
        <div class="card-details" style="display: block;">
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
    `);
}

// Convert video URLs to embeddable format
function convertToEmbedURL(url) {
    if (!url) return null; // Return null for missing URLs
    if (url.includes("youtube.com") && url.includes("watch?v=")) {
        return url.replace("watch?v=", "embed/");
    } else if (url.includes("vimeo.com")) {
        return url+"?h=7ccdcc0f2d"
    }
    return null; // Return null for unsupported or invalid URLs
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

    // Calculate dynamic modal width based on number of items
    const itemCount = selectedItemsArray.length;
    const modalWidth = Math.min(100, itemCount * 15); // Max 100%, 15% per item

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
                        // Format price
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
        <table class="table is-narrow" style="border: none;">
            <thead>${headerRow}</thead>
            <tbody>${tableRows}</tbody>
        </table>
    `;

    // Render the table in the modal
    $("#comparisonContent").html(comparisonTable);
    $("#compareModal .modal-content").css("max-width", `${modalWidth}%`); // Adjust modal width
    $("#compareModal").addClass("is-active");
    $("#compareButton").hide();
}

// Close the modal
$(".modal-close, .modal-background").on("click", () => {
    $("#compareModal").removeClass("is-active");
    selectedItems.clear();
    $("#dataBody input[type='checkbox']").prop("checked", false);
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
        const valueA = a[field];
        const valueB = b[field];

        // Check if field is a string for locale-aware comparison
        if (typeof valueA === "string" && typeof valueB === "string") {
            const comparison = valueA.localeCompare(valueB, "is"); // Use Icelandic locale
            return currentSortOrder === "asc" ? comparison : -comparison;
        }

        // Default comparison for non-string fields
        if (valueA > valueB) return currentSortOrder === "asc" ? 1 : -1;
        if (valueA < valueB) return currentSortOrder === "asc" ? -1 : 1;
        return 0;
    });

    updateSortIcons(field); // Update UI icons for the sorted column
    renderTable(filteredData); // Re-render the table
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

// Toggle dropdown visibility
$("#sortDropdown .dropdown-trigger").on("click", function (event) {
    event.stopPropagation(); // Prevent event from bubbling to document
    $("#sortDropdown").toggleClass("is-active");
});

// Sort items when an option is clicked
$("#sortDropdown .dropdown-item").on("click", function (event) {
    event.preventDefault(); // Prevent default link behavior

    const sortField = $(this).data("sort"); // Get the field to sort by

    // If the selected field is the current sort field, toggle the order

    // Call sorting function
    sortTable(sortField);
    renderCards(filteredData);

    // Close the dropdown after selecting a sort field
    $("#sortDropdown").removeClass("is-active");
});

// Close the dropdown when clicking outside
$(document).on("click", function (event) {
    const dropdown = $("#sortDropdown");
    const button = $("#sortDropdown .dropdown-trigger");

    // Close the dropdown if the click is outside the dropdown and the button
    if (!dropdown.is(event.target) && dropdown.has(event.target).length === 0 &&
        !button.is(event.target) && button.has(event.target).length === 0) {
        dropdown.removeClass("is-active");
    }
});

// Initialize the app
$(document).ready(() => {
    loadData();
    $("#searchBox").on("input", applySearchFilter);
    $("#compareButton").on("click", renderComparisonModal);
});
