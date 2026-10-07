import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/shared/components/Header";
import { Footer } from "@/shared/components/Footer";
import { AdBanner } from "@/shared/components/AdBanner";
import { AdSidebarLayout } from "@/shared/components/AdSidebarLayout";
import { ProductDetail } from "@/features/catalog/components/ProductDetail";
import { api, ApiError, productImageUrl } from "@/shared/api/client";
import type { ProductDetailResult } from "@/shared/api/types";

const SITE_URL = "https://fullfragance.cl";
const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

type ProductLoad = { data: ProductDetailResult | null; status: number };

// generateMetadata y la página comparten esta llamada: cache() la hace una
// sola vez por request.
const loadProduct = cache(async (id: string): Promise<ProductLoad> => {
  try {
    return { data: await api.productPrices(id), status: 200 };
  } catch (reason) {
    return { data: null, status: reason instanceof ApiError ? reason.status : 0 };
  }
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const { data } = await loadProduct(id);

  // Producto inexistente o backend despertando (cold start): sin indexar, para
  // que Google no guarde una ficha vacía.
  if (!data) return { title: "Detalle de perfume", robots: { index: false } };

  const { product, minPrice } = data;
  const title = `${product.brand} ${product.name}`.trim();
  const priceText = minPrice > 0 ? ` desde ${money.format(minPrice)}` : "";
  const description = `Compara el precio de ${title}${priceText} entre tiendas verificadas de Chile. ${product.description || ""}`.trim().slice(0, 300);
  const image = productImageUrl(product.imageUrl);
  const url = `/perfumes/${id}`;
  // Con una sola tienda la ficha no compara nada y repite la página de esa
  // tienda: queda fuera del índice (y del sitemap) pero sigue enlazable.
  const storeCount = product.matchedStores ?? new Set(data.prices.map(price => price.storeName)).size;
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: storeCount < 2 ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "website",
      locale: "es_CL",
      siteName: "FullFragance",
      url,
      title: `${title} | FullFragance`,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: `${title} | FullFragance`,
      description,
      images: image ? [image] : undefined,
    },
  };
}

function structuredData(id: string, { product, prices }: ProductDetailResult) {
  const url = `${SITE_URL}/perfumes/${id}`;
  const name = `${product.brand} ${product.name}`.trim();
  const buyable = prices.filter(price => price.available !== false && price.price > 0);
  const pool = buyable.length ? buyable : prices.filter(price => price.price > 0);
  const amounts = pool.map(price => price.price);

  const productLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    url,
    description: product.description || undefined,
    brand: { "@type": "Brand", name: product.brand },
    image: productImageUrl(product.imageUrl) || undefined,
    offers: amounts.length
      ? {
          "@type": "AggregateOffer",
          priceCurrency: "CLP",
          lowPrice: Math.min(...amounts),
          highPrice: Math.max(...amounts),
          offerCount: pool.length,
          availability: buyable.length ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        }
      : undefined,
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Catálogo", item: `${SITE_URL}/dashboard` },
      { "@type": "ListItem", position: 2, name: product.brand, item: `${SITE_URL}/dashboard?brand=${encodeURIComponent(product.brand)}` },
      { "@type": "ListItem", position: 3, name, item: url },
    ],
  };

  // Escapar "<" evita que una descripción con "</script>" rompa la página.
  return JSON.stringify([productLd, breadcrumbLd]).replace(/</g, "\\u003c");
}

export default async function PerfumePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ back?: string }>;
}) {
  const { id } = await params;
  const { back } = await searchParams;
  const { data, status } = await loadProduct(id);

  if (status === 404) notFound();

  // Validar que backHref apunte al mismo dominio (evitar open redirect)
  let backHref = "/dashboard";
  if (back) {
    try {
      const decoded = decodeURIComponent(back);
      // Solo rutas relativas del propio sitio ("//otro.com" sería otro dominio)
      if (decoded.startsWith("/") && !decoded.startsWith("//")) backHref = decoded;
    } catch {
      // Si el decode falla, usar el default
    }
  }

  return (
    <>
      {data && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData(id, data) }} />
      )}
      <Header active="catalog" />
      <section className="container" style={{ paddingTop: "18px" }} aria-label="Publicidad">
        <AdBanner
          format="strip"
          slotId={process.env.NEXT_PUBLIC_AD_SLOT_PRODUCT_STRIP}
        />
      </section>
      <AdSidebarLayout left={false} right>
        {/* Con datos del servidor la ficha llega completa en el HTML (SEO);
            si el backend no respondió, el componente reintenta en el navegador. */}
        <ProductDetail key={id} productId={id} backHref={backHref} initialResult={data} />
      </AdSidebarLayout>
      <Footer />
    </>
  );
}
