function formatCLP(n) {
  return "$" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

let notesCatalog = [];
let userFavorites = new Set();

async function goToDashboard() {
  document.getElementById("screen-auth").classList.remove("active");
  document.getElementById("screen-dashboard").classList.add("active");
  document.getElementById("footerNote").style.display = "block";

  const pill = document.getElementById("cityPill");
  pill.style.display = "flex";
  document.getElementById("cityPillText").textContent =
    selectedCity.cityName + (selectedCity.country ? ", " + selectedCity.country : "");
  document.getElementById("dashCityName").textContent = selectedCity.cityName;

  userFavorites = new Set(currentUser?.favorites || []);

  await Promise.all([loadStores(), loadPrices(""), loadNotesCatalog(), loadRecommendations()]);
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
    .map((s) => `<li data-id="${s.id}"><span><span class="dot"></span>${s.name}</span></li>`)
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

function isFavorite(productId) {
  return userFavorites.has(productId);
}

async function toggleFavorite(productId) {
  try {
    const { user } = await Api.toggleFavorite(productId);
    currentUser = user;
    userFavorites = new Set(user.favorites || []);
    await loadPrices(document.getElementById("productSearch").value);
    await loadRecommendations();
    renderFavoritesPanel();
  } catch (err) {
    alert(err.message);
  }
}

function renderTickets(comparison) {
  const grid = document.getElementById("ticketsGrid");
  grid.innerHTML = "";

  if (!comparison.length) {
    grid.innerHTML = '<div class="empty-state">No encontramos perfumes que coincidan con tu búsqueda.</div>';
    return;
  }

  comparison.forEach(({ product, prices, minPrice, maxPrice }) => {
    const ticket = document.createElement("div");
    ticket.className = "ticket";
    const fav = isFavorite(product.id);
    ticket.innerHTML = `
      <div class="ticket-head">
        <div>
          <p class="prod-brand">${product.brand || ""}</p>
          <p class="prod-name">${product.name}</p>
          <p class="prod-unit">${product.unit} · ${product.category || ""}</p>
        </div>
        <button class="fav-btn ${fav ? "active" : ""}" data-id="${product.id}" type="button" title="Guardar en favoritos">${fav ? "♥" : "♡"}</button>
      </div>
      ${renderNoteTags(product.notes)}
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
    ticket.querySelector(".fav-btn").addEventListener("click", () => toggleFavorite(product.id));
    grid.appendChild(ticket);
  });
}

function renderNoteTags(noteIds) {
  if (!noteIds?.length || !notesCatalog.length) return "";
  const names = noteIds
    .map((id) => notesCatalog.find((n) => n.id === id))
    .filter(Boolean)
    .map((n) => n.name);
  if (!names.length) return "";
  return `<div class="note-tags">${names.map((n) => `<span class="note-tag">${n}</span>`).join("")}</div>`;
}

async function loadNotesCatalog() {
  try {
    const { notes } = await Api.getNotes();
    notesCatalog = notes;
    renderNotesCatalog(notes);
  } catch (err) {
    document.getElementById("notesCatalog").innerHTML =
      `<div class="empty-state">No pudimos cargar las notas: ${err.message}</div>`;
  }
}

function renderNotesCatalog(notes) {
  const byFamily = {};
  notes.forEach((n) => {
    if (!byFamily[n.family]) byFamily[n.family] = [];
    byFamily[n.family].push(n);
  });

  const container = document.getElementById("notesCatalog");
  container.innerHTML = Object.entries(byFamily)
    .map(
      ([family, items]) => `
      <div class="notes-family">
        <h3>${family}</h3>
        <div class="notes-family-grid">
          ${items
            .map(
              (n) => `
            <article class="note-card">
              <strong>${n.name}</strong>
              <p>${n.description}</p>
            </article>
          `
            )
            .join("")}
        </div>
      </div>
    `
    )
    .join("");
}

async function loadRecommendations() {
  const grid = document.getElementById("recommendationsGrid");
  const subtitle = document.getElementById("recSubtitle");
  try {
    const { source, recommendations } = await Api.getRecommendations();
    subtitle.textContent =
      source === "preferences"
        ? "Fragancias según tu test olfativo y tus favoritos."
        : "Haz el test olfativo para recomendaciones personalizadas. Por ahora, estas son populares.";
    grid.innerHTML = renderRecommendationCards(recommendations);
    bindFavoriteButtons(grid);
  } catch (err) {
    grid.innerHTML = `<div class="empty-state">No pudimos cargar recomendaciones: ${err.message}</div>`;
  }
}

function renderRecommendationCards(recommendations) {
  if (!recommendations?.length) {
    return '<div class="empty-state">Aún no hay recomendaciones. Completa el test olfativo o guarda favoritos.</div>';
  }

  return recommendations
    .map(({ product, reason, matchedNotes }) => {
      const fav = isFavorite(product.id);
      const noteNames = (matchedNotes || []).map((n) => n.name).join(", ");
      return `
        <article class="rec-card">
          <div class="rec-card-head">
            <div>
              <span class="prod-brand">${product.brand}</span>
              <h3>${product.name}</h3>
              <span class="prod-unit">${product.unit} · ${product.category}</span>
            </div>
            <button class="fav-btn ${fav ? "active" : ""}" data-id="${product.id}" type="button">${fav ? "♥" : "♡"}</button>
          </div>
          ${renderNoteTags(product.notes)}
          <p class="rec-reason">${reason}${noteNames ? ` (${noteNames})` : ""}</p>
        </article>
      `;
    })
    .join("");
}

function bindFavoriteButtons(container) {
  container.querySelectorAll(".fav-btn").forEach((btn) => {
    btn.addEventListener("click", () => toggleFavorite(btn.dataset.id));
  });
}

function renderFavoritesPanel() {
  const grid = document.getElementById("favoritesGrid");
  if (!userFavorites.size) {
    grid.innerHTML =
      '<div class="empty-state">Aún no tienes favoritos. Pulsa ♡ en cualquier perfume para guardarlo.</div>';
    return;
  }

  Api.getPrices(selectedCity.cityName, selectedCity.lat, selectedCity.lon, "")
    .then(({ comparison }) => {
      const favProducts = comparison.filter((c) => userFavorites.has(c.product.id));
      if (!favProducts.length) {
        grid.innerHTML = '<div class="empty-state">Tus favoritos no están en el catálogo actual.</div>';
        return;
      }
      grid.innerHTML = favProducts
        .map(({ product, minPrice }) => `
            <article class="rec-card">
              <div class="rec-card-head">
                <div>
                  <span class="prod-brand">${product.brand}</span>
                  <h3>${product.name}</h3>
                  <span class="prod-unit">Desde ${formatCLP(minPrice)} en ${selectedCity.cityName}</span>
                </div>
                <button class="fav-btn active" data-id="${product.id}" type="button">♥</button>
              </div>
              ${renderNoteTags(product.notes)}
            </article>
          `)
        .join("");

      bindFavoriteButtons(grid);
    })
    .catch((err) => {
      grid.innerHTML = `<div class="empty-state">${err.message}</div>`;
    });
}

document.querySelectorAll(".dash-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".dash-tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".dash-panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById("panel-" + tab.dataset.panel).classList.add("active");
    if (tab.dataset.panel === "favorites") renderFavoritesPanel();
    if (tab.dataset.panel === "recommendations") loadRecommendations();
  });
});

let searchDebounce = null;
document.getElementById("productSearch").addEventListener("input", function () {
  clearTimeout(searchDebounce);
  const value = this.value;
  searchDebounce = setTimeout(() => loadPrices(value), 300);
});
