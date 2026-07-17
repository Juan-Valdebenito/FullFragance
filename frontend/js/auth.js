let selectedCity = null; // { cityName, country, lat, lon }
let currentUser = null;

/* Tabs registro/login */
document.querySelectorAll(".auth-tabs .tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".auth-tabs .tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".auth-form").forEach((f) => f.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab + "Form").classList.add("active");
  });
});

/* Registro */
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPass").value;
  const errorEl = document.getElementById("registerError");
  errorEl.textContent = "";

  try {
    const { token, user } = await Api.register(name, email, password);
    setToken(token);
    currentUser = user;
    afterAuthSuccess(user);
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

/* Login */
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPass").value;
  const errorEl = document.getElementById("loginError");
  errorEl.textContent = "";

  try {
    const { token, user } = await Api.login(email, password);
    setToken(token);
    currentUser = user;
    afterAuthSuccess(user);
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

function afterAuthSuccess(user) {
  document.getElementById("logoutBtn").style.display = "inline";
  if (user.city) {
    selectedCity = { cityName: user.city.name, country: user.city.country, lat: user.city.lat, lon: user.city.lon };
    goToDashboard();
  } else {
    openCityModal();
  }
}

document.getElementById("logoutBtn").addEventListener("click", () => {
  clearToken();
  currentUser = null;
  selectedCity = null;
  document.getElementById("logoutBtn").style.display = "none";
  document.getElementById("cityPill").style.display = "none";
  document.getElementById("screen-dashboard").classList.remove("active");
  document.getElementById("screen-auth").classList.add("active");
});

/* ---- Modal de ciudad ---- */
const cityInput = document.getElementById("cityInput");
const cityResults = document.getElementById("cityResults");
const cityPreview = document.getElementById("cityPreview");
let debounceTimer = null;
let pendingCity = null;

function openCityModal() {
  document.getElementById("cityModal").classList.add("active");
  cityInput.value = "";
  cityInput.focus();
}

cityInput.addEventListener("input", () => {
  const q = cityInput.value.trim();
  cityPreview.classList.remove("active");
  pendingCity = null;
  clearTimeout(debounceTimer);
  if (q.length < 3) {
    cityResults.classList.remove("active");
    cityResults.innerHTML = "";
    return;
  }
  cityResults.classList.add("active");
  cityResults.innerHTML = '<li class="loading">Buscando ciudades…</li>';
  debounceTimer = setTimeout(async () => {
    try {
      const candidates = await searchCityCandidates(q);
      if (!candidates.length) {
        cityResults.innerHTML = '<li class="empty">No encontramos esa ciudad. Prueba con otro nombre.</li>';
        return;
      }
      cityResults.innerHTML = "";
      candidates.forEach((c) => {
        const li = document.createElement("li");
        li.innerHTML = `<span class="main">${c.cityName}</span><span class="sub">${c.displayName}</span>`;
        li.addEventListener("click", () => choosePendingCity(c));
        cityResults.appendChild(li);
      });
    } catch (err) {
      cityResults.innerHTML = '<li class="empty">No pudimos buscar ahora. Revisa tu conexión.</li>';
    }
  }, 400);
});

function choosePendingCity(candidate) {
  pendingCity = candidate;
  cityResults.classList.remove("active");
  cityInput.value = candidate.cityName + (candidate.country ? ", " + candidate.country : "");
  document.getElementById("chosenCityName").textContent = candidate.cityName;
  document.getElementById("chosenCityCountry").textContent = candidate.country;
  showCityOnPickMap(candidate.lat, candidate.lon, candidate.cityName);
  cityPreview.classList.add("active");
}

document.getElementById("confirmCityBtn").addEventListener("click", async () => {
  if (!pendingCity) return;
  try {
    const { user } = await Api.setCity({
      name: pendingCity.cityName,
      country: pendingCity.country,
      lat: pendingCity.lat,
      lon: pendingCity.lon,
    });
    currentUser = user;
    selectedCity = { cityName: pendingCity.cityName, country: pendingCity.country, lat: pendingCity.lat, lon: pendingCity.lon };
    document.getElementById("cityModal").classList.remove("active");
    goToDashboard();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById("changeCityBtn").addEventListener("click", () => {
  openCityModal();
});
