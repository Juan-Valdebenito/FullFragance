"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api, ApiError, productImageUrl } from "@/shared/api/client";
import type { City, Comparison, SyncJob } from "@/shared/api/types";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import type { Product } from "../domain/product";
import { ProductCard } from "./ProductCard";
import { Icon } from "@/shared/components/Icon";
import styles from "./catalog.module.css";

const SANTIAGO: City = { name: "Santiago", country: "Chile", lat: -33.4489, lon: -70.6693 };
const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const sourceBadges: Record<string, string> = { "falabella-cl": "Falabella", "ripley-cl": "Ripley" };
const PRODUCTS_PER_PAGE = 12;
type SortMode = "recommended" | "price" | "name";

export function toProduct(item: Comparison): Product {
  const cheapestByChain = [...item.prices]
    .sort((a, b) => a.price - b.price)
    .filter((price, priceIndex, prices) => prices.findIndex(candidate => candidate.storeName === price.storeName) === priceIndex)
    .slice(0, 2);
  const badge = item.product.matchedStores && item.product.matchedStores > 1
    ? "Comparado en 2 tiendas"
    : item.product.priceIsMock ? "Precio demo" : item.product.source ? cheapestByChain.length ? sourceBadges[item.product.source] ?? "Marketplace" : "Dato scraper" : undefined;
  return { id: item.product.id, aliases: item.product.aliases, brand: item.product.brand, name: item.product.name, size: item.product.unit, notes: [item.product.category], image: productImageUrl(item.product.imageUrl), prices: cheapestByChain.map((price, priceIndex) => ({ id: price.storeId, store: price.storeName, price: money.format(price.price), offer: priceIndex === 0 })), badge };
}

export function CatalogExplorer({ initialQuery = "" }: { initialQuery?: string }) {
  const optionalSession = useOptionalSession();
  const user = optionalSession?.user ?? null;
  const isAdmin = user?.role === "admin";
  const [query, setQuery] = useState(initialQuery);
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
  const [sort, setSort] = useState<SortMode>("recommended");

  const loadCatalog = useCallback(async (search = query) => {
    const city = user?.city ?? SANTIAGO;
    setItems(await api.comparisons(city, search));
  }, [query, user?.city]);

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
      if (sort === "name") return `${a.product.brand} ${a.product.name}`.localeCompare(`${b.product.brand} ${b.product.name}`, "es");
      if (sort === "price") return (a.minPrice ?? Number.MAX_SAFE_INTEGER) - (b.minPrice ?? Number.MAX_SAFE_INTEGER);
      const storeDifference = (b.product.matchedStores ?? 0) - (a.product.matchedStores ?? 0);
      if (storeDifference) return storeDifference;
      return (a.minPrice ?? Number.MAX_SAFE_INTEGER) - (b.minPrice ?? Number.MAX_SAFE_INTEGER);
    }), [items, brand, category, gender, sort]);
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PRODUCTS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const visibleItems = useMemo(() => filteredItems.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE), [filteredItems, currentPage]);
  const products = useMemo(() => visibleItems.map(toProduct), [visibleItems]);
  const filterCount = [brand, category, gender].filter(Boolean).length;
  const comparedCount = useMemo(() => items.filter(item => (item.product.matchedStores ?? 0) > 1).length, [items]);
  const falabellaCount = useMemo(() => items.filter(item => item.product.source === "falabella-cl" || item.prices.some(price => price.storeName === "Falabella")).length, [items]);
  const ripleyCount = useMemo(() => items.filter(item => item.product.source === "ripley-cl" || item.prices.some(price => price.storeName === "Ripley")).length, [items]);

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, index) => start + index);
  }, [currentPage, totalPages]);

  function goToPage(nextPage: number) {
    setPage(Math.min(Math.max(nextPage, 1), totalPages));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetFilters() {
    setBrand("");
    setCategory("");
    setGender("");
    setPage(1);
  }

  function renderPagination(compact = false) {
    if (filteredItems.length <= PRODUCTS_PER_PAGE) return null;
    return <nav className={`${styles.pagination} ${compact ? styles.compactPagination : ""}`} aria-label="Páginas del catálogo">
      <button className={styles.pageArrow} onClick={() => goToPage(1)} disabled={currentPage === 1} aria-label="Primera página">|←</button>
      <button className={styles.pageArrow} onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Página anterior">←</button>
      <div className={styles.pageNumbers}>{pageNumbers.map(pageNumber => <button key={pageNumber} className={pageNumber === currentPage ? styles.activePage : ""} onClick={() => goToPage(pageNumber)} aria-current={pageNumber === currentPage ? "page" : undefined}>{pageNumber}</button>)}</div>
      <div className={styles.pageIndicator}><strong>{currentPage}</strong><span>de {totalPages}</span></div>
      <button className={styles.pageArrow} onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Página siguiente">→</button>
      <button className={styles.pageArrow} onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} aria-label="Última página">→|</button>
    </nav>;
  }

  return <section className={styles.explorer}>
    <div className={styles.search}><Icon name="search" /><input value={query} onChange={event => { setQuery(event.target.value); setPage(1); }} placeholder="Busca por marca, familia olfativa o nombre..." /><button aria-expanded={filtersOpen} onClick={() => setFiltersOpen(open => !open)}><Icon name="filter" /><span>Filtros{filterCount ? ` (${filterCount})` : ""}</span></button>{isAdmin && <><button onClick={updateFalabella} disabled={syncing}>{syncing ? "Actualizando…" : "Actualizar Falabella"}</button><button onClick={updateRipley} disabled={syncingRipley}>{syncingRipley ? "Actualizando…" : "Actualizar Ripley"}</button></>}</div>
    {syncMessage && <p className={styles.status}>{syncMessage}</p>}
    {loading ? <p className={styles.empty}>Consultando precios…</p> : error ? <p className={styles.error} role="alert">{error}</p> : <>
      <div className={styles.catalogShell}>
        <aside className={`${styles.filterRail} ${filtersOpen ? styles.openFilters : ""}`}>
          <div className={styles.filterIntro}>
            <div><span>Perfumes</span><strong>{filteredItems.length} resultados</strong></div>
            <button onClick={resetFilters} disabled={!filterCount}>Borrar filtros</button>
          </div>
          <div className={styles.storeStats}><span><strong>{comparedCount}</strong> comparados</span><span><strong>{falabellaCount}</strong> Falabella</span><span><strong>{ripleyCount}</strong> Ripley</span></div>
          <div className={styles.filters}><label>Marca<select value={brand} onChange={event => { setBrand(event.target.value); setPage(1); }}><option value="">Todas</option>{brands.map(value => <option key={value}>{value}</option>)}</select></label><label>Categoría<select value={category} onChange={event => { setCategory(event.target.value); setPage(1); }}><option value="">Todas</option>{categories.map(value => <option key={value}>{value}</option>)}</select></label><label>Género<select value={gender} onChange={event => { setGender(event.target.value); setPage(1); }}><option value="">Todos</option><option>Masculino</option><option>Femenino</option><option>Unisex</option></select></label></div>
          <p className={styles.filterNote}>Solo ofertas vendidas directamente por Falabella y Ripley.</p>
        </aside>
        <div className={styles.catalogStage}>
          <div className={styles.catalogToolbar}>
            <div>
              <p>Home · Perfumes</p>
              <h2>Catálogo de fragancias</h2>
            </div>
            <label>Ordenar por<select value={sort} onChange={event => { setSort(event.target.value as SortMode); setPage(1); }}><option value="recommended">Mejor comparación</option><option value="price">Precio más bajo</option><option value="name">Marca y nombre</option></select></label>
            <div className={styles.topPager}>
              <span>{Math.min((currentPage - 1) * PRODUCTS_PER_PAGE + 1, filteredItems.length)}–{Math.min(currentPage * PRODUCTS_PER_PAGE, filteredItems.length)} de {filteredItems.length}</span>
              {renderPagination(true)}
            </div>
          </div>
          <div className={styles.grid}>{products.map(product => <ProductCard key={product.id} product={product} />)}</div>
          {filteredItems.length > PRODUCTS_PER_PAGE && <div className={styles.paginationWrap}>{renderPagination()}</div>}
        </div>
      </div>
    </>}
    {!loading && !error && filteredItems.length === 0 && <p className={styles.empty}>No encontramos fragancias para “{query}”.</p>}
  </section>;
}
