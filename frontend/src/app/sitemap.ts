import type { MetadataRoute } from "next";
import type { ApiProduct } from "@/shared/api/types";

const SITE_URL = "https://fullfragance.cl";

// El catálogo se refresca por cron cada varias horas; no hace falta
// regenerar el sitemap en cada crawl de Google.
export const revalidate = 3600;

function apiUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api").replace(/\/$/, "");
}

async function fetchProductIds(): Promise<string[]> {
  try {
    const res = await fetch(`${apiUrl()}/products`, { next: { revalidate } });
    if (!res.ok) return [];
    const data = (await res.json()) as { products: ApiProduct[] };
    return data.products.map((product) => product.id);
  } catch {
    // Si el backend está despertando (cold start del plan free), no rompemos
    // el sitemap: Google reintentará en el próximo crawl.
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/dashboard`, changeFrequency: "hourly", priority: 0.9 },
  ];

  const productIds = await fetchProductIds();
  const productEntries: MetadataRoute.Sitemap = productIds.map((id) => ({
    url: `${SITE_URL}/perfumes/${id}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticEntries, ...productEntries];
}
