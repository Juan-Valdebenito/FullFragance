"use client";
import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/shared/api/client";
import type { City, Comparison } from "@/shared/api/types";
import type { Product } from "../domain/product";
import { products as visualProducts } from "../data/products";
import { ProductCard } from "./ProductCard";
import { Icon } from "@/shared/components/Icon";
import styles from "./catalog.module.css";
const SANTIAGO: City = { name: "Santiago", country: "Chile", lat: -33.4489, lon: -70.6693 };
const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
export function toProduct(item: Comparison, index: number): Product { const fallback = visualProducts[index % visualProducts.length]; return { id: item.product.id, brand: item.product.brand, name: item.product.name, size: item.product.unit, notes: [item.product.category], image: fallback.image, prices: item.prices.slice(0, 2).map((price, priceIndex) => ({ store: price.storeName, price: money.format(price.price), offer: priceIndex === 0 })), badge: index === 0 ? "Mejor precio" : undefined }; }
export function CatalogExplorer() {
  const [query, setQuery] = useState(""); const [items, setItems] = useState<Comparison[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [filtersOpen, setFiltersOpen] = useState(false); const [brand, setBrand] = useState(""); const [category, setCategory] = useState(""); const [gender, setGender] = useState("");
  useEffect(() => { const timeout = window.setTimeout(async () => { setLoading(true); setError(""); try { const user = await api.me(); const city = user.city ?? SANTIAGO; if (!user.city) await api.setCity(city); setItems(await api.comparisons(city, query)); } catch (reason) { setError(reason instanceof ApiError ? reason.message : "No se pudo cargar el catálogo."); } finally { setLoading(false); } }, 250); return () => window.clearTimeout(timeout); }, [query]);
  const brands = useMemo(() => [...new Set(items.map(item => item.product.brand))].sort(), [items]); const categories = useMemo(() => [...new Set(items.map(item => item.product.category))].sort(), [items]);
  const filteredItems = useMemo(() => items.filter(item => (!brand || item.product.brand === brand) && (!category || item.product.category === category) && (!gender || item.product.gender === gender)), [items, brand, category, gender]);
  const products = useMemo(() => filteredItems.map(toProduct), [filteredItems]); const filterCount = [brand, category, gender].filter(Boolean).length;
  return <section className={styles.explorer}><div className={styles.search}><Icon name="search"/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Busca por marca, categoría o nombre de perfume..."/><button aria-expanded={filtersOpen} onClick={() => setFiltersOpen(open => !open)}><Icon name="filter"/><span>Filtros{filterCount ? ` (${filterCount})` : ""}</span></button></div>
    {filtersOpen && <div className={styles.filters}><label>Marca<select value={brand} onChange={event => setBrand(event.target.value)}><option value="">Todas</option>{brands.map(value => <option key={value}>{value}</option>)}</select></label><label>Categoría<select value={category} onChange={event => setCategory(event.target.value)}><option value="">Todas</option>{categories.map(value => <option key={value}>{value}</option>)}</select></label><label>Género<select value={gender} onChange={event => setGender(event.target.value)}><option value="">Todos</option><option>Masculino</option><option>Femenino</option><option>Unisex</option></select></label><button onClick={() => { setBrand(""); setCategory(""); setGender(""); }}>Limpiar filtros</button></div>}
    {loading ? <p className={styles.empty}>Consultando precios…</p> : error ? <p className={styles.error} role="alert">{error}</p> : <div className={styles.grid}>{products.map(product => <ProductCard key={product.id} product={product}/>)}</div>}
    {!loading && !error && products.length === 0 && <p className={styles.empty}>No encontramos fragancias para “{query}”.</p>}
  </section>;
}
