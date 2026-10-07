export type User = { id: string; name: string; email: string; role?: "admin" | "customer"; hasPassword?: boolean; favorites: string[]; scentPreferences: { scores: Record<string, number> } | null };
export type ApiOffer = { source: string; sku: string; price: number; available: boolean; productUrl: string; priceIsMock?: boolean };
export type CatalogStats = { products: number; comparable: number; stores: string[] };
export type ApiNote = { id: string; name: string; family: string; description: string };
export type ApiProduct = {
  id: string;
  name: string;
  brand: string;
  unit: string;
  basePrice: number;
  category: string;
  gender: string;
  notes: string[];
  /** true si las notas se dedujeron del nombre: sirven para recomendar, no se muestran. */
  notesInferred?: boolean;
  olfactoryNotes?: ApiNote[];
  description?: string;
  source?: string;
  sourceUrl?: string | null;
  imageUrl?: string | null;
  imageUrls?: string[];
  available?: boolean;
  priceIsMock?: boolean;
  isSet?: boolean;
  matchedStores?: number;
  aliases?: string[];
  offers?: ApiOffer[];
};
export type DealOfDay = {
  deal: ApiProduct;
  minPrice: number;
  maxPrice: number;
  savings: number;
  savingsPct: number;
};
export type ApiPrice = { storeId: string; storeName: string; price: number; available?: boolean; productUrl?: string };

export type ProductDetailResult = {
  product: ApiProduct;
  prices: ApiPrice[];
  minPrice: number;
  maxPrice: number;
};

export type Comparison = {
  product: ApiProduct;
  prices: ApiPrice[];
  minPrice: number | null;
  maxPrice: number | null;
};

export type CatalogSearchResult = {
  items: Comparison[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /** Perfumes en 2+ tiendas dentro de los filtros activos (sin el de comparación). */
  comparableTotal: number;
  /** Resultados con los filtros activos, ignorando el filtro de comparación. */
  unfilteredTotal: number;
  facets: { brands: string[]; categories: string[]; stores: string[] };
  /** Filtros que el backend dedujo del texto ("hombre", "bajo 30 mil"). */
  intent?: IntentChip[];
  /** Texto que quedó tras sacar la intención. */
  text?: string;
  /** Búsqueda corregida si el texto tenía errores de tipeo. */
  correctedQuery?: string | null;
};

export type IntentChip = { key: "segment" | "gender" | "minPrice" | "maxPrice" | "presentation" | "sort"; value: string; label: string };

export type SuggestProduct = {
  id: string;
  name: string;
  brand: string;
  imageUrl?: string | null;
  imageUrls?: string[];
  minPrice: number;
  storeCount: number;
};

export type SuggestResult = {
  query: string;
  text: string;
  correctedQuery: string | null;
  chips: IntentChip[];
  total: number;
  brands: { name: string; count: number }[];
  products: SuggestProduct[];
};

export type Recommendation = { product: ApiProduct; score: number | null; matchedNotes: ApiNote[]; reason: string };
export type SyncJob = { id: string; source: string; status: "running" | "completed" | "failed"; currentPage: number; totalPages: number; scanned: number; imported: number; targetProducts: number | null; error: string | null };
export type AdminMetrics = {
  users: { total: number; newToday: number; newLast7Days: number };
  views: { today: number; last7Days: number; allTime: number; series: { date: string; views: number }[]; monthly: { month: string; views: number }[]; topPages: { page: string; views: number }[] };
  ads: { currentMonth: string; revenueCLP: number; source: "manual"; connected: boolean };
};
