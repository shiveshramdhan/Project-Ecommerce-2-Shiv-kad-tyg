const searchInput = document.querySelector("#search");
const productCards = [...document.querySelectorAll(".product")];
const searchForm = document.querySelector("#search-form");
const noResults = document.querySelector("#no-results");
const cartCount = document.querySelector("#cart-count");
const message = document.querySelector("#message");

let cartItems = 0;

function searchProducts() {
    const searchText = searchInput.value.trim().toLowerCase();
    let foundProduct = false;

    productCards.forEach((product) => {
        const productName = product.dataset.productName || product.querySelector("h3")?.textContent || "";
        const category = product.querySelector(".category")?.textContent || "";
        const searchableText = `${productName} ${category}`.toLowerCase();
        const matches = searchableText.includes(searchText);
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
