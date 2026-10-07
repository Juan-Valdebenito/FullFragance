import type { MetadataRoute } from "next";
import { GUIDES } from "@/features/guides/guides";

const SITE_URL = "https://fullfragance.cl";

// El catálogo se actualiza una vez al día; no hace falta
// regenerar el sitemap en cada crawl de Google.
export const revalidate = 3600;

function apiUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api").replace(/\/$/, "");
}

async function fetchProductIds(): Promise<string[]> {
  try {
    // Sólo perfumes en 2+ tiendas: son los que se indexan (ver perfumes/[id]).
    const res = await fetch(`${apiUrl()}/catalog/ids?minStores=2`, { next: { revalidate } });
    if (!res.ok) return [];
    const data = (await res.json()) as { ids: string[] };
    return data.ids;
  } catch {
    // Si el backend está despertando (cold start del plan free), no rompemos
    // el sitemap: Google reintentará en el próximo crawl.
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/dashboard`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/guias`, changeFrequency: "weekly", priority: 0.8 },
    ...GUIDES.map(guide => ({
      url: `${SITE_URL}/guias/${guide.slug}`,
      lastModified: guide.updated ?? guide.published,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    { url: `${SITE_URL}/como-comparamos`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/sobre-nosotros`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/politica-de-datos`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/politica-de-uso`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const productIds = await fetchProductIds();
  const productEntries: MetadataRoute.Sitemap = productIds.map((id) => ({
    url: `${SITE_URL}/perfumes/${id}`,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [...staticEntries, ...productEntries];
}
