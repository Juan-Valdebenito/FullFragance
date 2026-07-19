"use client";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/shared/api/client";
import type { Recommendation } from "@/shared/api/types";
import type { Product } from "../domain/product";
import { recommendations as visuals } from "../data/products";
import { ProductCard } from "./ProductCard";
import styles from "./catalog.module.css";
const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
function adapt(item: Recommendation, index: number): Product { const image = visuals[index % visuals.length].image; return { id: item.product.id, brand: item.product.brand, name: item.product.name, size: item.product.unit, notes: item.matchedNotes.length ? item.matchedNotes.map(note => note.name) : [item.product.category], image, badge: item.score ? `Match ${Math.min(99, Math.round(item.score * 20))}%` : "Popular", prices: [{ store: "Precio referencial", price: money.format(item.product.basePrice) }] }; }
export function RecommendationsGrid({ className }: { className?: string }) {
  const [items, setItems] = useState<Recommendation[]>([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { api.recommendations().then(data => setItems(data.recommendations)).catch(reason => setError(reason instanceof ApiError ? reason.message : "No se pudieron cargar tus recomendaciones.")).finally(() => setLoading(false)); }, []);
  if (loading) return <p className={styles.empty}>Preparando tu selección…</p>;
  if (error) return <p className={styles.error} role="alert">{error}</p>;
  return <div className={className}>{items.map((item, index) => <ProductCard key={item.product.id} product={adapt(item, index)} recommendation/>)}</div>;
}
