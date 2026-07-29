const { readDb } = require("../data/database");
const { listProducts: listScrapedProducts } = require("../data/catalogDatabase");
const { normalizeBrand, samePerfume, tokenScore, isSet } = require("./productMatcher");

let cachedProducts = null;

function invalidateCatalogCache() {
  cachedProducts = null;
}

function inferGender(name) {
  const value = String(name || "").toLowerCase();
  if (/mujer|femenin|woman|lady|her\b/.test(value)) return "Femenino";
  if (/hombre|masculin|man\b|him\b/.test(value)) return "Masculino";
  return "Unisex";
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

function getOlfactoryNotes() {
  return readDb().olfactoryNotes || [];
}

function resolveOlfactoryNotes(noteIds, allNotes = getOlfactoryNotes()) {
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
  const noteNames = (noteObjects || []).map((n) => n.name).join(", ");
  const brand = product.brand && product.brand !== "Sin marca" ? `de ${product.brand}` : "";
  if (gender === "Masculino") {
    return `${product.name} ${brand} ofrece una experiencia olfativa masculina y sofisticada. Una combinación equilibrada que destaca por sus notas de ${noteNames}, aportando carácter, distinción y una estela memorable.`;
  } else if (gender === "Femenino") {
    return `${product.name} ${brand} es una fragancia envolvente y elegante. Su armonía de acordes destaca por matices de ${noteNames}, creando una estela seductora, femenina y llena de luminosidad.`;
  }
  return `${product.name} ${brand} es una creación versátil y cautivadora. Combina notas de ${noteNames} para lograr una estela moderna, fresca y atemporal ideal para cualquier ocasión.`;
}

function scentProfileFor(product, profiles) {
  return profiles.find((profile) =>
    normalizeBrand(profile.brand) === normalizeBrand(product.brand) &&
    tokenScore(profile, product) >= 0.6
  ) || null;
}

function toCatalogProduct(product, profiles = getDbData().products, allNotes = getDbData().olfactoryNotes) {
  const profile = scentProfileFor(product, profiles);
  const gender = inferGender(product.name);
  const rawNotes = profile?.notes && profile.notes.length ? profile.notes : inferOlfactoryNotes(product, gender);
  const olfactoryNotes = resolveOlfactoryNotes(rawNotes, allNotes);
  const description = profile?.description || inferDescription(product, gender, olfactoryNotes);

  return {
    id: `${product.source.replace(/-cl$/, "")}-${product.sku.toLowerCase()}`,
    name: product.name,
    brand: product.brand || "Sin marca",
    unit: product.presentation || "Presentación no informada",
    basePrice: product.price || 0,
    category: "Perfumes",
    gender,
    notes: rawNotes,
    olfactoryNotes,
    description,
    source: product.source,
    sourceUrl: product.url,
    imageUrl: product.imageUrl || null,
    available: product.available,
    priceIsMock: Boolean(product.raw?.mockPrice),
    isSet: isSet(product),
    offers: [{
      source: product.source,
      sku: product.sku,
      price: product.price || 0,
      available: product.available,
      productUrl: product.url,
      priceIsMock: Boolean(product.raw?.mockPrice),
    }],
  };
}

function getDbData() {
  const db = readDb();
  return {
    products: db.products || [],
    olfactoryNotes: db.olfactoryNotes || [],
  };
}

function mergeScrapedProducts(products) {
  const dbData = getDbData();
  const profiles = dbData.products;
  const allNotes = dbData.olfactoryNotes;

  // 1. Agrupar por marca normalizada para evitar comparaciones N^2 entre marcas distintas
  const byBrand = new Map();
  for (const product of products) {
    const brandKey = normalizeBrand(product.brand) || "unknown";
    let list = byBrand.get(brandKey);
    if (!list) {
      list = [];
      byBrand.set(brandKey, list);
    }
    list.push(product);
  }

  // 2. Realizar matching solo dentro del grupo de cada marca
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
    // Un mismo scraper puede encontrar una ficha más de una vez al recorrer el
    // catálogo. Para comparar tiendas, sólo debe existir una oferta por cadena.
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

function getProducts() {
  if (cachedProducts) return cachedProducts;
  const rawScraped = ["falabella-cl", "ripley-cl", "alisha-cl", "silk-cl", "elite-cl", "cosmetic-cl"].flatMap((source) => listScrapedProducts(source));
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

function getProductById(id) {
  return getProducts().find((product) => product.id === id || product.aliases?.includes(id)) || null;
}

function getChains() {
  return readDb().chains;
}

function getOlfactoryNotes() {
  return readDb().olfactoryNotes || [];
}

function getNoteById(id) {
  return getOlfactoryNotes().find((note) => note.id === id) || null;
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
