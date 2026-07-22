const OVERPASS_URLS = (process.env.OVERPASS_URLS || process.env.OVERPASS_URL || "https://overpass-api.de/api/interpreter,https://overpass.kumi.systems/api/interpreter").split(",").map(url => url.trim()).filter(Boolean);
const SEARCH_RADIUS_METERS = Number(process.env.STORE_SEARCH_RADIUS_METERS || 15000);
const CACHE_TTL_MS = Number(process.env.STORE_CACHE_TTL_MS || 6 * 60 * 60 * 1000);
const REQUEST_TIMEOUT_MS = Number(process.env.OVERPASS_REQUEST_TIMEOUT_MS || 15000);
const MAX_STORES = Number(process.env.MAX_STORES_PER_CITY || 30);
const cache = new Map();
const inFlight = new Map();

function buildQuery(lat, lon) {
  const latitude = Number(lat);
  const longitude = Number(lon);
  const latDelta = SEARCH_RADIUS_METERS / 111320;
  const lonDelta = SEARCH_RADIUS_METERS / (111320 * Math.cos(latitude * Math.PI / 180));
  const bbox = [latitude - latDelta, longitude - lonDelta, latitude + latDelta, longitude + lonDelta].map(value => value.toFixed(6)).join(",");
  return `[out:json][timeout:20];(
    nwr["shop"="perfumery"](${bbox});
    nwr["shop"="department_store"]["name"~"^(Falabella|Ripley|Par[ií]s|La Polar|abc La Polar)$",i](${bbox});
    nwr["shop"="cosmetics"]["name"~"^(Natura|L'Occitane|The Body Shop|Bath & Body Works|Kiehl's|DBS|Maicao|MAC Cosmetics|Jo Malone|Dior|KIKO Milano)$",i](${bbox});
  );out center tags;`;
}

function addressFrom(tags, cityName) {
  const street = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ");
  return [street, tags["addr:suburb"], tags["addr:city"] || cityName].filter(Boolean).join(", ") || cityName;
}

function normalizeElement(element, cityName) {
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  const tags = element.tags || {};
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  const name = tags.name || tags.brand || tags.operator;
  if (!name) return null;
  return {
    id: `osm-${element.type}-${element.id}`,
    chainId: (tags.brand || name).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    name,
    address: addressFrom(tags, cityName),
    lat,
    lon,
    website: tags.website || tags["contact:website"] || null,
    phone: tags.phone || tags["contact:phone"] || null,
    openingHours: tags.opening_hours || null,
    category: tags.shop,
    osmUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
  };
}

function distanceKm(fromLat, fromLon, toLat, toLon) {
  const earthRadius = 6371;
  const toRadians = value => value * Math.PI / 180;
  const dLat = toRadians(toLat - fromLat);
  const dLon = toRadians(toLon - fromLon);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchStores({ cityName, lat, lon }, cacheKey, cached) {
  try {
    let data;
    let lastError;
    for (const url of OVERPASS_URLS) {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      try {
        const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8", "User-Agent": "FullFragrance/1.0" }, body: new URLSearchParams({ data: buildQuery(lat, lon) }), signal: controller.signal });
        if (!response.ok) throw new Error(`Overpass respondió ${response.status}`);
        data = await response.json();
        break;
      } catch (error) { lastError = error; } finally { clearTimeout(timeout); }
    }
    if (!data) throw lastError || new Error("No hay instancias de Overpass configuradas");
    const seen = new Set();
    const stores = (data.elements || []).map(element => normalizeElement(element, cityName)).filter(Boolean).filter(store => {
      const key = `${store.name.toLowerCase()}|${store.lat.toFixed(5)}|${store.lon.toFixed(5)}`;
      if (seen.has(key)) return false; seen.add(key); return true;
    }).map(store => ({ ...store, distanceKm: Number(distanceKm(Number(lat), Number(lon), store.lat, store.lon).toFixed(2)) })).sort((a, b) => a.distanceKm - b.distanceKm).slice(0, MAX_STORES);
    cache.set(cacheKey, { createdAt: Date.now(), stores });
    return stores;
  } catch (error) {
    if (cached) return cached.stores;
    const wrapped = new Error("No fue posible consultar las sucursales reales en este momento.");
    wrapped.status = 502;
    wrapped.cause = error;
    throw wrapped;
  }
}

async function getStoresForCity({ cityName, lat, lon }) {
  const cacheKey = `${Number(lat).toFixed(3)}|${Number(lon).toFixed(3)}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.createdAt < CACHE_TTL_MS) return cached.stores;

  // /stores y /prices suelen pedir la misma ubicación al mismo tiempo. Ambas
  // deben compartir la consulta a Overpass en vez de duplicarla.
  const pending = inFlight.get(cacheKey);
  if (pending) return pending;

  const request = fetchStores({ cityName, lat, lon }, cacheKey, cached).finally(() => {
    if (inFlight.get(cacheKey) === request) inFlight.delete(cacheKey);
  });
  inFlight.set(cacheKey, request);
  return request;
}

module.exports = { getStoresForCity, buildQuery, normalizeElement };
