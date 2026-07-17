// ---- Autocompletado de ciudad usando Nominatim (OpenStreetMap) ----
async function searchCityCandidates(query) {
  const url = "https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=6&featureType=city&q=" + encodeURIComponent(query);
  const res = await fetch(url);
  if (!res.ok) throw new Error("No se pudo consultar el servicio de ciudades.");
  const data = await res.json();
  return data.map((place) => {
    const addr = place.address || {};
    const cityName = addr.city || addr.town || addr.village || addr.municipality || place.display_name.split(",")[0];
    return {
      cityName,
      country: addr.country || "",
      lat: Number(place.lat),
      lon: Number(place.lon),
      displayName: place.display_name,
    };
  });
}

// ---- Mapa Leaflet para elegir/confirmar la ciudad ----
let pickMapInstance = null;
let pickMarker = null;

function showCityOnPickMap(lat, lon, label) {
  const el = document.getElementById("cityPickMap");
  if (!pickMapInstance) {
    pickMapInstance = L.map(el, { zoomControl: true }).setView([lat, lon], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(pickMapInstance);
  } else {
    pickMapInstance.setView([lat, lon], 12);
  }
  if (pickMarker) pickMapInstance.removeLayer(pickMarker);
  pickMarker = L.marker([lat, lon]).addTo(pickMapInstance).bindPopup(label).openPopup();
  setTimeout(() => pickMapInstance.invalidateSize(), 150);
}

// ---- Mapa Leaflet con las tiendas del dashboard ----
let storesMapInstance = null;
let storeMarkers = [];

function renderStoresMap(stores, center) {
  const el = document.getElementById("storesMap");
  if (!storesMapInstance) {
    storesMapInstance = L.map(el).setView([center.lat, center.lon], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 18,
    }).addTo(storesMapInstance);
  } else {
    storesMapInstance.setView([center.lat, center.lon], 13);
  }

  storeMarkers.forEach((m) => storesMapInstance.removeLayer(m));
  storeMarkers = stores.map((store) => {
    const marker = L.marker([store.lat, store.lon]).addTo(storesMapInstance);
    marker.bindPopup(`<b>${store.name}</b><br>${store.address}`);
    return marker;
  });

  setTimeout(() => storesMapInstance.invalidateSize(), 150);
}

function focusStoreOnMap(store) {
  if (!storesMapInstance) return;
  storesMapInstance.setView([store.lat, store.lon], 15);
  const marker = storeMarkers.find((m) => {
    const ll = m.getLatLng();
    return Math.abs(ll.lat - store.lat) < 1e-9 && Math.abs(ll.lng - store.lon) < 1e-9;
  });
  if (marker) marker.openPopup();
}
