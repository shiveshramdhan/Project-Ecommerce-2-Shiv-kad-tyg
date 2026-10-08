const searchInput = document.querySelector("#search");
const productCards = [...document.querySelectorAll(".product")];
const searchForm = document.querySelector("#search-form");
const noResults = document.querySelector("#no-results");
const cartCount = document.querySelector("#cart-count");
const message = document.querySelector("#message");
const flashSale = document.querySelector("#flash-sale");
const countdown = document.querySelector("#countdown");
const countdownStatus = document.querySelector("#countdown-status");
const flashSaleTitle = document.querySelector("#flash-sale-title");
const dealProducts = [...document.querySelectorAll(".deal-product")];

const saleDuration = 24 * 60 * 60 * 1000;
const saleEndStorageKey = "whiteMarketFlashSaleEndsAt";
let saleEndsAt = Number(sessionStorage.getItem(saleEndStorageKey));

if (!saleEndsAt) {
    saleEndsAt = Date.now() + saleDuration;
    sessionStorage.setItem(saleEndStorageKey, saleEndsAt);
}

let cartItems = 0;

function expireFlashSale() {
    flashSale.classList.add("is-expired");
    flashSaleTitle.textContent = "De flash sale is afgelopen";
    countdownStatus.textContent = "De kortingsprijzen zijn niet meer geldig.";
    countdown.textContent = "00:00:00";

    dealProducts.forEach((product) => {
        const dealLabel = product.querySelector(".deal-label");
        const price = product.querySelector(".price");
        const regularPrice = price.querySelector("del");

        dealLabel.textContent = "Aanbieding afgelopen";
        if (regularPrice) {
            price.textContent = regularPrice.textContent;
        }
    });
}

function updateCountdown() {
    const remainingSeconds = Math.max(0, Math.ceil((saleEndsAt - Date.now()) / 1000));

    if (remainingSeconds === 0) {
        window.clearInterval(countdownInterval);
        expireFlashSale();
        return;
    }

    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    countdown.textContent = [hours, minutes, seconds]
        .map((unit) => String(unit).padStart(2, "0"))
        .join(":");
    countdown.setAttribute("aria-label", `${hours} uur, ${minutes} minuten en ${seconds} seconden resterend`);
}

const countdownInterval = window.setInterval(updateCountdown, 1000);
updateCountdown();

function searchProducts() {
    const searchText = searchInput.value.trim().toLowerCase();
    let foundProduct = false;

    productCards.forEach((product) => {
        const matches = product.textContent.toLowerCase().includes(searchText);
        product.hidden = !matches;

        if (matches) {
            foundProduct = true;
        }
    });

    noResults.hidden = foundProduct;
}

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    searchProducts();
});

searchInput.addEventListener("input", searchProducts);

document.querySelectorAll(".add-button").forEach((button) => {
    button.addEventListener("click", () => {
        const product = button.closest(".product");
        const productName = product?.dataset.productName || product?.querySelector("h3")?.textContent || "Product";

        cartItems += 1;
        cartCount.textContent = cartItems;
        message.textContent = `${productName} toegevoegd aan je winkelwagen.`;
    });
});
