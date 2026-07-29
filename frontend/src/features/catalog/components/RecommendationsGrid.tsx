"use client";
import { useEffect, useState } from "react";
import { api, ApiError, productImageUrl, session } from "@/shared/api/client";
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
  "paris-cl": "Paris",
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
  useEffect(() => {
    if (!session.hasToken()) return;
    api.recommendations().then(data => setItems(data.recommendations)).catch(() => setItems([]));
  }, []);

  const families = items
    .flatMap(item => item.matchedNotes.map(note => note.family))
    .reduce<Record<string, number>>((scores, family) => ({ ...scores, [family]: (scores[family] || 0) + 1 }), {});
  const profile = Object.entries(families).sort((a, b) => b[1] - a[1]).slice(0, 2);

  return (
    <aside>
      <span>Tu perfil olfativo</span>
      <h2>{profile.length ? profile.map(([family]) => family).join(" · ") : "Test Olfativo"}</h2>
      <div>{profile.map(([family, score], index) => <i key={family} title={family} style={{ width: `${Math.max(42, 100 - index * 24 - score)}%` }} />)}</div>
      <small>{profile.length ? "Calculado desde tus respuestas y el catálogo actual." : "Califica tus notas favoritas en el test para personalizar esta selección."}</small>
    </aside>
  );
}

export function RecommendationsGrid({ className }: { className?: string }) {
  const [items, setItems] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session.hasToken()) {
      api.recommendations()
        .then(data => setItems(data.recommendations.map(adapt)))
        .catch(reason => {
          if (reason instanceof ApiError && reason.status === 401) {
            // Si el token falló, cargar destacados
            return api.featuredProducts().then(prods => prods.map(p => ({
              id: p.id,
              aliases: p.aliases,
              brand: p.brand,
              name: p.name,
              size: p.unit,
              notes: p.notes,
              image: productImageUrl(p.imageUrl),
              badge: "Destacado",
              prices: p.offers?.map((o, idx) => ({ id: `${o.source}-${o.sku}`, store: stores[o.source] || o.source, price: money.format(o.price), offer: idx === 0 })) || [{ store: "Precio base", price: money.format(p.basePrice) }]
            }))).then(setItems);
          }
          setError(reason instanceof ApiError ? reason.message : "No se pudieron cargar tus recomendaciones.");
        })
        .finally(() => setLoading(false));
    } else {
      api.featuredProducts()
        .then(prods => setItems(prods.map(p => ({
          id: p.id,
          aliases: p.aliases,
          brand: p.brand,
          name: p.name,
          size: p.unit,
          notes: p.notes,
          image: productImageUrl(p.imageUrl),
          badge: "Destacado",
          prices: p.offers?.map((o, idx) => ({ id: `${o.source}-${o.sku}`, store: stores[o.source] || o.source, price: money.format(o.price), offer: idx === 0 })) || [{ store: "Precio base", price: money.format(p.basePrice) }]
        }))))
        .catch(reason => setError(reason instanceof ApiError ? reason.message : "No se pudieron cargar las recomendaciones."))
        .finally(() => setLoading(false));
    }
  }, []);

  if (loading) return <p className={styles.empty}>Preparando tu selección…</p>;
  if (error) return <p className={styles.error} role="alert">{error}</p>;
  return <div className={className}>{items.map(product => <ProductCard key={product.id} product={product} recommendation />)}</div>;
}
