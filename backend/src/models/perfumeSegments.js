// Segmentos del catálogo (Diseñador, Nicho, Árabes). Antes vivían sólo en el
// frontend; con la paginación el filtro se aplica aquí. Mantener en sintonía con
// frontend/src/features/catalog/domain/segment.ts, que sólo conserva las etiquetas.

const PERFUME_SEGMENTS = ["designer", "niche", "arabic"];

const arabicBrands = new Set([
  "ADYAN", "AFNAN", "AJMAL", "AL GAZAL", "AL HARAMAIN", "AL WATANIAH",
  "ALHAMBRA", "AMOUAGE", "ANFAR", "ANFAR LONDON", "ARABIYAT", "ARD AL ZAAFARAN",
  "ARMAF", "AFAQ", "ATRALIA", "AZHA", "BLEND OUD", "DUMONT", "EMPER",
  "EMPER PERFUMES", "FRAGANCE WORLD", "FRAGRANCE WORLD", "FRENCH AVENUE",
  "GRANDEUR", "GULF ORCHID", "JO MILANO", "KAYALI", "KHADLAJ", "LATTAFA",
  "MAISON ALHAMBRA", "MAISON ASRAR", "MY PERFUMES", "NUSUK", "ORIENTICA",
  "PARIS CORNER", "RASI", "RASASI", "RAVE", "RAYHAAN", "RIIFFS PARFUMS",
  "SWISS ARABIAN", "THE HOUSE OF OUD", "ZAKAT", "ZIMAYA",
]);

const nicheBrands = new Set([
  "ACQUA DI PARMA", "ATELIER DES ORS", "BOND N9", "BYREDO", "CASAMORATI",
  "CREED", "DIPTYQUE", "ESCENTRIC MOLECULES", "ETAT LIBRE DORANGE",
  "INITIO PARFUMS", "JULIETTE HAS A GUN", "KILIAN", "LE LABO",
  "LIQUIDES IMAGINAIRES", "MALIN + GOETZ", "MANCERA", "MASQUE MILANO",
  "MEMO PARIS", "MILANO FRAGRANZE", "MONTALE PARIS", "MORESQUE", "NISHANE",
  "ORTO PARISI", "PARFUMS DE MARLY", "PENHALIGON'S", "TIZIANA TERENZI",
  "XERJOFF",
]);

function normalizeSegmentBrand(brand) {
  return String(brand || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase();
}

function perfumeSegmentForBrand(brand) {
  const normalized = normalizeSegmentBrand(brand);
  if (arabicBrands.has(normalized)) return "arabic";
  if (nicheBrands.has(normalized)) return "niche";
  return "designer";
}

module.exports = { PERFUME_SEGMENTS, perfumeSegmentForBrand };
