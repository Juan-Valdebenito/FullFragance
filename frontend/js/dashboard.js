function formatCLP(n) {
  return "$" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

async function goToDashboard() {
  document.getElementById("screen-auth").classList.remove("active");
  document.getElementById("screen-dashboard").classList.add("active");
  document.getElementById("footerNote").style.display = "block";

  const pill = document.getElementById("cityPill");
  pill.style.display = "flex";
  document.getElementById("cityPillText").textContent =
    selectedCity.cityName + (selectedCity.country ? ", " + selectedCity.country : "");
  document.getElementById("dashCityName").textContent = selectedCity.cityName;

  await loadStores();
  await loadPrices("");
}

async function loadStores() {
  try {
    const { stores } = await Api.getStores(selectedCity.cityName, selectedCity.lat, selectedCity.lon);
    renderStoresMap(stores, { lat: selectedCity.lat, lon: selectedCity.lon });
    renderStoresList(stores);
  } catch (err) {
    console.error(err);
  }
}

function renderStoresList(stores) {
  const list = document.getElementById("storesList");
  list.innerHTML = stores
    .map(
      (s) => `<li data-id="${s.id}"><span><span class="dot"></span>${s.name}</span></li>`
    )
    .join("");
  list.querySelectorAll("li").forEach((li, i) => {
    li.addEventListener("click", () => focusStoreOnMap(stores[i]));
  });
}

async function loadPrices(query) {
  const grid = document.getElementById("ticketsGrid");
  try {
    const { comparison } = await Api.getPrices(selectedCity.cityName, selectedCity.lat, selectedCity.lon, query);
    renderTickets(comparison);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">No pudimos cargar los precios: ${err.message}</div>`;
  }
}

function renderTickets(comparison) {
  const grid = document.getElementById("ticketsGrid");
  grid.innerHTML = "";

  if (!comparison.length) {
    grid.innerHTML = '<div class="empty-state">No encontramos productos que coincidan con tu búsqueda.</div>';
    return;
  }

  comparison.forEach(({ product, prices, minPrice, maxPrice }) => {
    const ticket = document.createElement("div");
    ticket.className = "ticket";
    ticket.innerHTML = `
      <p class="prod-name">${product.name}</p>
      <p class="prod-unit">${product.unit}</p>
      ${prices
        .map((p, i) => {
          const widthPct = Math.max(8, Math.round((p.price / maxPrice) * 100));
          return `
            <div class="row ${i === 0 ? "best" : ""}">
              <div class="row-top">
                <span class="store">${p.storeName}</span>
                <span class="price mono">${formatCLP(p.price)}</span>
              </div>
              <div class="bar-track"><div class="bar-fill" style="width:${widthPct}%"></div></div>
            </div>
          `;
        })
        .join("")}
      <div class="savings">
        <span>Ahorro máximo</span>
        <b>${formatCLP(maxPrice - minPrice)}</b>
      </div>
      <div class="zigzag"></div>
    `;
    grid.appendChild(ticket);
  });
}

let searchDebounce = null;
document.getElementById("productSearch").addEventListener("input", function () {
  clearTimeout(searchDebounce);
  const value = this.value;
  searchDebounce = setTimeout(() => loadPrices(value), 300);
});
