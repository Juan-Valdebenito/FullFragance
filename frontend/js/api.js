const API_BASE = "/api";

function getToken() {
  return localStorage.getItem("ferio_token");
}
function setToken(token) {
  localStorage.setItem("ferio_token", token);
}
function clearToken() {
  localStorage.removeItem("ferio_token");
}

async function apiRequest(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;
  }

  const res = await fetch(API_BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Ocurrió un error inesperado.");
  }
  return data;
}

const Api = {
  register: (name, email, password) =>
    apiRequest("/auth/register", { method: "POST", auth: false, body: { name, email, password } }),
  login: (email, password) =>
    apiRequest("/auth/login", { method: "POST", auth: false, body: { email, password } }),
  me: () => apiRequest("/auth/me"),
  setCity: (city) => apiRequest("/users/me/city", { method: "PUT", body: city }),
  getStores: (cityName, lat, lon) =>
    apiRequest(`/stores?cityName=${encodeURIComponent(cityName)}&lat=${lat}&lon=${lon}`),
  getPrices: (cityName, lat, lon, q = "") =>
    apiRequest(`/prices?cityName=${encodeURIComponent(cityName)}&lat=${lat}&lon=${lon}&q=${encodeURIComponent(q)}`),
};
