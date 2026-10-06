const { getComparison } = require("./priceService");
const { normalize, normalizeBrand, identityTokens } = require("./productMatcher");
const { PERFUME_SEGMENTS, perfumeSegmentForBrand } = require("./perfumeSegments");
const { parseIntent } = require("./queryIntent");
const { buildVocabulary, correctTokens } = require("./fuzzy");

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 48;
const SORT_MODES = new Set(["recommended", "price", "price-desc", "savings", "stores", "name", "name-desc"]);
const SUGGESTED_PRODUCTS = 6;
// Menos coincidencias exactas que esto activa la corrección de tipeo.
const FEW_MATCHES = 3;
const SUGGESTED_BRANDS = 4;
const GENDERS = new Set(["Masculino", "Femenino", "Unisex"]);

// Se calcula desde el texto para evitar datos de catálogos previos que
// marcaron como set un perfume individual con el volumen repetido.
function isSetProduct(product) {
  const text = `${product.name} ${product.unit}`.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (/\b(?:set|pack|kit|estuche|cofre|coffret)\b/.test(text)) return true;
  const volumes = text.match(/\b\d+(?:[.,]\d+)?\s*(?:ml|cl|oz|l)\b/g) || [];
  return new Set(volumes.map((volume) => volume.replace(",", ".").replace(/\s/g, ""))).size >= 2;
}

// Cerca de la mitad del catálogo llega sin género; se deduce del nombre para que
// el filtro (y "perfume de hombre" en la búsqueda) no deje fuera esos perfumes.
const MALE_PATTERN = /\b(?:hombre|hombres|caballero|masculino|men|man|homme|uomo|him|pour homme)\b/;
const FEMALE_PATTERN = /\b(?:mujer|mujeres|dama|femenino|women|woman|femme|donna|her|pour femme)\b/;
const UNISEX_PATTERN = /\bunisex\b/;

function inferGender(product, haystack) {
  if (GENDERS.has(product.gender)) return product.gender;
  if (UNISEX_PATTERN.test(haystack)) return "Unisex";
  const male = MALE_PATTERN.test(haystack);
  const female = FEMALE_PATTERN.test(haystack);
  if (male === female) return "";
  return male ? "Masculino" : "Femenino";
}

// El índice se arma una vez por versión del catálogo: getComparison("") devuelve
// el mismo arreglo hasta que un scraper invalida el caché, así que su identidad
// sirve para saber cuándo recalcular. Cada búsqueda sólo recorre datos ya listos.
let cachedIndex = null;
let cachedIndexSource = null;
let cachedVocabulary = null;

async function getSearchIndex() {
  const comparison = await getComparison("");
  if (cachedIndexSource === comparison) return cachedIndex;
  cachedIndex = comparison.map((item) => {
    const haystack = normalize([item.product.brand, item.product.name, item.product.category, item.product.unit].filter(Boolean).join(" "));
    return {
    item,
    haystack,
    gender: inferGender(item.product, haystack),
    segment: perfumeSegmentForBrand(item.product.brand),
    isSet: isSetProduct(item.product),
    stores: new Set(item.prices.map((price) => price.storeName)),
    storeCount: item.product.matchedStores ?? item.prices.length,
    price: item.minPrice ?? item.product.basePrice,
    savings: item.maxPrice && item.minPrice ? item.maxPrice - item.minPrice : 0,
    sortName: `${item.product.brand} ${item.product.name}`,
    };
  });
  cachedIndexSource = comparison;
  cachedVocabulary = buildVocabulary(cachedIndex.map((entry) => entry.haystack));
  return cachedIndex;
}

function clampInt(value, fallback, min, max) {
  const number = Number.parseInt(value, 10);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(Math.max(number, min), max);
}

function positiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function text(value, maxLength = 120) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

// Normaliza la query string a filtros válidos; lo desconocido se ignora en vez
// de fallar, igual que hacía el filtrado en el navegador.
function parseSearchParams(query = {}) {
  const segment = text(query.segment);
  const sort = text(query.sort);
  const presentation = text(query.presentation);
  const gender = text(query.gender);
  return {
    q: text(query.q, 200),
    brand: text(query.brand),
    category: text(query.cat),
    gender: GENDERS.has(gender) ? gender : "",
    minPrice: positiveNumber(query.minPrice),
    maxPrice: positiveNumber(query.maxPrice),
    store: text(query.store),
    presentation: presentation === "set" || presentation === "individual" ? presentation : "",
    // "multiple" = sólo perfumes en 2+ tiendas; "all" o vacío = todos.
    comparison: text(query.comparison) === "multiple",
    segment: PERFUME_SEGMENTS.includes(segment) ? segment : "",
    sort: SORT_MODES.has(sort) ? sort : "recommended",
    page: clampInt(query.page, 1, 1, Number.MAX_SAFE_INTEGER),
    pageSize: clampInt(query.pageSize, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE),
  };
}

function matchesQuery(entry, tokens) {
  return tokens.every((token) => entry.haystack.includes(token));
}

function matchesFilters(entry, filters) {
  const { product } = entry.item;
  return (!filters.brand || product.brand === filters.brand)
    && (!filters.category || product.category === filters.category)
    && (!filters.gender || entry.gender === filters.gender)
    && (!filters.minPrice || entry.price >= filters.minPrice)
    && (!filters.maxPrice || entry.price <= filters.maxPrice)
    && (!filters.store || entry.stores.has(filters.store))
    && (!filters.presentation || (filters.presentation === "set" ? entry.isSet : !entry.isSet))
    && (!filters.segment || entry.segment === filters.segment);
}

const byPriceAsc = (a, b) => (a.item.minPrice ?? Number.MAX_SAFE_INTEGER) - (b.item.minPrice ?? Number.MAX_SAFE_INTEGER);

const comparators = {
  name: (a, b) => a.sortName.localeCompare(b.sortName, "es"),
  "name-desc": (a, b) => b.sortName.localeCompare(a.sortName, "es"),
  price: byPriceAsc,
  "price-desc": (a, b) => (b.item.minPrice ?? 0) - (a.item.minPrice ?? 0),
  savings: (a, b) => b.savings - a.savings,
  stores: (a, b) => b.storeCount - a.storeCount,
  recommended: (a, b) => ((b.item.product.matchedStores ?? 0) - (a.item.product.matchedStores ?? 0)) || byPriceAsc(a, b),
};

function sortedUnique(values) {
  return [...new Set(values)].filter(Boolean).sort((a, b) => a.localeCompare(b, "es"));
}

// Texto de la búsqueda → entradas que coinciden. Si casi nada coincide tal cual,
// se reintenta con las palabras corregidas ("lataffa" → "lattafa").
function matchText(index, text) {
  const tokens = text.split(" ").filter(Boolean);
  if (!tokens.length) return { matched: index, correctedQuery: null };
  const matched = index.filter((entry) => matchesQuery(entry, tokens));
  // Con varias coincidencias exactas la búsqueda se respeta tal cual.
  if (matched.length >= FEW_MATCHES) return { matched, correctedQuery: null };
  const correction = correctTokens(tokens, cachedVocabulary);
  if (!correction.corrected) return { matched, correctedQuery: null };
  const corrected = index.filter((entry) => matchesQuery(entry, correction.tokens));
  if (corrected.length <= matched.length) return { matched, correctedQuery: null };
  // Primero lo corregido y después lo poco que coincidía exacto.
  const seen = new Set(corrected);
  return {
    matched: [...corrected, ...matched.filter((entry) => !seen.has(entry))],
    correctedQuery: correction.tokens.join(" "),
  };
}

// La intención escrita ("hombre", "nicho", "bajo 30 mil") sólo completa los
// filtros que no vienen explícitos en la URL.
function applyIntent(filters, intent) {
  const applied = [];
  for (const chip of intent.chips) {
    const value = intent.filters[chip.key];
    const isDefault = chip.key === "sort" ? filters.sort === "recommended" : !filters[chip.key];
    if (!isDefault) continue;
    filters[chip.key] = value;
    applied.push(chip);
  }
  return applied;
}

async function searchCatalog(query) {
  const filters = parseSearchParams(query);
  const index = await getSearchIndex();
  const intent = parseIntent(filters.q);
  const appliedIntent = applyIntent(filters, intent);
  const { matched, correctedQuery } = matchText(index, intent.text);
  // El filtro de comparación se aplica aparte para poder informar cuántos
  // perfumes comparables hay dentro del resto de filtros ("Mostrando X de Y").
  const filtered = matched.filter((entry) => matchesFilters(entry, filters));
  const comparableTotal = filtered.reduce((count, entry) => count + (entry.storeCount >= 2 ? 1 : 0), 0);
  const results = (filters.comparison ? filtered.filter((entry) => entry.storeCount >= 2) : filtered)
    .sort(comparators[filters.sort]);

  const total = results.length;
  const totalPages = Math.max(1, Math.ceil(total / filters.pageSize));
  const page = Math.min(filters.page, totalPages);
  const start = (page - 1) * filters.pageSize;

  return {
    items: results.slice(start, start + filters.pageSize).map((entry) => entry.item),
    total,
    page,
    pageSize: filters.pageSize,
    totalPages,
    comparableTotal,
    unfilteredTotal: filtered.length,
    // Lo que se entendió de la búsqueda, para mostrarlo y poder deshacerlo.
    intent: appliedIntent,
    // Texto que quedó tras sacar la intención ("perfume árabe yara" → "yara").
    text: intent.text,
    correctedQuery,
    // Las opciones de los selectores salen de lo que coincide con la búsqueda
    // de texto, como antes, para que un filtro no esconda las demás opciones.
    facets: {
      brands: sortedUnique(matched.map((entry) => entry.item.product.brand)),
      categories: sortedUnique(matched.map((entry) => entry.item.product.category)),
      stores: sortedUnique(matched.flatMap((entry) => [...entry.stores])),
    },
  };
}

// Favoritos: sólo los perfumes pedidos, aceptando ids viejos de cada tienda.
async function comparisonsByIds(ids) {
  const wanted = new Set(ids);
  const index = await getSearchIndex();
  return index
    .filter(({ item }) => wanted.has(item.product.id) || (item.product.aliases || []).some((alias) => wanted.has(alias)))
    .map((entry) => entry.item);
}

// Palabras que no distinguen una fragancia de otra: género, artículos, formato
// de venta. Las concentraciones y el volumen ya los quita identityTokens.
const VERSION_NOISE = new Set([
  "of", "the", "le", "la", "les", "l", "for", "by", "y", "and",
  "woman", "women", "man", "men", "homme", "femme", "pour", "him", "her",
  "tester", "recargable", "refill", "recarga",
]);

// Tokens de identidad por producto (nombre sin marca, volumen ni concentración).
// Se calculan sólo cuando alguien pide similares y se reusan por versión.
let cachedIdentity = null;
let cachedIdentityIndex = null;

function identityOf(index, entry) {
  if (cachedIdentityIndex !== index) {
    cachedIdentity = new Map();
    cachedIdentityIndex = index;
  }
  let identity = cachedIdentity.get(entry);
  if (!identity) {
    const tokens = identityTokens(entry.item.product).filter((token) => !VERSION_NOISE.has(token));
    identity = { brandKey: normalizeBrand(entry.item.product.brand), key: [...new Set(tokens)].sort().join(" ") };
    cachedIdentity.set(entry, identity);
  }
  return identity;
}


// El nombre base no distingue la línea masculina de la femenina (Eros vs
// Eros Pour Femme): se descarta si ambos géneros son conocidos y difieren.
function sameGenderLine(left, right) {
  const gendered = new Set(["Masculino", "Femenino"]);
  return !(gendered.has(left) && gendered.has(right) && left !== right);
}

// Otras versiones de la misma fragancia (tamaño o concentración distintos) que
// sí están en 2+ tiendas. Se exige el mismo nombre base, no sólo parecido: así
// "Omnia" no sugiere "Omnia Coral" ni "Soryani Woman" sugiere "Hawas Woman".
// Evita que un perfume de una sola tienda sea un callejón sin salida.
async function similarComparables(productId, limit = 4) {
  const index = await getSearchIndex();
  const target = index.find(({ item }) => item.product.id === productId || (item.product.aliases || []).includes(productId));
  if (!target) return null;
  const targetIdentity = identityOf(index, target);
  if (!targetIdentity.key) return [];

  return index
    .filter((entry) => entry !== target && entry.storeCount >= 2)
    .filter((entry) => {
      const identity = identityOf(index, entry);
      return identity.brandKey === targetIdentity.brandKey
        && identity.key === targetIdentity.key
        && sameGenderLine(target.item.product.gender, entry.item.product.gender);
    })
    .sort((a, b) => b.storeCount - a.storeCount || (a.item.minPrice ?? 0) - (b.item.minPrice ?? 0))
    .slice(0, limit)
    .map((entry) => entry.item);
}

async function catalogIds() {
  const index = await getSearchIndex();
  return index.map(({ item }) => item.product.id);
}

function suggestionProduct(entry) {
  const { product } = entry.item;
  return {
    id: product.id,
    name: product.name,
    brand: product.brand,
    imageUrl: product.imageUrl,
    imageUrls: product.imageUrls,
    minPrice: entry.price,
    storeCount: entry.storeCount,
  };
}

// Sugerencias mientras se escribe: perfumes y marcas que coinciden, la
// intención detectada y la corrección de tipeo si hubo.
async function suggest(rawQuery) {
  const query = text(rawQuery, 200);
  const index = await getSearchIndex();
  const intent = parseIntent(query);
  const { matched, correctedQuery } = matchText(index, intent.text);
  const filters = { ...parseSearchParams({}), ...intent.filters };
  const results = matched.filter((entry) => matchesFilters(entry, filters));
  const searchText = correctedQuery ?? intent.text;

  // Primero lo que empieza por la marca o el nombre buscado; después lo más
  // comparado y lo más barato.
  const startsWith = (entry) => (searchText && (normalize(entry.item.product.brand).startsWith(searchText)
    || normalize(entry.item.product.name).startsWith(searchText)) ? 1 : 0);
  const products = [...results]
    .sort((a, b) => startsWith(b) - startsWith(a) || b.storeCount - a.storeCount || byPriceAsc(a, b))
    .slice(0, SUGGESTED_PRODUCTS)
    .map(suggestionProduct);

  // Marcas cuyo nombre coincide con lo escrito, con cuántos perfumes tienen.
  const brandCounts = new Map();
  if (searchText) {
    for (const entry of results) {
      const { brand } = entry.item.product;
      if (normalize(brand).includes(searchText)) brandCounts.set(brand, (brandCounts.get(brand) ?? 0) + 1);
    }
  }
  const brands = [...brandCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, SUGGESTED_BRANDS)
    .map(([name, count]) => ({ name, count }));

  return {
    query,
    text: intent.text,
    correctedQuery,
    filters: intent.filters,
    chips: intent.chips,
    total: results.length,
    brands,
    products,
  };
}

module.exports = { suggest, searchCatalog, comparisonsByIds, catalogIds, similarComparables, parseSearchParams, isSetProduct, MAX_PAGE_SIZE };
