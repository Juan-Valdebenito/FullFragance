import type { Metadata } from "next";
import { Header } from "@/shared/components/Header";
import { Footer } from "@/shared/components/Footer";
import { AdBanner } from "@/shared/components/AdBanner";
import { AdSidebarLayout } from "@/shared/components/AdSidebarLayout";
import { ProductDetail } from "@/features/catalog/components/ProductDetail";
import { api, productImageUrl } from "@/shared/api/client";

const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  try {
    const { product, minPrice } = await api.productPrices(id);
    const title = `${product.brand} ${product.name}`.trim();
    const priceText = minPrice > 0 ? ` desde ${money.format(minPrice)}` : "";
    const description = `Compara el precio de ${title}${priceText} entre tiendas verificadas de Chile. ${product.description || ""}`.trim().slice(0, 300);
    const image = productImageUrl(product.imageUrl);
    return {
      title,
      description,
      alternates: { canonical: `/perfumes/${id}` },
      openGraph: {
        type: "website",
        title: `${title} | FullFragrance`,
        description,
        images: image ? [{ url: image }] : undefined,
      },
    };
  } catch {
    // Producto no encontrado o backend despertando (cold start) — metadata
    // generica en vez de romper la pagina.
    return { title: "Detalle de perfume" };
  }
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

  let jsonLd: Record<string, unknown> | null = null;
  try {
    const { product, minPrice, prices } = await api.productPrices(id);
    jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `${product.brand} ${product.name}`.trim(),
      description: product.description,
      brand: { "@type": "Brand", name: product.brand },
      image: productImageUrl(product.imageUrl) || undefined,
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "CLP",
        lowPrice: minPrice || undefined,
        offerCount: prices.length || undefined,
        availability: "https://schema.org/InStock",
      },
    };
  } catch {
    // Sin datos estructurados si el producto no carga; la pagina sigue
    // funcionando igual para el usuario.
  }

  // Validar que backHref apunte al mismo dominio (evitar open redirect)
  let backHref = "/dashboard";
  if (back) {
    try {
      const decoded = decodeURIComponent(back);
      // Solo aceptar rutas relativas (empiezan con /)
      if (decoded.startsWith("/")) backHref = decoded;
    } catch {
      // Si el decode falla, usar el default
    }
  }

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <Header active="catalog" />
      <section className="container" style={{ paddingTop: "18px" }} aria-label="Publicidad">
        <AdBanner
          format="strip"
          slotId={process.env.NEXT_PUBLIC_AD_SLOT_PRODUCT_STRIP}
        />
      </section>
      <AdSidebarLayout left={false} right>
        <ProductDetail productId={id} backHref={backHref} />
      </AdSidebarLayout>
      <Footer />
    </>
  );
}
