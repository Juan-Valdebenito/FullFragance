const { query } = require("../data/pgDatabase");
const { listProducts: listScrapedProducts } = require("../data/catalogDatabase");
const { normalizeBrand, inferBrandFromName, samePerfume, tokenScore, isSet } = require("./productMatcher");
const { DEFAULT_DATA } = require("../data/database");

let cachedProducts = null;
let cachedOlfactoryNotes = null;
let cachedBaseProducts = null;
let cachedChains = null;

function invalidateCatalogCache() {
  cachedProducts = null;
  cachedOlfactoryNotes = null;
  cachedBaseProducts = null;
  cachedChains = null;
}

function inferGender(name) {
  const value = String(name || "").toLowerCase();
  if (/mujer|femenin|woman|lady|her\b/.test(value)) return "Femenino";
  if (/hombre|masculin|man\b|him\b/.test(value)) return "Masculino";
  return "Unisex";
}

function resolvedBrand(product) {
  const declared = String(product?.brand || "").trim();
  return declared && normalizeBrand(declared) !== "sin marca"
    ? declared
    : inferBrandFromName(product?.name);
}

const NOTE_PATTERNS = [
  { id: "n1", regex: /bergamot|bergamota|dior|sauvage|citrus|cítrico|fresco/i },
  { id: "n2", regex: /limon|limón|lemon|bleu|light blue/i },
  { id: "n3", regex: /naranja|orange|terre|1 million|mandarina|mandarin/i },
  { id: "n4", regex: /rosa|rose|floral|flower|miss dior|flowerbomb/i },
  { id: "n5", regex: /jazmin|jazmín|jasmine|black opium|good girl|libre|scandal/i },
  { id: "n6", regex: /lavanda|lavender|acqua|le male|libre|212/i },
  { id: "n7", regex: /iris|polvo|powder|n°5|la vie est belle|homme/i },
  { id: "n8", regex: /cedro|cedar|wood|amaderad|sauvage|bleu|terre|boss/i },
  { id: "n9", regex: /sandalo|sándalo|sandalwood|n°5|santal|boss/i },
  { id: "n10", regex: /vetiver|terre|bleu|aventus|ahumado/i },
  { id: "n11", regex: /vainilla|vanilla|gourmand|sweet|black opium|good girl|flowerbomb|eros|libre/i },
  { id: "n12", regex: /cafe|café|coffee|black opium/i },
  { id: "n13", regex: /cacao|chocolate|good girl|scandal/i },
  { id: "n14", regex: /ambar|ámbar|amber|oriental|sauvage|1 million|eros/i },
  { id: "n15", regex: /incienso|incense|bleu|terre/i },
  { id: "n16", regex: /pimienta|pepper|spicy|especiad|sauvage|1 million/i },
  { id: "n17", regex: /canela|cinnamon|spicy|1 million|boss/i },
  { id: "n18", regex: /acua|acuatico|acuático|marino|aquatic|marine|agua|ocean|invictus/i },
  { id: "n19", regex: /menta|mint|eros|le male/i },
  { id: "n20", regex: /manzana|apple|light blue|boss/i },
  { id: "n21", regex: /pera|pear|la vie est belle/i },
  { id: "n22", regex: /piña|pina|pineapple|tropical|aventus|212/i },
];

async function loadOlfactoryNotesFromDb() {
  if (cachedOlfactoryNotes) return cachedOlfactoryNotes;
  try {
    const res = await query("SELECT * FROM olfactory_notes");
    if (res.rows && res.rows.length) {
      cachedOlfactoryNotes = res.rows;
      return cachedOlfactoryNotes;
    }
  } catch (err) {
    // Fallback
  }
  cachedOlfactoryNotes = DEFAULT_DATA.olfactoryNotes || [];
  return cachedOlfactoryNotes;
}

async function loadBaseProductsFromDb() {
  if (cachedBaseProducts) return cachedBaseProducts;
  try {
    const res = await query("SELECT * FROM base_products");
    if (res.rows && res.rows.length) {
      cachedBaseProducts = res.rows.map((row) => ({
        id: row.id,
        name: row.name,
        brand: row.brand,
        unit: row.unit,
        basePrice: row.base_price,
        category: row.category,
        gender: row.gender,
        description: row.description,
        notes: typeof row.notes === "string" ? JSON.parse(row.notes) : (row.notes || []),
      }));
      return cachedBaseProducts;
    }
  } catch (err) {
    // Fallback
  }
  cachedBaseProducts = DEFAULT_DATA.products || [];
  return cachedBaseProducts;
}

async function loadChainsFromDb() {
  if (cachedChains) return cachedChains;
  try {
    const res = await query("SELECT * FROM chains");
    if (res.rows && res.rows.length) {
      cachedChains = res.rows;
      return cachedChains;
    }
  } catch (err) {
    // Fallback
  }
  cachedChains = DEFAULT_DATA.chains || [];
  return cachedChains;
}

function getDbData() {
  return {
    products: cachedBaseProducts || DEFAULT_DATA.products || [],
    olfactoryNotes: cachedOlfactoryNotes || DEFAULT_DATA.olfactoryNotes || [],
  };
}

function resolveOlfactoryNotes(noteIds, allNotes = getDbData().olfactoryNotes) {
  return (noteIds || []).map((id) => allNotes.find((n) => n.id === id)).filter(Boolean);
}

function inferOlfactoryNotes(product, gender) {
  const text = `${product.name || ""} ${product.brand || ""} ${product.category || ""}`.toLowerCase();
  const matched = NOTE_PATTERNS.filter((item) => item.regex.test(text)).map((item) => item.id);

  if (matched.length >= 3) return matched.slice(0, 5);

  const defaultsByGender = {
    Masculino: ["n1", "n8", "n16", "n14"],
    Femenino: ["n4", "n5", "n11", "n21"],
    Unisex: ["n1", "n6", "n9", "n18"],
  };
  const defaults = defaultsByGender[gender] || defaultsByGender.Unisex;
  const merged = Array.from(new Set([...matched, ...defaults]));
  return merged.slice(0, 4);
}

function inferDescription(product, gender, noteObjects) {
  if (product.description && product.description.trim().length > 10) return product.description;
  const noteNames = (noteObjects || []).map((n) => n.name).filter(Boolean).join(", ");
  const brand = product.brand && product.brand !== "Sin marca" ? `de ${product.brand}` : "";
  const notesText = noteNames ? ` que destaca por sus notas de ${noteNames}` : "";
  if (gender === "Masculino") {
    return `${product.name} ${brand} ofrece una experiencia olfativa masculina y sofisticada. Una combinación equilibrada${notesText}, aportando carácter, distinción y una estela memorable.`;
  } else if (gender === "Femenino") {
    return `${product.name} ${brand} es una fragancia envolvente y elegante. Su armonía de acordes${notesText}, creando una estela seductora, femenina y llena de luminosidad.`;
  }
  return `${product.name} ${brand} es una creación versátil y cautivadora. Combina acordes refinados${notesText} para lograr una estela moderna, fresca y atemporal ideal para cualquier ocasión.`;
}

function scentProfileFor(product, profiles) {
  return profiles.find((profile) =>
    normalizeBrand(profile.brand) === normalizeBrand(product.brand) &&
    tokenScore(profile, product) >= 0.6
  ) || null;
}

function toCatalogProduct(product, profiles = getDbData().products, allNotes = getDbData().olfactoryNotes) {
  const inferredBrand = resolvedBrand(product);
  const enrichedProduct = inferredBrand === product.brand ? product : { ...product, brand: inferredBrand };
  const profile = scentProfileFor(enrichedProduct, profiles);
  const gender = inferGender(enrichedProduct.name);
  const rawNotes = profile?.notes && profile.notes.length ? profile.notes : inferOlfactoryNotes(enrichedProduct, gender);
  const olfactoryNotes = resolveOlfactoryNotes(rawNotes, allNotes);
  const description = profile?.description || inferDescription(enrichedProduct, gender, olfactoryNotes);

  return {
    id: `${enrichedProduct.source.replace(/-cl$/, "")}-${enrichedProduct.sku.toLowerCase()}`,
    name: enrichedProduct.name,
    brand: enrichedProduct.brand || "Sin marca",
    unit: enrichedProduct.presentation || "Presentación no informada",
    basePrice: enrichedProduct.price || 0,
    category: "Perfumes",
    gender,
    notes: rawNotes,
    olfactoryNotes,
    description,
    source: enrichedProduct.source,
    sourceUrl: enrichedProduct.url,
    imageUrl: enrichedProduct.imageUrl || null,
    available: enrichedProduct.available,
    priceIsMock: Boolean(enrichedProduct.raw?.mockPrice),
    isSet: isSet(enrichedProduct),
    offers: [{
      source: enrichedProduct.source,
      sku: enrichedProduct.sku,
      price: enrichedProduct.price || 0,
      available: enrichedProduct.available,
      productUrl: enrichedProduct.url,
      priceIsMock: Boolean(enrichedProduct.raw?.mockPrice),
    }],
  };
}

function mergeScrapedProducts(products) {
  const dbData = getDbData();
  const profiles = dbData.products;
  const allNotes = dbData.olfactoryNotes;

  const enrichedProducts = products.map((product) => {
    const inferredBrand = resolvedBrand(product);
    return inferredBrand === product.brand ? product : { ...product, brand: inferredBrand };
  });
  const byBrand = new Map();
  for (const product of enrichedProducts) {
    const brandKey = normalizeBrand(product.brand) || "unknown";
    let list = byBrand.get(brandKey);
    if (!list) {
      list = [];
      byBrand.set(brandKey, list);
    }
    list.push(product);
  }

  const groups = [];
  for (const brandProducts of byBrand.values()) {
    const brandGroups = [];
    for (const product of brandProducts) {
      const group = brandGroups.find((candidate) => candidate.some((item) => samePerfume(item, product)));
      if (group) group.push(product);
      else brandGroups.push([product]);
    }
    groups.push(...brandGroups);
  }

  return groups.map((group) => {
    const converted = group.map((product) => toCatalogProduct(product, profiles, allNotes));
    const representative = converted.find((product) => product.source === "falabella-cl") || converted[0];
    const offersBySource = new Map();
    for (const offer of converted.flatMap((product) => product.offers)) {
      const current = offersBySource.get(offer.source);
      const shouldReplace = !current
        || (offer.available && !current.available)
        || (offer.available === current.available && offer.price > 0 && (!current.price || offer.price < current.price));
      if (shouldReplace) offersBySource.set(offer.source, offer);
    }
    const offers = [...offersBySource.values()];
    const positivePrices = offers.filter((offer) => offer.price > 0).map((offer) => offer.price);
    const gender = representative.gender || inferGender(representative.name);
    const notes = representative.notes && representative.notes.length ? representative.notes : inferOlfactoryNotes(representative, gender);
    const olfactoryNotes = resolveOlfactoryNotes(notes, allNotes);
    const description = representative.description || inferDescription(representative, gender, olfactoryNotes);

    return {
      ...representative,
      gender,
      notes,
      olfactoryNotes,
      description,
      source: offers.length > 1 ? "multi-store" : representative.source,
      sourceUrl: offers.length > 1 ? null : representative.sourceUrl,
      basePrice: positivePrices.length ? Math.min(...positivePrices) : 0,
      available: offers.some((offer) => offer.available),
      priceIsMock: offers.every((offer) => offer.priceIsMock),
      offers,
      matchedStores: offers.length,
      aliases: converted.map((product) => product.id),
    };
  });
}

async function getProducts() {
  if (cachedProducts) return cachedProducts;

  await loadOlfactoryNotesFromDb();
  await loadBaseProductsFromDb();

  const sources = ["falabella-cl", "ripley-cl", "alisha-cl", "silk-cl", "elite-cl", "cosmetic-cl", "paris-cl", "abc-cl"];
  const scrapedLists = await Promise.all(sources.map((source) => listScrapedProducts(source)));
  const rawScraped = scrapedLists.flat();

  const scraped = mergeScrapedProducts(rawScraped);
  const dbData = getDbData();
  const allNotes = dbData.olfactoryNotes;

  const dbProducts = dbData.products.map((p) => {
    const gender = p.gender || inferGender(p.name);
    const notes = p.notes && p.notes.length ? p.notes : inferOlfactoryNotes(p, gender);
    const olfactoryNotes = resolveOlfactoryNotes(notes, allNotes);
    const description = inferDescription(p, gender, olfactoryNotes);
    return {
      ...p,
      gender,
      notes,
      olfactoryNotes,
      description,
    };
  });

  cachedProducts = [...scraped, ...dbProducts];
  return cachedProducts;
}

async function getProductById(id) {
  const products = await getProducts();
  return products.find((product) => product.id === id || product.aliases?.includes(id)) || null;
}

async function getChains() {
  return await loadChainsFromDb();
}

async function getOlfactoryNotes() {
  return await loadOlfactoryNotesFromDb();
}

async function getNoteById(id) {
  const notes = await getOlfactoryNotes();
  return notes.find((note) => note.id === id) || null;
}

module.exports = {
  getProducts,
  getProductById,
  getChains,
  getOlfactoryNotes,
  getNoteById,
  mergeScrapedProducts,
  invalidateCatalogCache,
};
