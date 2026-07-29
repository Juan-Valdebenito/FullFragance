"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, ApiError, productImageUrl } from "@/shared/api/client";
import type { ApiPrice, ApiProduct, City, ProductDetailResult } from "@/shared/api/types";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import { Icon } from "@/shared/components/Icon";
import { FavoriteButton } from "./FavoriteButton";
import { PriceHistoryChart } from "./PriceHistoryChart";
import styles from "./ProductDetail.module.css";

const SANTIAGO: City = { name: "Santiago", country: "Chile", lat: -33.4489, lon: -70.6693 };
const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const stores: Record<string, string> = {
  Sephora: "https://www.sephora.cl",
  Falabella: "https://www.falabella.com/falabella-cl",
  Ripley: "https://simple.ripley.cl",
  "Alisha Perfumes": "https://alishaperfumes.cl",
  "Silk Perfumes": "https://silkperfumes.cl",
  "Elite Perfumes": "https://www.eliteperfumes.cl",
  Cosmetic: "https://cosmetic.cl",
  Paris: "https://www.paris.cl",
  "La Polar": "https://www.lapolar.cl",
};

const noteIconFor = (family: string): "leaf" | "tree" | "flower" =>
  family.includes("Amader") ? "tree" : family.includes("Floral") ? "flower" : "leaf";

interface ProductDetailProps {
  productId: string;
  /**
   * URL de vuelta al catálogo (incluye página y filtros activos).
   * Si no se pasa, vuelve a /dashboard sin estado.
   */
  backHref?: string;
}

export function ProductDetail({ productId, backHref = "/dashboard" }: ProductDetailProps) {
  const optionalSession = useOptionalSession();
  const user = optionalSession?.user ?? null;
  const [detailResult, setDetailResult] = useState<ProductDetailResult | null>(null);
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [prices, setPrices] = useState<ApiPrice[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const result = await api.productPrices(user?.city ?? SANTIAGO, productId);
        setDetailResult(result);
        setProduct(result.product);
        setPrices(result.prices);
      } catch (reason) {
        setError(reason instanceof ApiError ? reason.message : "No se pudo cargar el perfume.");
      } finally { setLoading(false); }
    })();
  }, [productId, user?.city]);

  const sortedPrices = useMemo(() => {
    const cheapestByStore = new Map<string, ApiPrice>();
    for (const price of prices) {
      const storeKey = price.storeId || price.storeName;
      const current = cheapestByStore.get(storeKey);
      if (!current || price.price < current.price) cheapestByStore.set(storeKey, price);
    }
    return [...cheapestByStore.values()].sort((a, b) => a.price - b.price);
  }, [prices]);

  const hasComparison = sortedPrices.length > 1;
  const savings = hasComparison ? sortedPrices[sortedPrices.length - 1].price - sortedPrices[0].price : 0;

  if (loading) return <main className={`container ${styles.state}`}>Cargando perfume…</main>;
  if (error || !product) return (
    <main className={`container ${styles.state}`}>
      <p>{error || "Perfume no encontrado."}</p>
      <Link href={backHref}>Volver al catálogo</Link>
    </main>
  );

  return (
    <main className={`container ${styles.main}`}>
      {/* Breadcrumb con vuelta al estado exacto del catálogo */}
      <nav className={styles.breadcrumb}>
        <Link href={backHref}>Catálogo</Link>
        <span>/</span>
        <span>{product.brand}</span>
        <span>/</span>
        <strong>{product.name}</strong>
      </nav>

      <section className={styles.product}>
        {/* Imagen */}
        <div className={styles.visual}>
          {product.imageUrl && !imgError
            ? <Image
                src={productImageUrl(product.imageUrl) || product.imageUrl}
                unoptimized
                alt={`${product.name} de ${product.brand}`}
                fill
                priority
                sizes="(max-width: 900px) 100vw, 34vw"
                onError={() => setImgError(true)}
              />
            : <div className={styles.visualPlaceholder}><span>FF</span></div>}
        </div>

        {/* Info del producto */}
        <div className={styles.info}>
          <p className="eyebrow">{product.brand}</p>
          <h1>{product.name}</h1>
          <p className={styles.unit}>{product.unit} · {product.gender}</p>

          <div className={`${styles.matchStatus} ${hasComparison ? styles.matchConfirmed : styles.matchPending}`}>
            <span aria-hidden="true">{hasComparison ? "✓" : "!"}</span>
            <div>
              <strong>{hasComparison ? "Coincidencia verificada" : "Opción única disponible"}</strong>
              <small>{hasComparison
                ? `Fragancia identificada y verificada en ${sortedPrices.length} tiendas de perfumería.`
                : "Esta fragancia se encuentra disponible en 1 tienda verificada por el momento."}</small>
            </div>
          </div>

          {/* Descripción técnica/emocional de la fragancia */}
          {product.description && (
            <div className={styles.perfumeDescription}>
              <h3>Acerca de esta fragancia</h3>
              <p>{product.description}</p>
            </div>
          )}

          {/* Notas olfativas detalladas */}
          {product.olfactoryNotes && product.olfactoryNotes.length > 0 && (
            <div className={styles.notesSection}>
              <h3>Notas olfativas principales</h3>
              <div className={styles.notesGrid}>
                {product.olfactoryNotes.map((note) => (
                  <div key={note.id} className={styles.noteBadge} title={note.description}>
                    <Icon name={noteIconFor(note.family)} size={18} />
                    <div>
                      <strong>{note.name}</strong>
                      <small>{note.family}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className={styles.tags} style={{ marginTop: "16px" }}>
            <span>{product.category}</span>
            {product.isSet && <span>Set / Kit</span>}
          </div>

          {/* Componente Gráfico de Historial e Inferencia de Tendencias de Precios */}
          <PriceHistoryChart
            history30d={detailResult?.priceHistory30d}
            history90d={detailResult?.priceHistory}
            opportunity={detailResult?.opportunity}
            currentPrice={sortedPrices[0]?.price || product.basePrice}
          />

          <div className={styles.favoriteLine}>
            <FavoriteButton productId={product.id} aliases={product.aliases} large />
          </div>
        </div>

        {/* Panel de tiendas */}
        <aside className={styles.storePanel}>
          <div className={styles.storePanelHeading}>
            <div>
              <p className="eyebrow">Comparativa de precios</p>
              <h2>Elige tu tienda</h2>
            </div>
            <span>{sortedPrices.length} {sortedPrices.length === 1 ? "tienda" : "tiendas"}</span>
          </div>

          {sortedPrices.length ? (
            <div className={styles.offerList}>
              {sortedPrices.map((price, index) => {
                const target = price.productUrl
                  ?? stores[price.storeName]
                  ?? `https://www.google.com/search?q=${encodeURIComponent(`${product.brand} ${product.name} ${price.storeName}`)}`;
                return (
                  <article
                    className={`${styles.offerCard} ${index === 0 ? styles.bestOffer : ""}`}
                    key={`${price.storeId}-${price.storeName}`}
                  >
                    <div className={styles.offerTop}>
                      <strong>{price.storeName}</strong>
                      {index === 0 && <em>Mejor precio</em>}
                    </div>
                    <span className={price.available === false ? styles.noStock : styles.inStock}>
                      {price.available === false ? "Sin stock" : "Disponible online"}
                    </span>
                    <strong className={styles.offerPrice}>{money.format(price.price)}</strong>
                    <a href={target} target="_blank" rel="noopener noreferrer">
                      <span>Ir a tienda</span>
                      <span aria-hidden="true">↗</span>
                    </a>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className={styles.noOffers}>Todavía no hay precios disponibles.</div>
          )}

          {hasComparison && (
            <div className={styles.savings}>
              <span>Ahorro máximo entre tiendas</span>
              <strong>{money.format(savings)}</strong>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}
