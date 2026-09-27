"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, ApiError, productImageCandidates } from "@/shared/api/client";
import type { ApiPrice, ApiProduct, Comparison, ProductDetailResult } from "@/shared/api/types";
import { Icon } from "@/shared/components/Icon";
import { useImageFallback } from "@/shared/hooks/useImageFallback";
import { FavoriteButton } from "./FavoriteButton";
import { PriceHistoryChart } from "./PriceHistoryChart";
import styles from "./ProductDetail.module.css";

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
  ABC: "https://www.abc.cl",
  Preunic: "https://preunic.cl",
  "L'Odoro": "https://www.lodoro.cl",
  "Le Paris Parfums": "https://leparisparfums.com",
  "La Polar": "https://www.lapolar.cl",
};

const noteIconFor = (family: string): "leaf" | "tree" | "flower" =>
  family.includes("Amader") ? "tree" : family.includes("Floral") ? "flower" : "leaf";

const noteToneFor = (family: string) => {
  const normalizedFamily = family.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (normalizedFamily.includes("floral")) return "floral";
  if (normalizedFamily.includes("amader")) return "woody";
  if (normalizedFamily.includes("citr")) return "citrus";
  if (normalizedFamily.includes("frut")) return "fruity";
  if (normalizedFamily.includes("orient") || normalizedFamily.includes("espec")) return "spicy";
  return "fresh";
};

interface ProductDetailProps {
  productId: string;
  /**
   * URL de vuelta al catálogo (incluye página y filtros activos).
   * Si no se pasa, vuelve a /dashboard sin estado.
   */
  backHref?: string;
}

export function ProductDetail({ productId, backHref = "/dashboard" }: ProductDetailProps) {
  const [detailResult, setDetailResult] = useState<ProductDetailResult | null>(null);
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [prices, setPrices] = useState<ApiPrice[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [similar, setSimilar] = useState<Comparison[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const result = await api.productPrices(productId);
        setDetailResult(result);
        setProduct(result.product);
        setPrices(result.prices);
        // Si está en una sola tienda, se buscan otras versiones que sí se comparan.
        const storeCount = new Set(result.prices.map(price => price.storeId || price.storeName)).size;
        setSimilar([]);
        if (storeCount < 2) api.similarProducts(productId).then(setSimilar).catch(() => setSimilar([]));
      } catch (reason) {
        setError(reason instanceof ApiError ? reason.message : "No se pudo cargar el perfume.");
      } finally { setLoading(false); }
    })();
  }, [productId]);

  const sortedPrices = useMemo(() => {
    const cheapestByStore = new Map<string, ApiPrice>();
    for (const price of prices) {
      const storeKey = price.storeId || price.storeName;
      const current = cheapestByStore.get(storeKey);
      if (!current || price.price < current.price) cheapestByStore.set(storeKey, price);
    }
    return [...cheapestByStore.values()].sort((a, b) => a.price - b.price);
  }, [prices]);

  const imageCandidates = useMemo(() => (product ? productImageCandidates(product) : []), [product]);
  const { image, markFailed } = useImageFallback(imageCandidates);

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

      {/* Layout de 2 columnas perfeccionado: Columna izquierda (Visual/Notas/Gráfico) + Columna derecha (Info/Tiendas) */}
      <section className={styles.productGrid}>
        {/* Columna Izquierda: Imagen + Descripción + Perfil Olfativo + Gráfico de Precios */}
        <div className={styles.leftCol}>
          {/* Imagen del perfume */}
          <div className={styles.visual}>
            {image
              ? <Image
                  src={image}
                  unoptimized
                  alt={`${product.name} de ${product.brand}`}
                  fill
                  priority
                  sizes="(max-width: 900px) 100vw, 45vw"
                  onError={() => markFailed(image)}
                />
              : <div className={styles.visualPlaceholder}><span>FF</span></div>}
          </div>

          {/* Descripción de la fragancia */}
          <div className={styles.perfumeDescription}>
            <h3>Acerca de esta fragancia</h3>
            <p>
              {product.description && product.description.trim().length > 5
                ? product.description
                : `${product.name} ${product.brand && product.brand !== "Sin marca" ? `de ${product.brand}` : ""} ofrece una experiencia olfativa distinguida y refinada.`}
            </p>
          </div>

          {/* Notas olfativas detalladas */}
          {product.olfactoryNotes && product.olfactoryNotes.length > 0 && (
            <section className={styles.notesSection} aria-labelledby="olfactory-notes-title">
              <div className={styles.notesHeading}>
                <div>
                  <p className={styles.sectionKicker}>Perfil olfativo</p>
                  <h3 id="olfactory-notes-title">Notas que definen esta fragancia</h3>
                </div>
                <span className={styles.noteCount}>{product.olfactoryNotes.length} notas</span>
              </div>
              <div className={styles.notesGrid}>
                {product.olfactoryNotes.map((note) => (
                  <article key={note.id} className={`${styles.noteBadge} ${styles[`note${noteToneFor(note.family)[0].toUpperCase()}${noteToneFor(note.family).slice(1)}`]}`}>
                    <span className={styles.noteIcon} aria-hidden="true"><Icon name={noteIconFor(note.family)} size={20} /></span>
                    <div>
                      <strong>{note.name}</strong>
                      <small>{note.family}</small>
                      {note.description && <p>{note.description}</p>}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* Historial y tendencia de precios */}
          <PriceHistoryChart
            history30d={detailResult?.priceHistory30d}
            history90d={detailResult?.priceHistory}
            opportunity={detailResult?.opportunity}
            currentPrice={sortedPrices[0]?.price || product.basePrice}
          />
        </div>

        {/* Columna Derecha: Título/Info principal + Comparativa de Tiendas */}
        <div className={styles.rightCol}>
          {/* Info del producto */}
          <div className={styles.info}>
            <p className="eyebrow">{product.brand}</p>
            <h1>{product.name}</h1>
            <p className={styles.unit}>
              {[product.unit, product.gender].filter(Boolean).join(" · ")}
            </p>

            <div className={`${styles.matchStatus} ${hasComparison ? styles.matchConfirmed : styles.matchPending}`}>
              <span aria-hidden="true">{hasComparison ? "✓" : "!"}</span>
              <div>
                <strong>{hasComparison ? `Comparado en ${sortedPrices.length} tiendas` : "Disponible en 1 tienda"}</strong>
                <small>{hasComparison
                  ? "Verificamos que es el mismo perfume, formato y concentración."
                  : `Por ahora solo lo encontramos en ${sortedPrices[0]?.storeName ?? "una tienda"}.`}</small>
              </div>
            </div>

            {product.isSet && (
              <div className={styles.tags} style={{ marginTop: "16px" }}>
                <span>Set / Kit</span>
              </div>
            )}

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

          {!hasComparison && similar.length > 0 && (
            <section className={styles.similarPanel} aria-labelledby="similar-title">
              <p className="eyebrow">Sí se pueden comparar</p>
              <h2 id="similar-title">Otras versiones de este perfume</h2>
              <p>Mismo perfume en otro tamaño o concentración, disponible en varias tiendas.</p>
              <div className={styles.similarList}>
                {similar.map(item => (
                  <Link key={item.product.id} href={`/perfumes/${item.product.id}`} className={styles.similarItem}>
                    <strong>{item.product.name}</strong>
                    <small>Comparado en {item.product.matchedStores ?? item.prices.length} tiendas{item.product.unit ? ` · ${item.product.unit}` : ""}</small>
                    {item.minPrice ? <span>desde {money.format(item.minPrice)}</span> : null}
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
