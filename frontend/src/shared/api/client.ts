import type { ApiNote, City, Comparison, Recommendation, Store, User } from "./types";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/api";
const TOKEN_KEY = "fullfragrance_token";
type RequestOptions = RequestInit & { authenticated?: boolean };
export class ApiError extends Error { constructor(message: string, public status: number) { super(message); } }
function token() { return typeof window === "undefined" ? null : localStorage.getItem(TOKEN_KEY); }
async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers); headers.set("Content-Type", "application/json");
  if (options.authenticated !== false && token()) headers.set("Authorization", `Bearer ${token()}`);
  let response: Response;
  try { response = await fetch(`${API_URL}${path}`, { ...options, headers }); } catch { throw new ApiError("No se pudo conectar con el servidor. Comprueba que el backend esté iniciado.", 0); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.error ?? "Ocurrió un error inesperado.", response.status);
  return data as T;
}
function saveSession(data: { token: string; user: User }) { localStorage.setItem(TOKEN_KEY, data.token); return data.user; }
const cityQuery = (city: City) => new URLSearchParams({ cityName: city.name, lat: String(city.lat), lon: String(city.lon) }).toString();
export const session = { hasToken: () => Boolean(token()), clear: () => localStorage.removeItem(TOKEN_KEY) };
export const api = {
  login: (body: { email: string; password: string }) => request<{ token: string; user: User }>("/auth/login", { method: "POST", body: JSON.stringify(body), authenticated: false }).then(saveSession),
  register: (body: { name: string; email: string; password: string }) => request<{ token: string; user: User }>("/auth/register", { method: "POST", body: JSON.stringify(body), authenticated: false }).then(saveSession),
  me: () => request<{ user: User }>("/auth/me").then(data => data.user),
  setCity: (city: City) => request<{ user: User }>("/users/me/city", { method: "PUT", body: JSON.stringify(city) }).then(data => data.user),
  comparisons: (city: City, query = "") => request<{ comparison: Comparison[] }>(`/prices?${cityQuery(city)}&q=${encodeURIComponent(query)}`).then(data => data.comparison),
  productPrices: (city: City, productId: string) => request<{ product: import("./types").ApiProduct; prices: import("./types").ApiPrice[] }>(`/prices/${productId}?${cityQuery(city)}`),
  stores: (city: City) => request<{ stores: Store[] }>(`/stores?${cityQuery(city)}`).then(data => data.stores),
  notes: () => request<{ notes: ApiNote[] }>("/catalog/notes").then(data => data.notes),
  syncFalabellaPerfumes: (maxProducts = 12) => request<{ results: Array<{ ok: boolean; error?: string }> }>("/scrapers/falabella/sync-perfumes", { method: "POST", body: JSON.stringify({ maxProducts }) }),
  syncRipleyPerfumes: (maxProducts = 12) => request<{ results: Array<{ ok: boolean; error?: string }> }>("/scrapers/ripley/sync-perfumes", { method: "POST", body: JSON.stringify({ maxProducts }) }),
  saveQuiz: (scores: Record<string, number>) => request<{ recommendations: Recommendation[] }>("/users/me/scent-quiz", { method: "POST", body: JSON.stringify({ scores }) }),
  recommendations: () => request<{ source: string; recommendations: Recommendation[] }>("/users/me/recommendations"),
  toggleFavorite: (productId: string) => request<{ favorites: string[] }>(`/users/me/favorites/${productId}`, { method: "POST" }),
};
