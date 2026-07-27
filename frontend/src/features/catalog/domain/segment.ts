export const perfumeSegments = [
  { value: "", label: "Todos", title: "Catálogo de fragancias" },
  { value: "designer", label: "Diseñador", title: "Perfumes de diseñador" },
  { value: "niche", label: "Nicho", title: "Perfumes de nicho" },
  { value: "arabic", label: "Árabes", title: "Perfumes árabes" },
] as const;

export type PerfumeSegment = Exclude<(typeof perfumeSegments)[number]["value"], "">;

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

function normalizeBrand(brand: string) {
  return brand
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

export function perfumeSegmentForBrand(brand: string): PerfumeSegment {
  const normalized = normalizeBrand(brand);
  if (arabicBrands.has(normalized)) return "arabic";
  if (nicheBrands.has(normalized)) return "niche";
  return "designer";
}

export function isPerfumeSegment(value: string): value is PerfumeSegment {
  return perfumeSegments.some(segment => segment.value === value && segment.value !== "");
}
