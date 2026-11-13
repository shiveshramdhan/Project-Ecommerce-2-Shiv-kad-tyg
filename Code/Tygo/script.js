const searchInput = document.querySelector("#search");
const searchForm = document.querySelector("#search-form");
const categoryFilter = document.querySelector("#category-filter");
const noResults = document.querySelector("#no-results");
const productStatus = document.querySelector("#product-status");
const productStatusText = document.querySelector("#product-status-text");
const loadingSpinner = document.querySelector(".loading-spinner");
const cartCount = document.querySelector("#cart-count");
const favoritesToggle = document.querySelector("#favorites-toggle");
const message = document.querySelector("#message");
const flashSale = document.querySelector("#flash-sale");
const countdown = document.querySelector("#countdown");
const countdownStatus = document.querySelector("#countdown-status");
const flashSaleTitle = document.querySelector("#flash-sale-title");
const dealProductList = document.querySelector("#deal-products");
const dealProductsHeading = document.querySelector("#deal-products-heading");
const otherProductList = document.querySelector("#other-products");
const otherProductsHeading = document.querySelector("#other-products-heading");
let productsLoaded = false;
let favoritesOnly = false;

const saleDuration = 5 * 60 * 60 * 1000;
const saleEndStorageKey = "whiteMarketFlashSaleEndsAt5Hours";
const favoriteStorageKey = "whiteMarketFavorites";
let saleEndsAt = Number(sessionStorage.getItem(saleEndStorageKey));

if (!saleEndsAt) {
    saleEndsAt = Date.now() + saleDuration;
    sessionStorage.setItem(saleEndStorageKey, saleEndsAt);
}

let cartItems = 0;
let favoriteProductIds = loadFavoriteProductIds();
updateFavoritesToggle();

function loadFavoriteProductIds() {
    try {
        const storedFavorites = localStorage.getItem(favoriteStorageKey);
        if (storedFavorites === null) {
            return new Set();
        }

        const parsedFavorites = JSON.parse(storedFavorites);
        if (!Array.isArray(parsedFavorites) || parsedFavorites.some((id) => typeof id !== "string")) {
            throw new Error("De opgeslagen favorieten hebben een ongeldig formaat.");
        }

        return new Set(parsedFavorites);
    } catch (error) {
        console.error("Favorieten konden niet worden geladen.", error);
        message.textContent = "Je favorieten konden niet worden geladen.";
        return new Set();
    }
}

function updateFavoriteButton(card, button, productId) {
    const isFavorite = favoriteProductIds.has(productId);
    card.classList.toggle("is-favorite", isFavorite);
    button.classList.toggle("is-favorite", isFavorite);
    button.setAttribute("aria-pressed", String(isFavorite));
    button.setAttribute("aria-label", isFavorite ? "Verwijder uit favorieten" : "Voeg toe aan favorieten");
    button.textContent = isFavorite ? "♥ Favoriet" : "♡ Favoriet";
}

function updateFavoritesToggle() {
    favoritesToggle.textContent = `Favorieten (${favoriteProductIds.size})`;
    favoritesToggle.setAttribute("aria-pressed", String(favoritesOnly));
    favoritesToggle.classList.toggle("is-active", favoritesOnly);
}

function createProductCard(product) {
    const card = document.createElement("article");
    card.className = product.deal ? "product deal-product" : "product";
    card.dataset.productName = product.name;
    card.dataset.productId = product.id;
    card.dataset.category = product.category;

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
        stockStatus.classList.add("is-last-item");
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

    const favoriteButton = document.createElement("button");
    favoriteButton.className = "favorite-button";
    favoriteButton.type = "button";
    updateFavoriteButton(card, favoriteButton, product.id);

    card.append(image, category, name, price, stockStatus, favoriteButton, addButton);
    return card;
}

function formatPrice(price) {
    return new Intl.NumberFormat("nl-NL", {
        style: "currency",
        currency: "EUR"
    }).format(price);
}

function mapApiProduct(product) {
    const image = product.thumbnail || product.images?.[0];
    if (
        !Number.isInteger(product.id) ||
        product.id <= 0 ||
        typeof product.title !== "string" ||
        typeof product.category !== "string" ||
        typeof image !== "string" ||
        !Number.isFinite(product.price) ||
        product.price < 0 ||
        !Number.isInteger(product.stock) ||
        product.stock < 0 ||
        !Number.isFinite(product.discountPercentage) ||
        product.discountPercentage < 0 ||
        product.discountPercentage >= 100
    ) {
        throw new Error("De productgegevens van de API hebben een ongeldig formaat.");
    }

    const isDeal = product.discountPercentage >= 15;
    const originalPrice = isDeal
        ? product.price / (1 - product.discountPercentage / 100)
        : null;

    return {
        id: String(product.id),
        name: product.title,
        image,
        alt: product.title,
        category: product.category,
        price: formatPrice(product.price),
        originalPrice: originalPrice === null ? null : formatPrice(originalPrice),
        stock: product.stock,
        deal: isDeal
    };
}

async function loadProducts() {
    try {
        const response = await fetch("https://dummyjson.com/products");
        if (!response.ok) {
            throw new Error(`Producten laden mislukt: ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data.products) || data.products.length < 8) {
            throw new Error("De API heeft minder dan 8 producten teruggegeven.");
        }

        const products = data.products.map(mapApiProduct);
        products.forEach((product) => {
            const card = createProductCard(product);
            (product.deal ? dealProductList : otherProductList).append(card);
        });

        updateCategoryOptions(products);
        productsLoaded = true;
        productStatus.hidden = true;
        if (saleEndsAt <= Date.now()) {
            expireFlashSale();
        }
        filterProducts();
    } catch (error) {
        console.error(error);
        loadingSpinner.hidden = true;
        productStatusText.textContent = "Producten konden niet worden geladen. Controleer je internetverbinding en probeer het later opnieuw.";
        productStatus.classList.add("is-error");
        productStatus.setAttribute("role", "alert");
    }
}

function expireFlashSale() {
    flashSale.classList.add("is-expired");
    flashSaleTitle.textContent = "De flash sale is afgelopen";
    countdownStatus.textContent = "De kortingsprijzen zijn niet meer geldig.";
    countdown.textContent = "00:00:00";

    dealProductList.querySelectorAll(".deal-product").forEach((product) => {
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

function updateCategoryOptions(products) {
    const categories = [...new Set(products
        .map((product) => product.category))]
        .sort((first, second) => first.localeCompare(second));

    categories.forEach((category) => {
        categoryFilter.add(new Option(category, category));
    });
}

function filterProducts() {
    const productCards = getProductCards();

    if (!productsLoaded) {
        noResults.hidden = true;
        return;
    }

    const searchText = searchInput.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value.toLowerCase();
    let foundProduct = false;

    productCards.forEach((product) => {
        const searchableText = `${product.dataset.productName} ${product.dataset.category}`.toLowerCase();
        const matchesSearch = searchableText.includes(searchText);
        const matchesCategory = !selectedCategory || product.dataset.category.toLowerCase() === selectedCategory;
        const matchesFavorite = !favoritesOnly || favoriteProductIds.has(product.dataset.productId);
        const matches = matchesSearch && matchesCategory && matchesFavorite;
        product.hidden = !matches;

        if (matches) {
            foundProduct = true;
        }
    });

    dealProductsHeading.hidden = !dealProductList.querySelector(".deal-product:not([hidden])");
    otherProductsHeading.hidden = !otherProductList.querySelector(".product:not([hidden])");
    noResults.textContent = favoritesOnly
        ? "Geen favoriete producten gevonden."
        : "Geen producten gevonden.";
    noResults.hidden = foundProduct;
}

favoritesToggle.addEventListener("click", () => {
    favoritesOnly = !favoritesOnly;
    updateFavoritesToggle();
    filterProducts();
});

searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    filterProducts();
});

searchInput.addEventListener("input", filterProducts);
categoryFilter.addEventListener("change", filterProducts);
filterProducts();

document.querySelector("#producten").addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) {
        return;
    }

    const product = button.closest(".product");
    const productName = product.dataset.productName;

    if (button.classList.contains("favorite-button")) {
        const productId = product.dataset.productId;
        const updatedFavorites = new Set(favoriteProductIds);
        if (updatedFavorites.has(productId)) {
            updatedFavorites.delete(productId);
        } else {
            updatedFavorites.add(productId);
        }

        try {
            localStorage.setItem(favoriteStorageKey, JSON.stringify([...updatedFavorites]));
            favoriteProductIds = updatedFavorites;
            updateFavoriteButton(product, button, productId);
            updateFavoritesToggle();
            filterProducts();
            message.textContent = favoriteProductIds.has(productId)
                ? `${productName} toegevoegd aan je favorieten.`
                : `${productName} verwijderd uit je favorieten.`;
        } catch (error) {
            console.error("Favorieten konden niet worden opgeslagen.", error);
            message.textContent = "Je favorieten konden niet worden opgeslagen.";
        }
        return;
    }

    if (!button.classList.contains("add-button")) {
        return;
    }

    cartItems += 1;
    cartCount.textContent = cartItems;
    message.textContent = `${productName} toegevoegd aan je winkelwagen.`;
});

loadProducts();
