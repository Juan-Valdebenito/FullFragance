"use client";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/shared/api/client";
import { useSession } from "@/shared/auth/SessionContext";
import type { Comparison } from "@/shared/api/types";
import { ProductCard } from "./ProductCard";
import { toProduct } from "./CatalogExplorer";
import styles from "./catalog.module.css";
const DEFAULT_CITY = { name: "Santiago", country: "Chile", lat: -33.4489, lon: -70.6693 };
export function FavoritesCatalog({ className }: { className?: string }) { const { user } = useSession(); const [items,setItems] = useState<Comparison[]>([]); const [loading,setLoading] = useState(true); const [error,setError] = useState("");
  useEffect(() => { api.comparisons(user.city ?? DEFAULT_CITY).then(data => setItems(data.filter(item => user.favorites.includes(item.product.id)))).catch(reason => setError(reason instanceof ApiError ? reason.message : "No se pudieron cargar tus favoritos.")).finally(() => setLoading(false)); }, [user.city, user.favorites]);
  if (loading) return <p className={styles.empty}>Cargando tus favoritos…</p>; if (error) return <p className={styles.error}>{error}</p>; if (!items.length) return <div className={styles.emptyState}><span>♡</span><h2>Aún no guardaste perfumes</h2><p>Agrega perfumes desde el catálogo para encontrarlos rápidamente aquí.</p><a href="/dashboard">Explorar catálogo</a></div>;
  return <div className={className}>{items.map(item => <ProductCard key={item.product.id} product={toProduct(item)}/>)}</div>;
}
