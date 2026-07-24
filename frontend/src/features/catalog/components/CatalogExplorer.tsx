"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/shared/api/client";
import type { City, Comparison, SyncJob } from "@/shared/api/types";
import type { Product } from "../domain/product";
import { ProductCard } from "./ProductCard";
import { Icon } from "@/shared/components/Icon";
import styles from "./catalog.module.css";

const SANTIAGO: City = { name: "Santiago", country: "Chile", lat: -33.4489, lon: -70.6693 };
const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const sourceBadges: Record<string, string> = { "falabella-cl": "Falabella", "ripley-cl": "Ripley" };
const PRODUCTS_PER_PAGE = 12;

export function toProduct(item: Comparison): Product {
  const cheapestByChain = [...item.prices]
    .sort((a, b) => a.price - b.price)
    .filter((price, priceIndex, prices) => prices.findIndex(candidate => candidate.storeName === price.storeName) === priceIndex)
    .slice(0, 2);
  const badge = item.product.matchedStores && item.product.matchedStores > 1
    ? "Comparado en 2 tiendas"
    : item.product.priceIsMock ? "Precio demo" : item.product.source ? cheapestByChain.length ? sourceBadges[item.product.source] ?? "Marketplace" : "Dato scraper" : undefined;
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
  const [page, setPage] = useState(1);

  const loadCatalog = useCallback(async (search = query) => {
    const user = await api.me();
    const city = user.city ?? SANTIAGO;
    if (!user.city) await api.setCity(city);
    setItems(await api.comparisons(city, search));
  }, [query]);

  async function waitForSync(initialJob: SyncJob, storeName: string) {
    let job = initialJob;
    while (job.status === "running") {
      const progress = job.currentPage > 0 ? ` página ${job.currentPage} procesada` : "";
      const target = job.targetProducts ? ` de aproximadamente ${job.targetProducts}` : "";
      setSyncMessage(`${storeName}: recorriendo catálogo${progress} · ${job.imported}${target} productos directos encontrados.`);
      await new Promise(resolve => window.setTimeout(resolve, 2000));
      job = await api.syncJob(job.id);
    }
    if (job.status === "failed") throw new ApiError(job.error || `Falló la sincronización de ${storeName}.`, 500);
    setSyncMessage(`${storeName} actualizado: ${job.imported} perfumes vendidos directamente por la tienda.`);
  }

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
      const { job } = await api.syncFalabellaPerfumes();
      await waitForSync(job, "Falabella");
      await loadCatalog();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No se pudo actualizar Falabella.");
    } finally { setSyncing(false); }
  }

  async function updateRipley() {
    setSyncingRipley(true); setError(""); setSyncMessage("");
    try {
      const { job } = await api.syncRipleyPerfumes();
      await waitForSync(job, "Ripley");
      await loadCatalog();
    } catch (reason) {
      setError(reason instanceof ApiError ? reason.message : "No se pudo actualizar Ripley.");
    } finally { setSyncingRipley(false); }
  }

  const brands = useMemo(() => [...new Set(items.map(item => item.product.brand))].sort(), [items]);
  const categories = useMemo(() => [...new Set(items.map(item => item.product.category))].sort(), [items]);
  const filteredItems = useMemo(() => items.filter(item => (!brand || item.product.brand === brand) && (!category || item.product.category === category) && (!gender || item.product.gender === gender))
    .sort((a, b) => {
      const storeDifference = (b.product.matchedStores ?? 0) - (a.product.matchedStores ?? 0);
      if (storeDifference) return storeDifference;
      return (a.minPrice ?? Number.MAX_SAFE_INTEGER) - (b.minPrice ?? Number.MAX_SAFE_INTEGER);
    }), [items, brand, category, gender]);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = useMemo(() => filteredItems.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE), [filteredItems, currentPage]);
  const products = useMemo(() => visibleItems.map(toProduct), [visibleItems]);
  const filterCount = [brand, category, gender].filter(Boolean).length;

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  function goToPage(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return <section className={styles.explorer}>
    <div className={styles.search}><Icon name="search" /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Busca por marca, categoría o nombre de perfume..." /><button aria-expanded={filtersOpen} onClick={() => setFiltersOpen(open => !open)}><Icon name="filter" /><span>Filtros{filterCount ? ` (${filterCount})` : ""}</span></button><button onClick={updateFalabella} disabled={syncing}>{syncing ? "Actualizando…" : "Actualizar Falabella"}</button><button onClick={updateRipley} disabled={syncingRipley}>{syncingRipley ? "Actualizando…" : "Actualizar Ripley"}</button></div>
    {syncMessage && <p className={styles.empty}>{syncMessage}</p>}
    {filtersOpen && <div className={styles.filters}><label>Marca<select value={brand} onChange={event => { setBrand(event.target.value); setPage(1); }}><option value="">Todas</option>{brands.map(value => <option key={value}>{value}</option>)}</select></label><label>Categoría<select value={category} onChange={event => { setCategory(event.target.value); setPage(1); }}><option value="">Todas</option>{categories.map(value => <option key={value}>{value}</option>)}</select></label><label>Género<select value={gender} onChange={event => { setGender(event.target.value); setPage(1); }}><option value="">Todos</option><option>Masculino</option><option>Femenino</option><option>Unisex</option></select></label><button onClick={() => { setBrand(""); setCategory(""); setGender(""); setPage(1); }}>Limpiar filtros</button></div>}
    {loading ? <p className={styles.empty}>Consultando precios…</p> : error ? <p className={styles.error} role="alert">{error}</p> : <>
      <div className={styles.catalogMeta}>
        <div className={styles.resultCount}><strong>{filteredItems.length}</strong><span>fragancias encontradas</span></div>
        <span className={styles.resultRange}>Mostrando {Math.min((currentPage - 1) * PRODUCTS_PER_PAGE + 1, filteredItems.length)}–{Math.min(currentPage * PRODUCTS_PER_PAGE, filteredItems.length)}</span>
      </div>
      <div className={styles.grid}>{products.map(product => <ProductCard key={product.id} product={product} />)}</div>
      {filteredItems.length > PRODUCTS_PER_PAGE && <div className={styles.paginationWrap}>
        <nav className={styles.pagination} aria-label="Páginas del catálogo">
          <button className={styles.pageArrow} onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Página anterior"><span aria-hidden="true">←</span><span>Anterior</span></button>
          <div className={styles.pageNumbers}>{pageNumbers.map(pageNumber => <button key={pageNumber} className={pageNumber === currentPage ? styles.activePage : ""} onClick={() => goToPage(pageNumber)} aria-current={pageNumber === currentPage ? "page" : undefined}>{pageNumber}</button>)}</div>
          <div className={styles.pageIndicator}><strong>{currentPage}</strong><span>de {totalPages}</span></div>
          <button className={styles.pageArrow} onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}><span>Siguiente</span><span aria-hidden="true">→</span></button>
        </nav>
      </div>}
    </>}
    {!loading && !error && filteredItems.length === 0 && <p className={styles.empty}>No encontramos fragancias para “{query}”.</p>}
  </section>;
}
