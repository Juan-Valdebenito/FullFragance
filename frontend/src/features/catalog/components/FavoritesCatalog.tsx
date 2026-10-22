"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/shared/api/client";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import type { Comparison } from "@/shared/api/types";
import { ProductCard } from "./ProductCard";
import { toProduct } from "./CatalogExplorer";
import styles from "./catalog.module.css";

export function FavoritesCatalog({ className }: { className?: string }) {
  const session = useOptionalSession();
  // Funciona con o sin cuenta: sin cuenta, favorites viene de este navegador.
  const favorites = session?.favorites ?? [];
  const [items, setItems] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // Sin favoritos no hay nada que pedir; el render lo resuelve.
    if (!favorites.length) { setLoading(false); return; }
    // Sólo se piden los perfumes guardados, no el catálogo completo.
    setLoading(true);
    api.comparisonsByIds(favorites)
      .then(setItems)
      .catch(reason => setError(reason instanceof ApiError ? reason.message : "No se pudieron cargar tus favoritos."))
      .finally(() => setLoading(false));
  }, [favorites]);

  if (loading && favorites.length) return <p className={styles.empty}>Cargando tus favoritos…</p>;
  if (error) return <p className={styles.error}>{error}</p>;
  if (!favorites.length || !items.length) {
    return (
      <div className={styles.emptyState}>
        <span>♡</span>
        <h2>Aún no guardaste perfumes</h2>
        <p>Agrega perfumes desde el catálogo para encontrarlos rápidamente aquí.</p>
        <Link href="/dashboard">Explorar catálogo</Link>
      </div>
    );
  }

  return <div className={className}>{items.map(item => <ProductCard key={item.product.id} product={toProduct(item)} />)}</div>;
}
