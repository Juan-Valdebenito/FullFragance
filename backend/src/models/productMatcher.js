const STOP_WORDS = new Set([
  "perfume", "fragancia", "hombre", "mujer", "masculino", "femenino", "unisex",
  "eau", "de", "pour", "toilette", "parfum", "edp", "edt", "extract", "extrait",
  "spray", "vaporizador", "ml", "set", "pack", "original",
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

function volumeOf(product) {
  const value = `${product.presentation || ""} ${product.name || ""}`;
  const match = normalize(value).match(/\b(\d+(?:[.,]\d+)?)\s*ml\b/);
  return match ? Number(match[1].replace(",", ".")) : null;
}

function concentrationOf(product) {
  const value = normalize(product.name);
  if (/\b(edp|eau de parfum)\b/.test(value)) return "edp";
  if (/\b(edt|eau de toilette)\b/.test(value)) return "edt";
  if (/\b(extrait|extracto)\b/.test(value)) return "extrait";
  if (/\b(colonia|edc|eau de cologne)\b/.test(value)) return "edc";
  return null;
}

function identityTokens(product) {
  const brandTokens = new Set(normalizeBrand(product.brand).split(" ").filter(Boolean));
  return normalize(product.name)
    .split(" ")
    .filter((token) => token && !STOP_WORDS.has(token) && !brandTokens.has(token) && !/^\d+(?:ml|g|oz)?$/.test(token));
}

function tokenScore(left, right) {
  const a = new Set(identityTokens(left));
  const b = new Set(identityTokens(right));
  if (!a.size || !b.size) return 0;
  const common = [...a].filter((token) => b.has(token)).length;
  return common / Math.max(a.size, b.size);
}

function samePerfume(left, right) {
  if (!left || !right || left.source === right.source) return false;
  const leftBrand = normalizeBrand(left.brand);
  const rightBrand = normalizeBrand(right.brand);
  if (!leftBrand || !rightBrand || leftBrand !== rightBrand) return false;

  const leftVolume = volumeOf(left);
  const rightVolume = volumeOf(right);
  if (leftVolume && rightVolume && leftVolume !== rightVolume) return false;

  const leftConcentration = concentrationOf(left);
  const rightConcentration = concentrationOf(right);
  if (leftConcentration && rightConcentration && leftConcentration !== rightConcentration) return false;

  return tokenScore(left, right) >= 0.6;
}

module.exports = { normalize, normalizeBrand, volumeOf, concentrationOf, identityTokens, tokenScore, samePerfume };
