"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/shared/api/client";
import type { City, Comparison } from "@/shared/api/types";
import type { Product } from "../domain/product";
import { ProductCard } from "./ProductCard";
import { Icon } from "@/shared/components/Icon";
import styles from "./catalog.module.css";

const SANTIAGO: City = { name: "Santiago", country: "Chile", lat: -33.4489, lon: -70.6693 };
const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const sourceBadges: Record<string, string> = { "falabella-cl": "Falabella", "ripley-cl": "Ripley" };

export function toProduct(item: Comparison): Product {
  const cheapestByChain = [...item.prices]
    .sort((a, b) => a.price - b.price)
    .filter((price, priceIndex, prices) => prices.findIndex(candidate => candidate.storeName === price.storeName) === priceIndex)
    .slice(0, 2);
  const badge = item.product.priceIsMock ? "Precio demo" : item.product.source ? cheapestByChain.length ? sourceBadges[item.product.source] ?? "Marketplace" : "Dato scraper" : undefined;
  return { id: item.product.id, brand: item.product.brand, name: item.product.name, size: item.product.unit, notes: [item.product.category], image: item.product.imageUrl, prices: cheapestByChain.map((price, priceIndex) => ({ id: price.storeId, store: price.storeName, price: money.format(price.price), offer: priceIndex === 0 })), badge };
}

export function CatalogExplorer() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingRipley, setSyncingRipley] = useState(false);
  const [error, setError] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [gender, setGender] = useState("");

  const loadCatalog = useCallback(async (search = query) => {
    const user = await api.me();
    const city = user.city ?? SANTIAGO;
    if (!user.city) await api.setCity(city);
    setItems(await api.comparisons(city, search));
  }, [query]);

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      setLoading(true); setError("");
      try { await loadCatalog(query); }
      catch (reason) { setError(reason instanceof ApiError ? reason.message : "No se pudo cargar el catálogo."); }
      finally { setLoading(false); }
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [loadCatalog, query]);

  async function updateFalabella() {
    setSyncing(true); setError(""); setSyncMessage("");
    try {
      const { results } = await api.syncFalabellaPerfumes(12);
      const succeeded = results.filter(result => result.ok).length;
      setSyncMessage(`Falabella actualizada: ${succeeded} de ${results.length} perfumes procesados.`);
      await loadCatalog();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No se pudo actualizar Falabella.");
    } finally { setSyncing(false); }
  }

  async function updateRipley() {
    setSyncingRipley(true); setError(""); setSyncMessage("");
    try {
      const { results } = await api.syncRipleyPerfumes(12);
      const succeeded = results.filter(result => result.ok).length;
      setSyncMessage(`Ripley actualizado: ${succeeded} de ${results.length} perfumes procesados.`);
      await loadCatalog();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No se pudo actualizar Ripley.");
    } finally { setSyncingRipley(false); }
  }

  const brands = useMemo(() => [...new Set(items.map(item => item.product.brand))].sort(), [items]);
  const categories = useMemo(() => [...new Set(items.map(item => item.product.category))].sort(), [items]);
  const filteredItems = useMemo(() => items.filter(item => (!brand || item.product.brand === brand) && (!category || item.product.category === category) && (!gender || item.product.gender === gender)), [items, brand, category, gender]);
  const products = useMemo(() => filteredItems.map(toProduct), [filteredItems]);
  const filterCount = [brand, category, gender].filter(Boolean).length;

  return <section className={styles.explorer}>
    <div className={styles.search}><Icon name="search" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Busca por marca, categoría o nombre de perfume..." /><button aria-expanded={filtersOpen} onClick={() => setFiltersOpen(open => !open)}><Icon name="filter" /><span>Filtros{filterCount ? ` (${filterCount})` : ""}</span></button><button onClick={updateFalabella} disabled={syncing}>{syncing ? "Actualizando…" : "Actualizar Falabella"}</button><button onClick={updateRipley} disabled={syncingRipley}>{syncingRipley ? "Actualizando…" : "Actualizar Ripley"}</button></div>
    {syncMessage && <p className={styles.empty}>{syncMessage}</p>}
    {filtersOpen && <div className={styles.filters}><label>Marca<select value={brand} onChange={event => setBrand(event.target.value)}><option value="">Todas</option>{brands.map(value => <option key={value}>{value}</option>)}</select></label><label>Categoría<select value={category} onChange={event => setCategory(event.target.value)}><option value="">Todas</option>{categories.map(value => <option key={value}>{value}</option>)}</select></label><label>Género<select value={gender} onChange={event => setGender(event.target.value)}><option value="">Todos</option><option>Masculino</option><option>Femenino</option><option>Unisex</option></select></label><button onClick={() => { setBrand(""); setCategory(""); setGender(""); }}>Limpiar filtros</button></div>}
    {loading ? <p className={styles.empty}>Consultando precios…</p> : error ? <p className={styles.error} role="alert">{error}</p> : <div className={styles.grid}>{products.map(product => <ProductCard key={product.id} product={product} />)}</div>}
    {!loading && !error && products.length === 0 && <p className={styles.empty}>No encontramos fragancias para “{query}”.</p>}
  </section>;
}
