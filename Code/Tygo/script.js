const searchInput = document.querySelector("#search");
const searchForm = document.querySelector("#search-form");
const categoryFilter = document.querySelector("#category-filter");
const noResults = document.querySelector("#no-results");
const productStatus = document.querySelector("#product-status");
const cartCount = document.querySelector("#cart-count");
const message = document.querySelector("#message");
const flashSale = document.querySelector("#flash-sale");
const countdown = document.querySelector("#countdown");
const countdownStatus = document.querySelector("#countdown-status");
const flashSaleTitle = document.querySelector("#flash-sale-title");
const dealProductList = document.querySelector("#deal-products");
const otherProductList = document.querySelector("#other-products");
let dealProducts = [];

const saleDuration = 24 * 60 * 60 * 1000;
const saleEndStorageKey = "whiteMarketFlashSaleEndsAt";
let saleEndsAt = Number(sessionStorage.getItem(saleEndStorageKey));

if (!saleEndsAt) {
    saleEndsAt = Date.now() + saleDuration;
    sessionStorage.setItem(saleEndStorageKey, saleEndsAt);
}

let cartItems = 0;
let saleHasExpired = false;

function createProductCard(product) {
    const card = document.createElement("article");
    card.className = product.deal ? "product deal-product" : "product";
    card.dataset.productName = product.name;
    card.dataset.stock = product.stock;

    if (product.deal) {
        const dealLabel = document.createElement("span");
        dealLabel.className = "deal-label";
        dealLabel.textContent = "Bestel nu!";
        card.append(dealLabel);
    }

    const image = document.createElement("img");
    image.src = product.image;
    image.alt = product.alt;
    image.loading = "lazy";

    const category = document.createElement("p");
    category.className = "category";
    category.textContent = product.category;

    const name = document.createElement("h3");
    name.textContent = product.name;

    const price = document.createElement("p");
    price.className = "price";
    price.append(document.createTextNode(product.price));

    if (product.originalPrice) {
        const originalPrice = document.createElement("del");
        originalPrice.textContent = product.originalPrice;
        price.append(originalPrice);
    }

    const stockStatus = document.createElement("p");
    stockStatus.className = "stock-status";
    if (product.stock === 0) {
        stockStatus.classList.add("is-out-of-stock");
        stockStatus.textContent = "Uitverkocht";
    } else if (product.stock === 1) {
        stockStatus.classList.add("is-critical-stock");
        stockStatus.textContent = "Laatste exemplaar!";
    } else if (product.stock <= 2) {
        stockStatus.classList.add("is-critical-stock");
        stockStatus.textContent = `Bijna uitverkocht: nog ${product.stock} op voorraad`;
    } else if (product.stock <= 5) {
        stockStatus.classList.add("is-low-stock");
        stockStatus.textContent = `Lage voorraad: nog ${product.stock} beschikbaar`;
    } else {
        stockStatus.textContent = `Op voorraad: ${product.stock} stuks`;
    }

    const addButton = document.createElement("button");
    addButton.className = "add-button";
    addButton.type = "button";
    addButton.textContent = "In winkelwagen";
    addButton.disabled = product.stock === 0;

    card.append(image, category, name, price, stockStatus, addButton);
    return card;
}

async function loadProducts() {
    try {
        const response = await fetch("products.json");
        if (!response.ok) {
            throw new Error(`Producten laden mislukt: ${response.status}`);
        }

        const products = await response.json();
        if (!Array.isArray(products) || products.length < 8) {
            throw new Error("Het productbestand moet minimaal 8 producten bevatten.");
        }
        if (products.some((product) => !Number.isInteger(product.stock) || product.stock < 0)) {
            throw new Error("Elk product moet een geldig, niet-negatief voorraadaantal hebben.");
        }

        products.forEach((product) => {
            const card = createProductCard(product);
            (product.deal ? dealProductList : otherProductList).append(card);
        });

        dealProducts = [...dealProductList.querySelectorAll(".deal-product")];
        productStatus.hidden = true;
        if (saleHasExpired) {
            expireFlashSale();
        }
        filterProducts();
    } catch (error) {
        console.error(error);
        productStatus.textContent = "Producten konden niet worden geladen. Probeer het later opnieuw.";
    }
}

function expireFlashSale() {
    saleHasExpired = true;
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

function getProductCards() {
    return [...document.querySelectorAll(".product")];
}

function getProductCategory(product) {
    return product.dataset.category || product.querySelector(".category")?.textContent.trim() || "";
}

function updateCategoryOptions(productCards) {
    const selectedCategory = categoryFilter.value;
    const categories = [...new Set(productCards
        .map(getProductCategory)
        .filter(Boolean))]
        .sort((first, second) => first.localeCompare(second));

    categoryFilter.replaceChildren(new Option("Alle categorieën", ""));

    categories.forEach((category) => {
        categoryFilter.add(new Option(category, category));
    });

    categoryFilter.value = categories.includes(selectedCategory) ? selectedCategory : "";
}

function filterProducts() {
    const productCards = getProductCards();
    updateCategoryOptions(productCards);

    const searchText = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value.toLowerCase();
    let foundProduct = false;

    productCards.forEach((product) => {
        const productName = product.dataset.productName || product.querySelector("h3")?.textContent || "";
        const category = getProductCategory(product);
        const searchableText = `${productName} ${category}`.toLowerCase();
        const matchesSearch = searchableText.includes(searchText);
        const matchesCategory = !selectedCategory || category.toLowerCase() === selectedCategory;
        const matches = matchesSearch && matchesCategory;
        product.hidden = !matches;

        if (matches) {
            foundProduct = true;
        }
    });

    noResults.hidden = foundProduct;
}

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    filterProducts();
});

searchInput.addEventListener("input", filterProducts);
categoryFilter.addEventListener("change", filterProducts);
filterProducts();

document.querySelector("#producten").addEventListener("click", (event) => {
    const button = event.target.closest(".add-button");
    if (!button) {
        return;
    }

    const product = button.closest(".product");
    const productName = product?.dataset.productName || product?.querySelector("h3")?.textContent || "Product";

    cartItems += 1;
    cartCount.textContent = cartItems;
    message.textContent = `${productName} toegevoegd aan je winkelwagen.`;
});

loadProducts();
