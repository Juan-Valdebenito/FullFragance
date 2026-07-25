"use strict";

const STOP_WORDS = new Set([
  "perfume", "fragancia", "hombre", "mujer", "masculino", "femenino", "unisex",
  "eau", "de", "pour", "toilette", "parfum", "edp", "edt", "extract", "extrait",
  "spray", "vaporizador", "ml", "set", "pack", "original",
]);

/**
 * Modificadores que forman parte de la identidad del perfume.
 * Si uno de los productos tiene un modificador y el otro no,
 * NO son el mismo producto aunque el resto de tokens coincida.
 */
const IDENTITY_MODIFIERS = new Set([
  "intense", "intenso", "intenso", "intensamente",
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

  // Umbral general elevado a 0.72 (antes 0.60) para reducir falsos positivos
  return score >= 0.72;
}

module.exports = {
  normalize,
  normalizeBrand,
  volumeOf,
  concentrationOf,
  modifierOf,
  identityTokens,
  tokenScore,
  samePerfume,
};
