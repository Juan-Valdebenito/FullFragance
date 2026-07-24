"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, ApiError, productImageUrl } from "@/shared/api/client";
import type { ApiPrice, ApiProduct, City } from "@/shared/api/types";
import { FavoriteButton } from "./FavoriteButton";
import styles from "./ProductDetail.module.css";

const SANTIAGO: City = { name: "Santiago", country: "Chile", lat: -33.4489, lon: -70.6693 };
const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const stores: Record<string, string> = { Sephora: "https://www.sephora.cl", Falabella: "https://www.falabella.com/falabella-cl", Ripley: "https://simple.ripley.cl", Paris: "https://www.paris.cl", "La Polar": "https://www.lapolar.cl" };

export function ProductDetail({ productId }: { productId: string }) {
  const [product, setProduct] = useState<ApiProduct | null>(null);
  const [prices, setPrices] = useState<ApiPrice[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { (async () => {
    try {
      const user = await api.me();
      const result = await api.productPrices(user.city ?? SANTIAGO, productId);
      setProduct(result.product);
      setPrices(result.prices);
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No se pudo cargar el perfume.");
    } finally { setLoading(false); }
  })(); }, [productId]);

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
  if (error || !product) return <main className={`container ${styles.state}`}><p>{error || "Perfume no encontrado."}</p><Link href="/dashboard">Volver al catálogo</Link></main>;

  return <main className={`container ${styles.main}`}>
    <nav className={styles.breadcrumb}>
      <Link href="/dashboard">Catálogo</Link><span>/</span><span>{product.brand}</span><span>/</span><strong>{product.name}</strong>
    </nav>

    <section className={styles.product}>
      <div className={styles.visual}>
        {product.imageUrl
          ? <Image src={productImageUrl(product.imageUrl) || product.imageUrl} unoptimized={Boolean(productImageUrl(product.imageUrl)?.includes("/api/images/ripley/"))} alt={`${product.name} de ${product.brand}`} fill priority sizes="(max-width: 900px) 100vw, 34vw" />
          : <div className={styles.visualPlaceholder}><span>FF</span></div>}
      </div>

      <div className={styles.info}>
        <p className="eyebrow">{product.brand}</p>
        <h1>{product.name}</h1>
        <p className={styles.unit}>{product.unit} · {product.gender}</p>
        <div className={`${styles.matchStatus} ${hasComparison ? styles.matchConfirmed : styles.matchPending}`}>
          <span aria-hidden="true">{hasComparison ? "✓" : "!"}</span>
          <div>
            <strong>{hasComparison ? "Coincidencia confirmada" : "Comparación pendiente"}</strong>
            <small>{hasComparison
              ? `El backend encontró el mismo perfume en ${sortedPrices.length} tiendas.`
              : "Por ahora este perfume solo fue encontrado en una tienda."}</small>
          </div>
        </div>
        <p className={styles.description}>{product.priceIsMock
          ? "Producto sincronizado con precio demo para pruebas locales."
          : hasComparison
            ? "Comparamos la misma marca, versión, concentración y tamaño antes de juntar las ofertas."
            : "Sincroniza ambas tiendas para buscar una oferta equivalente."}</p>
        <div className={styles.tags}><span>{product.category}</span>{product.notes.map(note => <span key={note}>{note}</span>)}</div>
        <div className={styles.favoriteLine}><FavoriteButton productId={product.id} aliases={product.aliases} large /></div>
      </div>

      <aside className={styles.storePanel}>
        <div className={styles.storePanelHeading}>
          <div><p className="eyebrow">Comparación actual</p><h2>Elige tu tienda</h2></div>
          <span>{sortedPrices.length} {sortedPrices.length === 1 ? "tienda" : "tiendas"}</span>
        </div>
        {sortedPrices.length ? <div className={styles.offerList}>{sortedPrices.map((price, index) => {
          const target = price.productUrl ?? stores[price.storeName] ?? `https://www.google.com/search?q=${encodeURIComponent(`${product.brand} ${product.name} ${price.storeName}`)}`;
          return <article className={`${styles.offerCard} ${index === 0 ? styles.bestOffer : ""}`} key={`${price.storeId}-${price.storeName}`}>
            <div className={styles.offerTop}>
              <strong>{price.storeName}</strong>
              {index === 0 && <em>Mejor precio</em>}
            </div>
            <span className={price.available === false ? styles.noStock : styles.inStock}>{price.available === false ? "Sin stock" : "Disponible online"}</span>
            <strong className={styles.offerPrice}>{money.format(price.price)}</strong>
            <a href={target} target="_blank" rel="noopener noreferrer">Ver en {price.storeName}<span aria-hidden="true">↗</span></a>
          </article>;
        })}</div> : <div className={styles.noOffers}>Todavía no hay precios disponibles.</div>}
        {hasComparison && <div className={styles.savings}><span>Diferencia entre tiendas</span><strong>{money.format(savings)}</strong></div>}
      </aside>
    </section>
  </main>;
}
