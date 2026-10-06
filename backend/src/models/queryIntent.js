// Interpreta lo que la persona quiso decir en la búsqueda: "perfume árabe
// hombre bajo 30 mil" son tres filtros (segmento, género y precio) y ningún
// texto. Lo que no es intención queda como texto a buscar.
const { normalize } = require("./productMatcher");

const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

const GENDER_WORDS = {
  hombre: "Masculino", hombres: "Masculino", masculino: "Masculino", masculinos: "Masculino", caballero: "Masculino", caballeros: "Masculino", varon: "Masculino",
  mujer: "Femenino", mujeres: "Femenino", femenino: "Femenino", femeninos: "Femenino", dama: "Femenino", damas: "Femenino",
  unisex: "Unisex",
};
const GENDER_LABELS = { Masculino: "Hombre", Femenino: "Mujer", Unisex: "Unisex" };

const SEGMENT_WORDS = {
  arabe: "arabic", arabes: "arabic", arabic: "arabic",
  nicho: "niche", niche: "niche",
  disenador: "designer", disenadores: "designer", designer: "designer",
};
const SEGMENT_LABELS = { arabic: "Árabes", niche: "Nicho", designer: "Diseñador" };

const SORT_WORDS = {
  barato: "price", baratos: "price", barata: "price", baratas: "price", economico: "price", economicos: "price",
  oferta: "savings", ofertas: "savings", descuento: "savings", descuentos: "savings",
};
const SORT_LABELS = { price: "Más baratos primero", savings: "Mayor ahorro" };

const SET_WORDS = new Set(["set", "sets", "kit", "kits", "estuche", "estuches", "coffret"]);

// Palabras de relleno que no ayudan a encontrar un perfume.
const FILLER_WORDS = new Set([
  "perfume", "perfumes", "fragancia", "fragancias", "colonia", "colonias",
  "de", "del", "para", "la", "el", "los", "las", "un", "una", "y", "con", "en", "que", "precio",
]);

// "30 mil", "30mil", "30k", "30.000", "$30.000", "30000"
const AMOUNT = String.raw`\$?\s*(\d{1,3}(?:[.,]\d{3})+|\d+)\s*(mil|k|lucas)?`;

function amountValue(digits, unit) {
  const number = Number(digits.replace(/[.,]/g, ""));
  return unit ? number * 1000 : number;
}

// Los rangos se leen sobre el texto original (antes de normalizar) para
// conservar el "$" y los puntos de miles.
function extractPrices(raw) {
  const filters = {};
  let rest = raw.toLowerCase();

  const between = new RegExp(String.raw`\bentre\s+${AMOUNT}\s+y\s+${AMOUNT}`, "i").exec(rest);
  if (between) {
    filters.minPrice = amountValue(between[1], between[2]);
    filters.maxPrice = amountValue(between[3], between[4]);
    rest = rest.replace(between[0], " ");
  }
  const max = new RegExp(String.raw`\b(?:bajo|hasta|menos\s+de|max(?:imo)?|máx(?:imo)?|maximo)\s+${AMOUNT}`, "i").exec(rest);
  if (max) {
    filters.maxPrice = amountValue(max[1], max[2]);
    rest = rest.replace(max[0], " ");
  }
  const min = new RegExp(String.raw`\b(?:desde|sobre|m[aá]s\s+de|min(?:imo)?|mínimo)\s+${AMOUNT}`, "i").exec(rest);
  if (min) {
    filters.minPrice = amountValue(min[1], min[2]);
    rest = rest.replace(min[0], " ");
  }
  return { filters, rest };
}

function parseIntent(query) {
  const { filters, rest } = extractPrices(String(query || ""));
  const words = normalize(rest).split(" ").filter(Boolean);
  const text = [];

  for (const word of words) {
    if (GENDER_WORDS[word] && !filters.gender) filters.gender = GENDER_WORDS[word];
    else if (SEGMENT_WORDS[word] && !filters.segment) filters.segment = SEGMENT_WORDS[word];
    else if (SORT_WORDS[word] && !filters.sort) filters.sort = SORT_WORDS[word];
    else if (SET_WORDS.has(word)) filters.presentation = "set";
    else if (!FILLER_WORDS.has(word)) text.push(word);
  }

  // Cada filtro detectado con su valor: el frontend lo pasa a la URL como un
  // filtro normal, que se ve y se puede quitar.
  const chips = [];
  const add = (key, label) => chips.push({ key, value: String(filters[key]), label });
  if (filters.segment) add("segment", SEGMENT_LABELS[filters.segment]);
  if (filters.gender) add("gender", GENDER_LABELS[filters.gender]);
  if (filters.minPrice) add("minPrice", `Desde ${money.format(filters.minPrice)}`);
  if (filters.maxPrice) add("maxPrice", `Hasta ${money.format(filters.maxPrice)}`);
  if (filters.presentation) add("presentation", "Sets y kits");
  if (filters.sort) add("sort", SORT_LABELS[filters.sort]);

  return { text: text.join(" "), filters, chips };
}

module.exports = { parseIntent };
