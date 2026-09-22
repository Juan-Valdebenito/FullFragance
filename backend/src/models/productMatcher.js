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
  // Un mismo volumen suele aparecer tanto en el nombre como en la
  // presentación ("EDP 100 ml" + "100 ml"). Solo varios tamaños distintos
  // indican un set cuando no hay una palabra clave explícita.
  const volumes = [...new Set(
    extractVolumes([product?.name, product?.presentation, product?.unit].filter(Boolean).join(" "))
  )];
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

/**
 * ¿Este token numérico es el volumen y no parte del nombre?
 * Lo es si coincide con un volumen ya extraído, o si el registro no declara
 * volumen en ninguna parte y el número tiene pinta de mililitros ("EDP 100",
 * sin unidad). Un "No 28" o un "Polo 67" no la tienen y se conservan.
 */
function isVolumeToken(token, volumeTokens, hasDeclaredVolume) {
  if (!/^\d+$/.test(token)) return false;
  if (volumeTokens.has(token)) return true;
  if (hasDeclaredVolume) return false;
  const amount = Number(token);
  return amount >= 5 && amount <= 500 && amount % 5 === 0;
}

function identityTokens(product) {
  const brandTokens = new Set(normalizeBrand(brandOf(product)).split(" ").filter(Boolean));
  // Los volúmenes ya se comparan aparte (volumeOf + sameVolume), así que se
  // quitan del nombre junto con su unidad. Los demás números SÍ son identidad:
  // "No 28" y "No 33" son perfumes distintos, y antes quedaban idénticos al
  // descartar cualquier token numérico.
  const volumes = extractVolumes([product?.name, product?.presentation, product?.unit].filter(Boolean).join(" "));
  const volumeTokens = new Set(volumes.map((volume) => String(Math.round(volume))));
  return normalizedProductName(product)
    .replace(/\b\d+(?:[.,\s]\d+)?\s*(?:ml|cl|l|oz|g)\b/g, " ")
    .split(" ")
    .filter(
      (token) =>
        token &&
        !STOP_WORDS.has(token) &&
        !brandTokens.has(token) &&
        !isVolumeToken(token, volumeTokens, volumes.length > 0)
    );
}

/**
 * Números que forman parte del nombre ("No 28", "1 Million", "212").
 * Son identidad exacta, no difusa: con el umbral de tokens, "Zak No 28" y
 * "Zak No 33" puntuaban 0.75 y terminaban fusionados en un solo producto.
 */
function numericTokens(product) {
  return new Set(identityTokens(product).filter((token) => /^\d+$/.test(token)));
}

function tokenScore(left, right) {
  return tokenSetScore(new Set(identityTokens(left)), new Set(identityTokens(right)));
}

function tokenSetScore(a, b) {
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
  return samePerfumeSignatures(productSignature(left), productSignature(right));
}

/**
 * Calcula de una sola vez todos los atributos derivados que usa la comparación.
 * Antes cada llamada a samePerfume los recalculaba (normalizar strings, regex de
 * volumen, de concentración, de tipo...), y el merge del catálogo llama a la
 * comparación cientos de miles de veces sobre el mismo puñado de productos.
 */
function productSignature(product) {
  if (!product) return null;

  const brand = normalizeBrand(brandOf(product));
  const set = isSet(product);
  const signature = set ? setSignature(product) : null;
  const modifiers = modifierOf(product);
  const commercialVariants = commercialVariantOf(product);
  const productType = productTypeOf(product);
  const tokens = identityTokens(product);
  const numbers = new Set(tokens.filter((token) => /^\d+$/.test(token)));

  return {
    product,
    source: product.source,
    brand,
    isSet: set,
    setSignature: signature,
    volume: volumeOf(product),
    concentration: concentrationOf(product),
    modifiers,
    commercialVariants,
    productType,
    tokens,
    tokenSet: new Set(tokens),
    numbers,
    // Todo lo que samePerfume exige igual de forma exacta va en esta clave.
    // Dos productos con claves distintas jamás pueden ser el mismo perfume, así
    // que sirve para agrupar candidatos sin perder ninguna coincidencia.
    blockingKey: [
      brand,
      set ? `set:${signature || ""}` : "unidad",
      productType || "",
      [...modifiers].sort().join("+"),
      [...commercialVariants].sort().join("+"),
      [...numbers].sort().join("+"),
    ].join("|"),
  };
}

/** Versión de samePerfume sobre firmas ya calculadas. Misma regla, mismo resultado. */
function samePerfumeSignatures(left, right) {
  if (!left || !right || left.source === right.source) return false;

  // Cubre de una sola comparación: set y su composición, marca, tipo de
  // producto, modificadores de identidad, condición comercial y números.
  if (left.blockingKey !== right.blockingKey) return false;
  // Sin marca reconocible no se agrupa, aunque ambas cadenas sean iguales.
  if (!left.brand || !right.brand) return false;

  if (left.volume && right.volume && !sameVolume(left.volume, right.volume)) return false;

  if (left.concentration && right.concentration && left.concentration !== right.concentration) return false;
  // Si solo uno declara concentración es una señal débil de mismatch: no se
  // rechaza, pero sube el umbral de tokens exigido más abajo.
  const concentrationMismatch = Boolean(left.concentration) !== Boolean(right.concentration);

  const score = tokenSetScore(left.tokenSet, right.tokenSet);
  const minTokens = Math.min(left.tokens.length, right.tokens.length);

  // Con un solo token relevante hace falta coincidencia perfecta.
  if (minTokens <= 1) return score >= 1.0;

  return score >= (concentrationMismatch ? 0.90 : 0.72);
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
  numericTokens,
  tokenScore,
  tokenSetScore,
  samePerfume,
  productSignature,
  samePerfumeSignatures,
};
