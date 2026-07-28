"use client";
import { useEffect, useState } from "react";
import { api, ApiError, productImageUrl } from "@/shared/api/client";
import type { Recommendation } from "@/shared/api/types";
import type { Product } from "../domain/product";
import { ProductCard } from "./ProductCard";
import styles from "./catalog.module.css";
const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const stores: Record<string, string> = {
  "falabella-cl": "Falabella",
  "ripley-cl": "Ripley",
  "alisha-cl": "Alisha Perfumes",
  "silk-cl": "Silk Perfumes",
  "elite-cl": "Elite Perfumes",
  "cosmetic-cl": "Cosmetic",
};
function adapt(item: Recommendation): Product {
  const prices = (item.product.offers || [])
    .filter(offer => offer.price > 0)
    .sort((a, b) => a.price - b.price)
    .map((offer, index) => ({ id: `${offer.source}-${offer.sku}`, store: stores[offer.source] || offer.source, price: money.format(offer.price), offer: index === 0 }));
  return {
    id: item.product.id,
    aliases: item.product.aliases,
    brand: item.product.brand,
    name: item.product.name,
    size: item.product.unit,
    notes: item.matchedNotes.length ? item.matchedNotes.map(note => note.name) : [item.product.category],
    image: productImageUrl(item.product.imageUrl),
    badge: item.score
      ? `Match ${Math.min(99, Math.round(item.score * 20))}%`
      : item.product.source && stores[item.product.source]
        ? "Dato scraper"
        : "Popular",
    prices: prices.length ? prices : item.product.basePrice > 0 ? [{ store: "Precio disponible", price: money.format(item.product.basePrice) }] : [],
  };
}

export function RecommendationProfile() {
  const [items, setItems] = useState<Recommendation[]>([]);
  useEffect(() => { api.recommendations().then(data => setItems(data.recommendations)).catch(() => setItems([])); }, []);
  const families = items
    .flatMap(item => item.matchedNotes.map(note => note.family))
    .reduce<Record<string, number>>((scores, family) => ({ ...scores, [family]: (scores[family] || 0) + 1 }), {});
  const profile = Object.entries(families).sort((a, b) => b[1] - a[1]).slice(0, 2);
  return <aside>
    <span>Tu perfil olfativo</span>
    <h2>{profile.length ? profile.map(([family]) => family).join(" · ") : "Completa tu test"}</h2>
    <div>{profile.map(([family, score], index) => <i key={family} title={family} style={{ width: `${Math.max(42, 100 - index * 24 - score)}%` }}/>)}</div>
    <small>{profile.length ? "Calculado desde tus respuestas y el catálogo actual." : "Califica tus notas favoritas para personalizar esta selección."}</small>
  </aside>;
}
export function RecommendationsGrid({ className }: { className?: string }) {
  const [items, setItems] = useState<Recommendation[]>([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true);
  useEffect(() => { api.recommendations().then(data => setItems(data.recommendations)).catch(reason => setError(reason instanceof ApiError ? reason.message : "No se pudieron cargar tus recomendaciones.")).finally(() => setLoading(false)); }, []);
  if (loading) return <p className={styles.empty}>Preparando tu selección…</p>;
  if (error) return <p className={styles.error} role="alert">{error}</p>;
  return <div className={className}>{items.map(item => <ProductCard key={item.product.id} product={adapt(item)} recommendation/>)}</div>;
}
