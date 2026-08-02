export type City = { name: string; country: string; lat: number; lon: number };
export type User = { id: string; name: string; email: string; role?: "admin" | "customer"; hasPassword?: boolean; city: City | null; favorites: string[]; scentPreferences: { scores: Record<string, number> } | null };
export type ApiOffer = { source: string; sku: string; price: number; available: boolean; productUrl: string; priceIsMock?: boolean };
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

export type PriceHistoryPoint = { date: string; price: number };
export type OpportunityTag = {
  code: string;
  label: string;
  type: "great_deal" | "stable" | "trending_up" | "lowest_30" | "lowest_90";
};

export type ProductDetailResult = {
  product: ApiProduct;
  prices: ApiPrice[];
  minPrice: number;
  maxPrice: number;
  priceHistory?: PriceHistoryPoint[];
  priceHistory30d?: PriceHistoryPoint[];
  opportunity?: OpportunityTag;
  stats?: { min30d: number; min90d: number; avg30d: number };
};

export type Comparison = {
  product: ApiProduct;
  prices: ApiPrice[];
  minPrice: number | null;
  maxPrice: number | null;
  opportunity?: OpportunityTag;
};

export type Store = { id: string; chainId: string; name: string; address: string; lat: number; lon: number; website?: string | null; phone?: string | null; openingHours?: string | null; category?: string; osmUrl?: string; distanceKm?: number };
export type Recommendation = { product: ApiProduct; score: number | null; matchedNotes: ApiNote[]; reason: string };
export type SyncJob = { id: string; source: string; status: "running" | "completed" | "failed"; currentPage: number; totalPages: number; scanned: number; imported: number; targetProducts: number | null; error: string | null };
export type AdminMetrics = {
  users: { total: number; newToday: number; newLast7Days: number };
  views: { today: number; last7Days: number; series: { date: string; views: number }[]; topPages: { page: string; views: number }[] };
  ads: { currentMonth: string; revenueCLP: number; source: "manual"; connected: boolean };
};
