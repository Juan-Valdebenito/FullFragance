"use strict";

const STOP_WORDS = new Set([
  "perfume", "fragancia", "hombre", "mujer", "masculino", "femenino", "unisex",
  "eau", "de", "pour", "toilette", "parfum", "edp", "edt", "extract", "extrait",
  "spray", "vaporizador", "ml", "cl", "oz", "original",
]);

/**
 * Palabras clave que indican que el producto es un set/kit.
 * No deben ser stop words — son indicadores de tipo de producto.
 */
const SET_KEYWORDS = new Set(["set", "pack", "kit", "estuche", "cofre", "coffret"]);

// No son perfumes intercambiables con una botella individual. Detectarlos evita
// comparar, por ejemplo, una loción Sauvage con el Eau de Toilette Sauvage.
const PRODUCT_TYPES = [
  ["deodorant", /\b(?:deodorant|desodorante)\b/],
  ["body-mist", /\b(?:body mist|body spray|bruma corporal)\b/],
  ["lotion", /\b(?:body lotion|locion corporal|crema corporal)\b/],
  ["shower-gel", /\b(?:shower gel|gel de ducha|gel ducha)\b/],
  ["after-shave", /\b(?:after shave|aftershave)\b/],
];

// Estas presentaciones pueden llevar el mismo líquido, pero no representan la
// misma oferta comercial. Se mantienen separadas para no comparar precios que
// no son equivalentes.
const COMMERCIAL_VARIANTS = new Set([
  "tester", "probador", "decant", "muestra", "sample", "refill", "recarga",
]);

/**
 * Modificadores que forman parte de la identidad del perfume.
 * Si uno de los productos tiene un modificador y el otro no,
 * NO son el mismo producto aunque el resto de tokens coincida.
 */
const IDENTITY_MODIFIERS = new Set([
  "intense", "intenso", "intensamente",
  "absolute", "absolu", "absolut",
  "sport", "sports",
  "extreme", "extremo",
  "fresh", "fresco",
  "noir", "noire",
  "bleu", "blue",
  "rose", "rouge",
  "gold", "golden",
  "platinum", "platino",
  "silver", "argent",
  "black", "blanc", "white",
  "deep", "profond",
  "aqua",
  "infinite", "infinity",
  "legend", "legendario",
  "modern",
  // Líneas de género (variantes masculina/femenina del mismo perfume base)
  "donna", "uomo", "homme", "femme",
  // Variantes de producto adicionales
  "extradose", "overdose",
  "night", "nuit",
  "forever", "eternity",
  "elixir",
  "coral", "fantasy",
  "yellow",
  "stravaganza",
  "wild", "sauvage",
  "privee", "prive",
  "crystal", "cristal",
  "purple", "melancholia",
  "green",
]);

// Marcas que aparecen de forma consistente en los títulos de las tiendas. El
// scraper no siempre entrega `brand` (en especial Shopify/UCP), por lo que esta
// tabla permite normalizar también los registros históricos antes del matching.
const BRAND_ALIASES = [
  ["Adolfo Dominguez", ["adolfo dominguez"]],
  ["Afnan", ["afnan"]],
  ["Al Haramain", ["al haramain"]],
  ["Antonio Banderas", ["antonio banderas"]],
  ["Ariana Grande", ["ariana grande"]],
  ["Armaf", ["armaf"]],
  ["Armaan Luxe", ["armaan luxe"]],
  ["Asdaaf", ["asdaaf"]],
  ["Athoor al Alam", ["athoor al alam"]],
  ["Attri", ["attri"]],
  ["Azzaro", ["azzaro"]],
  ["Anfar", ["anfar"]],
  ["Auraa", ["auraa"]],
  ["Bentley", ["bentley"]],
  ["Bharara", ["bharara"]],
  ["Boucheron", ["boucheron"]],
  ["Bvlgari", ["bvlgari", "bulgari"]],
  ["Burberry", ["burberry"]],
  ["Calvin Klein", ["calvin klein"]],
  ["Carolina Herrera", ["carolina herrera"]],
  ["Cacharel", ["cacharel"]],
  ["Coach", ["coach"]],
  ["Clinique", ["clinique"]],
  ["Davidoff", ["davidoff"]],
  ["Diesel", ["diesel"]],
  ["Dolce & Gabbana", ["dolce gabbana", "dolce and gabbana"]],
  ["Dumont", ["dumont"]],
  ["DKNY", ["dkny"]],
  ["Elivi", ["elivi"]],
  ["Emir", ["emir"]],
  ["Flavia", ["flavia"]],
  ["Fragrance World", ["fragrance world", "fragrance worldoud"]],
  ["French Avenue", ["french avenue"]],
  ["Fomo", ["fomo"]],
  ["Giorgio Armani", ["giorgio armani", "armani"]],
  ["Givenchy", ["givenchy"]],
  ["Gisada", ["gisada"]],
  ["Grandeur", ["grandeur"]],
  ["Gucci", ["gucci"]],
  ["Guy Laroche", ["guy laroche"]],
  ["Halloween", ["halloween", "hallowen"]],
  ["Hamidi", ["hamidi"]],
  ["Hermès", ["hermes"]],
  ["Hugo Boss", ["hugo boss", "boss"]],
  ["Issey Miyake", ["issey miyake"]],
  ["Jaguar", ["jaguar"]],
  ["Jean Paul Gaultier", ["jean paul gaultier", "jpg"]],
  ["Jenny Glow", ["jenny glow"]],
  ["Jessica Twain", ["jessica twain"]],
  ["Jesus del Pozo", ["jesus del pozo"]],
  ["Jivi Parfums", ["jivi parfums"]],
  ["Jo Milano", ["jo milano"]],
  ["Jimmy Choo", ["jimmy choo"]],
  ["Karl Lagerfeld", ["karl lagerfeld"]],
  ["Lacoste", ["lacoste"]],
  ["Lalique", ["lalique"]],
  ["Lancôme", ["lancome"]],
  ["Lattafa", ["lattafa"]],
  ["Loewe", ["loewe"]],
  ["Lorenzo Pazzaglia", ["lorenzo pazzaglia"]],
  ["Moschino", ["moschino"]],
  ["Maison Alhambra", ["maison alhambra"]],
  ["Maison Asrar", ["maison asrar"]],
  ["Matin Martin", ["matin martin"]],
  ["Memwa", ["memwa"]],
  ["Mercedes-Benz", ["mercedes benz"]],
  ["Ministry of Gourmand", ["ministry of gourmand"]],
  ["Moncler", ["moncler"]],
  ["Montblanc", ["montblanc"]],
  ["Mugler", ["mugler"]],
  ["Narciso Rodriguez", ["narciso rodriguez"]],
  ["Nautica", ["nautica"]],
  ["Nina Ricci", ["nina ricci"]],
  ["Paco Rabanne", ["paco rabanne", "rabanne"]],
  ["Paris Corner", ["paris corner"]],
  ["Perry Ellis", ["perry ellis"]],
  ["Pendora", ["pendora"]],
  ["Paloma Picasso", ["paloma picasso"]],
  ["Ralph Lauren", ["ralph lauren"]],
  ["Rasasi", ["rasasi"]],
  ["Rave", ["rave"]],
  ["Rayhaan", ["rayhaan"]],
  ["Riviera Privé", ["riviera prive"]],
  ["Risala", ["risala"]],
  ["Salvatore Ferragamo", ["salvatore ferragamo"]],
  ["Sabrina Carpenter", ["sabrina carpenter"]],
  ["Shakira", ["shakira"]],
  ["Sospiro", ["sospiro"]],
  ["Tom Ford", ["tom ford"]],
  ["Tommy Hilfiger", ["tommy hilfiger"]],
  ["Tubbees", ["tubbees"]],
  ["Tous", ["tous"]],
  ["Valentino", ["valentino"]],
  ["Versace", ["versace"]],
  ["Viktor & Rolf", ["viktor rolf", "viktor and rolf"]],
  ["Yves Saint Laurent", ["yves saint laurent", "ysl"]],
  ["Xerjoff", ["xerjoff"]],
  ["Zakat Parfums", ["zakat parfums"]],
  ["Zimaya", ["zimaya"]],
];

// Algunos títulos históricos sólo incluyen el nombre de la fragancia. Son
// referencias inequívocas y se mantienen separadas de los aliases de marca.
const TITLE_BRAND_PATTERNS = [
  [/\blegend spirit\b/, "Montblanc"],
  [/\bmont blanc explorer\b/, "Montblanc"],
  [/\bbig pony\b/, "Ralph Lauren"],
  [/\blady million\b|\bmillion gold\b/, "Paco Rabanne"],
  [/\bangel stellar\b/, "Mugler"],
  [/\bacqua di gio\b/, "Giorgio Armani"],
  [/\bnitro pour homme\b/, "Dumont"],
  [/\bodyssey\b/, "Armaf"],
  [/\bblack opium\b|\blibre\b/, "Yves Saint Laurent"],
  [/\btouch of pink\b/, "Lacoste"],
  [/\bperfume asad\b/, "Lattafa"],
  [/\bstarwalker\b/, "Montblanc"],
  [/\bh24\b/, "Hermès"],
  [/\btommy men\b/, "Tommy Hilfiger"],
  [/\bkarl ikonik\b|\bkarl paris\b/, "Karl Lagerfeld"],
  [/\bacqua di parisis\b/, "Acqua di Parisis"],
  [/\blucky number 6\b/, "Liz Claiborne"],
];

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\bn[º°]\s*(\d+)/g, " numero $1 ")
    .replace(/\bno\.?\s*(\d+)/g, " numero $1 ")
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizedProductName(product) {
  return normalize(product?.name)
    // Variaciones ortográficas y comerciales frecuentes entre catálogos.
    .replace(/\bborn in rome\b/g, "born in roma")
    .replace(/\bone million\b/g, "1 million")
    .replace(/\bnumero\s*5\b/g, "numero cinco")
    .replace(/\s+/g, " ")
    .trim();
}

function inferBrandFromName(name) {
  const value = normalize(name);
  if (!value) return null;

  for (const [brand, aliases] of BRAND_ALIASES) {
    if (aliases.some((alias) => new RegExp(`(?:^| )${alias}(?: |$)`).test(value))) {
      return brand;
    }
  }
  const titlePattern = TITLE_BRAND_PATTERNS.find(([pattern]) => pattern.test(value));
  if (titlePattern) return titlePattern[1];
  return null;
}

function brandOf(product) {
  const declared = String(product?.brand || "").trim();
  return declared && normalize(declared) !== "sin marca"
    ? declared
    : inferBrandFromName(product?.name);
}

function normalizeBrand(value) {
  const brand = normalize(value).replace(/\by\b/g, " ").replace(/\s+/g, " ").trim();
  const aliases = [
    [/\b(giorgio )?armani\b/, "armani"],
    [/\b(paco )?rabanne\b/, "rabanne"],
    [/\b(hugo )?boss\b/, "hugo boss"],
    [/\bdolce (and )?gabbana\b/, "dolce gabbana"],
    [/\byves saint laurent\b|\bysl\b/, "yves saint laurent"],
    [/\bjean paul gaultier\b/, "jean paul gaultier"],
  ];
  return aliases.find(([pattern]) => pattern.test(brand))?.[1] || brand;
}

/**
 * Extrae el volumen en ml del producto.
 * Busca primero en los campos de presentación antes de recurrir al nombre,
 * ya que el nombre puede tener números que no son el volumen (ej. "No 5").
 */
function volumeOf(product) {
  // Prioridad: campos de presentación/unidad antes que el nombre
  const presentationFields = [
    product.presentation,
    product.unit,
    product.size,
  ].filter(Boolean).join(" ");

  const presentationMatch = extractVolumes(presentationFields)[0];
  if (presentationMatch !== undefined) return presentationMatch;

  // Fallback: buscar ml en el nombre
  return extractVolumes(product.name)[0] ?? null;
}

function extractVolumes(value) {
  const volumes = [];
  const text = normalize(value);
  for (const match of text.matchAll(/\b(\d+(?:[.,]\d+)?)\s*(ml|cl|l|oz)\b/g)) {
    const amount = Number(match[1].replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) continue;
    const unit = match[2];
    const milliliters = unit === "oz" ? amount * 29.5735 : unit === "cl" ? amount * 10 : unit === "l" ? amount * 1000 : amount;
    volumes.push(Math.round(milliliters * 100) / 100);
  }
  return volumes;
}

function sameVolume(left, right) {
  return Math.abs(left - right) <= Math.max(1, Math.max(left, right) * 0.03);
}

function concentrationOf(product) {
  const value = normalize([product?.name, product?.presentation, product?.unit, product?.description].filter(Boolean).join(" "));
  if (/\b(edp|eau de parfum)\b/.test(value)) return "edp";
  if (/\b(edt|eau de toilette)\b/.test(value)) return "edt";
  if (/\b(extrait|extracto)\b/.test(value)) return "extrait";
  if (/\bparfum\b/.test(value)) return "parfum";
  if (/\b(colonia|edc|eau de cologne)\b/.test(value)) return "edc";
  return null;
}

/**
 * Extrae los modificadores de identidad presentes en el nombre del producto.
 * Dos productos con distinto conjunto de modificadores NO son el mismo perfume.
 */
function modifierOf(product) {
  const tokens = new Set(normalizedProductName(product).split(" ").filter(Boolean));
  return new Set([...tokens].filter((token) => IDENTITY_MODIFIERS.has(token)));
}

/**
 * Detecta si un producto es un set/kit (no un perfume individual).
 * Busca palabras clave y patrones de múltiples volúmenes (ej. "100ML+75ML+10ML").
 */
function isSet(product) {
  const tokens = normalize(product.name).split(" ").filter(Boolean);
  if (tokens.some((token) => SET_KEYWORDS.has(token))) return true;
  // Patrón de múltiples volúmenes unidos con + o separados
  const volumes = extractVolumes([product?.name, product?.presentation, product?.unit].filter(Boolean).join(" "));
  return volumes.length >= 2;
}

function setSignature(product) {
  if (!isSet(product)) return null;
  return extractVolumes([product?.name, product?.presentation, product?.unit].filter(Boolean).join(" "))
    .sort((left, right) => left - right)
    .map((volume) => Math.round(volume))
    .join("+");
}

function productTypeOf(product) {
  const value = normalizedProductName(product);
  return PRODUCT_TYPES.find(([, pattern]) => pattern.test(value))?.[0] || null;
}

function commercialVariantOf(product) {
  const tokens = new Set(normalizedProductName(product).split(" ").filter(Boolean));
  return new Set([...tokens].filter((token) => COMMERCIAL_VARIANTS.has(token)));
}

function identityTokens(product) {
  const brandTokens = new Set(normalizeBrand(brandOf(product)).split(" ").filter(Boolean));
  return normalizedProductName(product)
    .split(" ")
    .filter(
      (token) =>
        token &&
        !STOP_WORDS.has(token) &&
        !brandTokens.has(token) &&
        !/^\d+(?:ml|g|oz)?$/.test(token)
    );
}

function tokenScore(left, right) {
  const a = new Set(identityTokens(left));
  const b = new Set(identityTokens(right));
  if (!a.size || !b.size) return 0;
  const common = [...a].filter((token) => b.has(token)).length;
  return common / Math.max(a.size, b.size);
}

function sameTokenSet(left, right) {
  if (left.size !== right.size) return false;
  return [...left].every((token) => right.has(token));
}

/**
 * Determina si dos productos del catálogo son el mismo perfume.
 *
 * Reglas (en orden de precedencia):
 * 1. No pueden ser de la misma fuente (ya se habría deduplicado).
 * 2. La marca normalizada debe coincidir exactamente.
 * 3. Si ambos tienen volumen definido, deben ser equivalentes (ml, cl y oz).
 * 4. Si ambos tienen concentración definida, deben ser iguales.
 * 5. Los modificadores de identidad deben ser iguales (ej. "intense" vs sin intense → NO es el mismo).
 * 6. El tipo de producto y la condición comercial deben ser equivalentes.
 * 7. El score de tokens debe superar el umbral de 0.72.
 *    Si cualquiera de los productos tiene ≤ 1 token relevante, se requiere score = 1.0
 *    (coincidencia exacta) para evitar falsos positivos en nombres genéricos.
 */
function samePerfume(left, right) {
  if (!left || !right || left.source === right.source) return false;

  // Un set/kit NO es el mismo producto que un perfume individual
  if (isSet(left) !== isSet(right)) return false;
  if (isSet(left) && setSignature(left) !== setSignature(right)) return false;

  const leftBrand = normalizeBrand(brandOf(left));
  const rightBrand = normalizeBrand(brandOf(right));
  if (!leftBrand || !rightBrand || leftBrand !== rightBrand) return false;

  // Verificar volumen
  const leftVolume = volumeOf(left);
  const rightVolume = volumeOf(right);
  if (leftVolume && rightVolume && !sameVolume(leftVolume, rightVolume)) return false;

  // Verificar concentración
  const leftConcentration = concentrationOf(left);
  const rightConcentration = concentrationOf(right);
  if (leftConcentration && rightConcentration && leftConcentration !== rightConcentration) return false;
  // Si solo uno tiene concentración definida, es una señal débil de mismatch.
  // No rechazar directamente (un producto puede no listar la concentración en el nombre),
  // pero elevar el umbral de tokens requerido al final.
  const concentrationMismatch = Boolean(leftConcentration) !== Boolean(rightConcentration);

  // Verificar modificadores de identidad: si los conjuntos difieren → son productos distintos
  const leftModifiers = modifierOf(left);
  const rightModifiers = modifierOf(right);
  // Si uno tiene un modificador que el otro no tiene → productos distintos
  for (const mod of leftModifiers) {
    if (!rightModifiers.has(mod)) return false;
  }
  for (const mod of rightModifiers) {
    if (!leftModifiers.has(mod)) return false;
  }

  const leftType = productTypeOf(left);
  const rightType = productTypeOf(right);
  if (leftType !== rightType && (leftType || rightType)) return false;

  const leftCommercialVariant = commercialVariantOf(left);
  const rightCommercialVariant = commercialVariantOf(right);
  if (!sameTokenSet(leftCommercialVariant, rightCommercialVariant)) return false;

  // Calcular score de tokens
  const score = tokenScore(left, right);

  // Guard: si alguno tiene muy pocos tokens relevantes, requerir coincidencia exacta
  const leftTokens = identityTokens(left);
  const rightTokens = identityTokens(right);
  const minTokens = Math.min(leftTokens.length, rightTokens.length);

  if (minTokens <= 1) {
    // Con 1 solo token relevante necesitamos coincidencia perfecta
    return score >= 1.0;
  }

  // Si hay mismatch de concentración (uno definida, otro no), requerir coincidencia casi perfecta
  const threshold = concentrationMismatch ? 0.90 : 0.72;
  return score >= threshold;
}

module.exports = {
  normalize,
  normalizeBrand,
  inferBrandFromName,
  volumeOf,
  extractVolumes,
  concentrationOf,
  modifierOf,
  isSet,
  setSignature,
  productTypeOf,
  commercialVariantOf,
  identityTokens,
  tokenScore,
  samePerfume,
};
