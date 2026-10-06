import type { ApiNote, Comparison, Recommendation, SyncJob, User } from "./types";

// Cuando se abre la web desde otro equipo, localhost es ese equipo y no el
// computador que ejecuta el backend. Sin variable de entorno, conservamos el
// hostname actual y sólo cambiamos al puerto de la API.
function apiUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  // Ruta relativa (proxy de desarrollo, ver app/api-proxy): en el navegador
  // va al mismo origen; en el servidor hay que darle el host de Next.
  if (configured?.startsWith("/")) {
    return typeof window !== "undefined" ? configured : `http://localhost:${process.env.PORT ?? 3001}${configured}`;
  }
  if (configured) return configured;
  if (typeof window !== "undefined") return `${window.location.protocol}//${window.location.hostname}:3000/api`;
  return "http://localhost:3000/api";
}
const TOKEN_KEY = "fullfragrance_token";
type RequestOptions = RequestInit & { authenticated?: boolean };
export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }
function token() { return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY); }
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers); headers.set("Content-Type", "application/json");
  if (options.authenticated !== false && token()) headers.set("Authorization", `Bearer ${token()}`);
  let response: Response;
  try { response = await fetch(`${apiUrl()}${path}`, { ...options, headers }); } catch { throw new ApiError("No se pudo conectar con el servidor. Comprueba que el backend esté iniciado.", 0); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.error ?? "Ocurrió un error inesperado.", response.status);
  return data as T;
}
function saveSession(data: { token: string; user: User }) { localStorage.setItem(TOKEN_KEY, data.token); return data.user; }
export const session = { hasToken: () => Boolean(token()), clear: () => localStorage.removeItem(TOKEN_KEY) };
export function productImageUrl(imageUrl?: string | null) {
  if (!imageUrl) return imageUrl;
  if (/https:\/\/(?:rimage|home)\.ripley\.cl\//i.test(imageUrl)) {
    return `${apiUrl()}/images/ripley?url=${encodeURIComponent(imageUrl)}`;
  }
  return imageUrl;
}
export function productImageCandidates(product: { imageUrl?: string | null; imageUrls?: string[] }) {
  return [...new Set([product.imageUrl, ...(product.imageUrls || [])]
    .map(productImageUrl)
    .filter((imageUrl): imageUrl is string => Boolean(imageUrl)))];
}
export const api = {
  login: (body: { email: string; password: string }) => request<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify(body), authenticated: false }).then(saveSession),
  register: (body: { name: string; email: string; password: string }) => request<{ token: string; user: User }>("/auth/register", { method: "POST", body: JSON.stringify(body), authenticated: false }).then(saveSession),
  loginWithGoogle: (payload: { credential: string }) => request<{ token: string; user: User }>("/auth/google", { method: "POST", body: JSON.stringify(payload), authenticated: false }).then(saveSession),
  me: () => request<{ user: User }>("/auth/me").then(data => data.user),
  updateProfile: (body: { name: string }) => request<{ user: User }>("/users/me/profile", { method: "PUT", body: JSON.stringify(body) }).then(data => data.user),
  changePassword: (body: { currentPassword: string; newPassword: string }) => request<{ message: string; token: string }>("/users/me/password", { method: "PUT", body: JSON.stringify(body) }).then(data => { localStorage.setItem(TOKEN_KEY, data.token); return { message: data.message }; }),
  deleteAccount: (confirmation: string) => request<void>("/users/me", { method: "DELETE", body: JSON.stringify({ confirmation }) }),
  // Catálogo completo: sólo para el panel admin (el backend exige rol admin).
  comparisons: (query = "") => request<{ comparison: Comparison[] }>(`/prices?q=${encodeURIComponent(query)}`).then(data => data.comparison),
  comparisonsByIds: (ids: string[]) => request<{ comparison: Comparison[] }>(`/prices?ids=${ids.map(encodeURIComponent).join(",")}`).then(data => data.comparison),
  similarProducts: (productId: string) => request<{ items: Comparison[] }>(`/catalog/similar/${encodeURIComponent(productId)}`).then(data => data.items),
  searchCatalog: (params: URLSearchParams) => request<import("./types").CatalogSearchResult>(`/catalog/search?${params.toString()}`),
  productPrices: (productId: string) => request<import("./types").ProductDetailResult>(`/prices/${productId}`),
  notes: () => request<{ notes: ApiNote[] }>("/catalog/notes").then(data => data.notes),
  trackPageView: (page: string) => request<void>("/analytics/page-view", { method: "POST", body: JSON.stringify({ page }), authenticated: false }),
  adminMetrics: () => request<{ metrics: import("./types").AdminMetrics }>("/analytics/metrics").then(data => data.metrics),
  setAdRevenue: (revenue: number) => request<{ metrics: import("./types").AdminMetrics }>("/analytics/ad-revenue", { method: "PUT", body: JSON.stringify({ revenue }) }).then(data => data.metrics),
  featuredProducts: () => request<{ products: import("./types").ApiProduct[] }>("/catalog/featured").then(data => data.products),
  dealsOfDay: () => request<{ deals: import("./types").DealOfDay[] }>("/catalog/deals-of-day").then(data => data.deals),
  dealOfDay: () => request<{ deal: import("./types").ApiProduct; minPrice: number; maxPrice: number; savings: number; savingsPct: number }>("/catalog/deal-of-day"),
  syncFalabellaPerfumes: () => request<{ job: SyncJob }>("/scrapers/falabella/sync-perfumes", { method: "POST", body: JSON.stringify({ fullCatalog: true }) }),
  syncRipleyPerfumes: () => request<{ job: SyncJob }>("/scrapers/ripley/sync-perfumes", { method: "POST", body: JSON.stringify({ fullCatalog: true }) }),
  syncAlishaPerfumes: () => request<{ job: SyncJob }>("/scrapers/alisha/sync-perfumes", { method: "POST", body: JSON.stringify({ fullCatalog: true }) }),
  syncSilkPerfumes: () => request<{ job: SyncJob }>("/scrapers/silk/sync-perfumes", { method: "POST", body: JSON.stringify({ fullCatalog: true }) }),
  syncElitePerfumes: () => request<{ job: SyncJob }>("/scrapers/elite/sync-perfumes", { method: "POST", body: JSON.stringify({ fullCatalog: true }) }),
  syncCosmeticPerfumes: () => request<{ job: SyncJob }>("/scrapers/cosmetic/sync-perfumes", { method: "POST", body: JSON.stringify({ fullCatalog: true }) }),
  syncParisPerfumes: () => request<{ job: SyncJob }>("/scrapers/paris/sync-perfumes", { method: "POST", body: JSON.stringify({ fullCatalog: true }) }),
  syncAbcPerfumes: () => request<{ job: SyncJob }>("/scrapers/abc/sync-perfumes", { method: "POST", body: JSON.stringify({ fullCatalog: true }) }),
  syncPreunicPerfumes: () => request<{ job: SyncJob }>("/scrapers/preunic/sync-perfumes", { method: "POST", body: JSON.stringify({ fullCatalog: true }) }),
  syncLodoroPerfumes: () => request<{ job: SyncJob }>("/scrapers/lodoro/sync-perfumes", { method: "POST", body: JSON.stringify({ fullCatalog: true }) }),
  syncLeparisPerfumes: () => request<{ job: SyncJob }>("/scrapers/leparis/sync-perfumes", { method: "POST", body: JSON.stringify({ fullCatalog: true }) }),
  syncDreamsPerfumes: () => request<{ job: SyncJob }>("/scrapers/dreams/sync-perfumes", { method: "POST", body: JSON.stringify({ fullCatalog: true }) }),
  syncJob: (jobId: string) => request<{ job: SyncJob }>(`/scrapers/sync-jobs/${jobId}`).then(data => data.job),
  saveQuiz: (scores: Record<string, number>) => request<{ recommendations: Recommendation[] }>("/users/me/scent-quiz", { method: "POST", body: JSON.stringify({ scores }) }),
  recommendations: () => request<{ source: string; recommendations: Recommendation[] }>("/users/me/recommendations"),
  toggleFavorite: (productId: string) => request<{ favorites: string[] }>(`/users/me/favorites/${productId}`, { method: "POST" }),
};
