import type { Metadata } from "next";
import { Header } from "@/shared/components/Header";
import { Footer } from "@/shared/components/Footer";
import { AdBanner } from "@/shared/components/AdBanner";
import { ProductDetail } from "@/features/catalog/components/ProductDetail";

export const metadata: Metadata = { title: "Detalle de perfume | FullFragrance" };

export default async function PerfumePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ back?: string }>;
}) {
  const { id } = await params;
  const { back } = await searchParams;

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
      <Header active="catalog" />
      <section className="container" style={{ paddingTop: "18px" }} aria-label="Publicidad">
        <AdBanner
          format="strip"
          slotId={process.env.NEXT_PUBLIC_AD_SLOT_PRODUCT_STRIP}
        />
      </section>
      <ProductDetail productId={id} backHref={backHref} />
      <Footer />
    </>
  );
}
