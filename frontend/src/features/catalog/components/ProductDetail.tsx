"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, ApiError } from "@/shared/api/client";
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

  const sortedPrices = useMemo(() => [...prices].sort((a, b) => a.price - b.price), [prices]);

  if (loading) return <main className={`container ${styles.state}`}>Cargando perfume…</main>;
  if (error || !product) return <main className={`container ${styles.state}`}><p>{error || "Perfume no encontrado."}</p><Link href="/dashboard">Volver al catálogo</Link></main>;

  return <main className={`container ${styles.main}`}>
    <nav className={styles.breadcrumb}><Link href="/dashboard">Catálogo</Link><span>/</span><span>{product.brand}</span><span>/</span><strong>{product.name}</strong></nav>
    <section className={styles.product}><div className={styles.visual}>{product.imageUrl ? <Image src={product.imageUrl} alt={`${product.name} de ${product.brand}`} fill priority sizes="(max-width: 800px) 100vw, 50vw" /> : <div className={styles.visualPlaceholder}><span>FF</span></div>}</div><div className={styles.info}><p className="eyebrow">{product.brand}</p><h1>{product.name}</h1><p className={styles.unit}>{product.unit} · {product.gender}</p><p className={styles.description}>{product.priceIsMock ? "Producto sincronizado desde Falabella con precio demo para pruebas locales." : product.source === "falabella-cl" ? "Producto sincronizado desde Falabella. Si el detalle fue bloqueado, el precio se completará cuando la fuente vuelva a responder." : "Una fragancia seleccionada para comparar precios disponibles."}</p><div className={styles.tags}><span>{product.category}</span>{product.notes.map(note => <span key={note}>{note}</span>)}</div><div className={styles.best}><div><small>{product.priceIsMock ? "Precio demo" : "Mejor precio disponible"}</small><strong>{sortedPrices[0] ? money.format(sortedPrices[0].price) : "Precio pendiente"}</strong><span>{sortedPrices[0]?.storeName ?? (product.source === "falabella-cl" ? "Falabella" : "Sin tienda")}</span></div><FavoriteButton productId={product.id} large /></div></div></section>
    <section className={styles.comparison}><div className={styles.title}><div><p className="eyebrow">Comparación actual</p><h2>Precios por tienda</h2></div><span>{sortedPrices.length} tiendas encontradas</span></div><div className={styles.table}><div className={styles.tableHead}><span>Tienda</span><span>Disponibilidad</span><span>Precio</span><span /></div>{sortedPrices.length ? sortedPrices.map((price, index) => <div className={styles.row} key={price.storeId}><div><strong>{price.storeName}</strong>{index === 0 && <em>Mejor precio</em>}</div><span className={styles.stock}>{price.available === false ? "Sin stock" : "Disponible"}</span><strong>{money.format(price.price)}</strong><a href={price.productUrl ?? stores[price.storeName] ?? `https://www.google.com/search?q=${encodeURIComponent(`${product.brand} ${product.name} ${price.storeName}`)}`} target="_blank" rel="noopener noreferrer">Ver en tienda</a></div>) : <div className={styles.row}><div><strong>Falabella</strong></div><span className={styles.stock}>Pendiente</span><strong>Sin precio</strong>{product.sourceUrl ? <a href={product.sourceUrl} target="_blank" rel="noopener noreferrer">Ver en tienda</a> : <span />}</div>}</div></section>
  </main>;
}
