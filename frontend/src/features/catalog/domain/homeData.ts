import { api } from "@/shared/api/client";
import type { ApiProduct, DealOfDay } from "@/shared/api/types";
import type { PerfumeSegment } from "./segment";

// El banner y los carruseles de la home piden los mismos datos: cada petición
// se hace una sola vez por carga de página y todos comparten la promesa.
const requests = new Map<string, Promise<unknown>>();

function once<T>(key: string, load: () => Promise<T>): Promise<T> {
  let request = requests.get(key) as Promise<T> | undefined;
  if (!request) {
    request = load();
    // Si falla, se olvida para que una visita posterior pueda reintentar.
    request.catch(() => requests.delete(key));
    requests.set(key, request);
  }
  return request;
}

export const loadFeatured = () => once("featured", () => api.featuredProducts());

export const loadDeals = () => once("deals", () => api.dealsOfDay());

export function loadSegment(segment: PerfumeSegment, pageSize = 6): Promise<ApiProduct[]> {
  return once(`segment:${segment}:${pageSize}`, () =>
    api.searchCatalog(new URLSearchParams({ segment, pageSize: String(pageSize) }))
      .then(result => result.items.map(item => item.product)),
  );
}

export function bestOfferPrice(product: ApiProduct) {
  const prices = (product.offers ?? []).filter(offer => offer.available && offer.price > 0).map(offer => offer.price);
  return prices.length ? Math.min(...prices) : product.basePrice;
}

export type { DealOfDay };
