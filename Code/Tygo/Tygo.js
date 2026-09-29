const search = document.querySelector("#search");
const products = document.querySelectorAll(".product");
const noResults = document.querySelector("#no-results");
const cartCount = document.querySelector("#cart-count");
const message = document.querySelector("#message");
let cartItems = 0;

function searchProducts() {
	const searchText = search.value.toLowerCase().trim();
	let foundProduct = false;

	for (const product of products) {
		const matches = product.textContent.toLowerCase().includes(searchText);
		product.hidden = !matches;
		if (matches) foundProduct = true;
	}

	noResults.hidden = foundProduct;
}

document.querySelector("#search-form").addEventListener("submit", (event) => {
	event.preventDefault();
	searchProducts();
});
search.addEventListener("input", searchProducts);

for (const button of document.querySelectorAll(".add-button")) {
	button.addEventListener("click", () => {
		cartItems++;
		cartCount.textContent = cartItems;
		const productName = button.parentElement.querySelector("h3").textContent;
		message.textContent = productName + " toegevoegd aan je winkelwagen.";
	});
}
