"use strict";

const STOP_WORDS = new Set([
  "perfume", "fragancia", "hombre", "mujer", "masculino", "femenino", "unisex",
  "eau", "de", "pour", "toilette", "parfum", "edp", "edt", "extract", "extrait",
  "spray", "vaporizador", "ml", "original",
]);

/**
 * Palabras clave que indican que el producto es un set/kit.
 * No deben ser stop words — son indicadores de tipo de producto.
 */
const SET_KEYWORDS = new Set(["set", "pack", "kit", "estuche", "cofre", "coffret"]);

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

function normalize(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " y ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

  const presentationMatch = normalize(presentationFields).match(/\b(\d+(?:[.,]\d+)?)\s*ml\b/);
  if (presentationMatch) return Number(presentationMatch[1].replace(",", "."));

  // Fallback: buscar ml en el nombre
  const nameMatch = normalize(product.name || "").match(/\b(\d+(?:[.,]\d+)?)\s*ml\b/);
  return nameMatch ? Number(nameMatch[1].replace(",", ".")) : null;
}

function concentrationOf(product) {
  const value = normalize(product.name);
  if (/\b(edp|eau de parfum)\b/.test(value)) return "edp";
  if (/\b(edt|eau de toilette)\b/.test(value)) return "edt";
  if (/\b(extrait|extracto)\b/.test(value)) return "extrait";
  if (/\b(colonia|edc|eau de cologne)\b/.test(value)) return "edc";
  return null;
}

/**
 * Extrae los modificadores de identidad presentes en el nombre del producto.
 * Dos productos con distinto conjunto de modificadores NO son el mismo perfume.
 */
function modifierOf(product) {
  const tokens = new Set(normalize(product.name).split(" ").filter(Boolean));
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
  const name = normalize(product.name);
  const volumeMatches = name.match(/\d+\s*ml/g);
  return volumeMatches !== null && volumeMatches.length >= 2;
}

function identityTokens(product) {
  const brandTokens = new Set(normalizeBrand(product.brand).split(" ").filter(Boolean));
  return normalize(product.name)
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

/**
 * Determina si dos productos del catálogo son el mismo perfume.
 *
 * Reglas (en orden de precedencia):
 * 1. No pueden ser de la misma fuente (ya se habría deduplicado).
 * 2. La marca normalizada debe coincidir exactamente.
 * 3. Si ambos tienen volumen definido, deben ser iguales.
 * 4. Si ambos tienen concentración definida, deben ser iguales.
 * 5. Los modificadores de identidad deben ser iguales (ej. "intense" vs sin intense → NO es el mismo).
 * 6. El score de tokens debe superar el umbral de 0.72.
 *    Si cualquiera de los productos tiene ≤ 1 token relevante, se requiere score = 1.0
 *    (coincidencia exacta) para evitar falsos positivos en nombres genéricos.
 */
function samePerfume(left, right) {
  if (!left || !right || left.source === right.source) return false;

  // Un set/kit NO es el mismo producto que un perfume individual
  if (isSet(left) !== isSet(right)) return false;

  const leftBrand = normalizeBrand(left.brand);
  const rightBrand = normalizeBrand(right.brand);
  if (!leftBrand || !rightBrand || leftBrand !== rightBrand) return false;

  // Verificar volumen
  const leftVolume = volumeOf(left);
  const rightVolume = volumeOf(right);
  if (leftVolume && rightVolume && leftVolume !== rightVolume) return false;

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
  volumeOf,
  concentrationOf,
  modifierOf,
  isSet,
  identityTokens,
  tokenScore,
  samePerfume,
};
