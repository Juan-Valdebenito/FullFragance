"use client";
import { useCallback, useEffect, useMemo, useState, useRef, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
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
    .filter((price, priceIndex, prices) =>
      prices.findIndex(candidate => candidate.storeName === price.storeName) === priceIndex
    )
    .slice(0, 2);
  const badge =
    item.product.matchedStores && item.product.matchedStores > 1
      ? "Comparado en 2 tiendas"
      : item.product.priceIsMock
      ? "Precio demo"
      : item.product.isSet
      ? "Set / Kit"
      : item.product.source
      ? cheapestByChain.length
        ? sourceBadges[item.product.source] ?? "Marketplace"
        : "Dato scraper"
      : undefined;
  return {
    id: item.product.id,
    aliases: item.product.aliases,
    brand: item.product.brand,
    name: item.product.name,
    size: item.product.unit,
    notes: [item.product.category],
    image: productImageUrl(item.product.imageUrl),
    prices: cheapestByChain.map((price, priceIndex) => ({
      id: price.storeId,
      store: price.storeName,
      price: money.format(price.price),
      offer: priceIndex === 0,
    })),
    badge,
  };
}

export function CatalogExplorer({ initialQuery = "" }: { initialQuery?: string }) {
  const optionalSession = useOptionalSession();
  const user = optionalSession?.user ?? null;
  const isAdmin = user?.role === "admin";

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // ── Leer estado desde la URL ────────────────────────────────────────────
  const urlQuery    = searchParams.get("q")      ?? initialQuery;
  const brand       = searchParams.get("brand")  ?? "";
  const category    = searchParams.get("cat")    ?? "";
  const gender      = searchParams.get("gender") ?? "";
  const sort        = (searchParams.get("sort")  ?? "recommended") as SortMode;
  const page        = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);

  // ── Estado local solo para el input de búsqueda (tipeo rápido) ──────────
  // El valor del input vive en React state para respuesta inmediata.
  // Solo se sincroniza a la URL después de 300 ms de inactividad.
  const [inputValue, setInputValue] = useState(urlQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mantener el input sincronizado si la URL cambia desde afuera (Back/Forward)
  useEffect(() => { setInputValue(urlQuery); }, [urlQuery]);

  // ── Datos del catálogo ──────────────────────────────────────────────────
  const [items, setItems] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingRipley, setSyncingRipley] = useState(false);
  const [error, setError] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const loadCatalog = useCallback(async (search = urlQuery) => {
    const city = user?.city ?? SANTIAGO;
    setItems(await api.comparisons(city, search));
  }, [urlQuery, user?.city]);

  useEffect(() => {
    const timeout = window.setTimeout(async () => {
      setLoading(true); setError("");
      try { await loadCatalog(urlQuery); }
      catch (reason) { setError(reason instanceof ApiError ? reason.message : "No se pudo cargar el catálogo."); }
      finally { setLoading(false); }
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [loadCatalog, urlQuery]);

  // ── Helpers para actualizar la URL ──────────────────────────────────────

  /**
   * Actualiza MÚLTIPLES params en un solo router.replace() atómico.
   * Usar replace() para filtros (no agrega historial innecesario).
   */
  function applyParams(changes: Record<string, string | null>, mode: "replace" | "push" = "replace") {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    const url = `${pathname}?${params.toString()}`;
    // replace para filtros (no crea entrada en historial), push para paginación
    if (mode === "push") router.push(url, { scroll: false });
    else router.replace(url, { scroll: false });
  }

  /** Cambia un filtro y resetea la página a 1 — una sola llamada atómica */
  function setFilter(key: string, value: string) {
    startTransition(() => applyParams({ [key]: value || null, page: null }));
  }

  /** Cambio de página — usa push() para que Back funcione */
  function goToPage(nextPage: number) {
    const clamped = Math.min(Math.max(nextPage, 1), totalPages);
    startTransition(() => applyParams({ page: clamped === 1 ? null : String(clamped) }, "push"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Reset de todos los filtros en una sola llamada */
  function resetFilters() {
    startTransition(() => applyParams({ brand: null, cat: null, gender: null, sort: null, page: null }));
  }

  /** Input de búsqueda: actualización local inmediata + debounce a URL */
  function handleSearchChange(value: string) {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      startTransition(() => applyParams({ q: value || null, page: null }));
    }, 300);
  }

  /** Construye el href del detalle incluyendo la URL actual como "back" */
  function productHref(productId: string) {
    const currentParams = searchParams.toString();
    const back = `/dashboard${currentParams ? `?${currentParams}` : ""}`;
    return `/perfumes/${productId}?back=${encodeURIComponent(back)}`;
  }

  // ── Sync jobs (admin) ───────────────────────────────────────────────────
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
    setSyncMessage(`${storeName} actualizado: ${job.imported} perfumes.`);
  }

  async function updateFalabella() {
    setSyncing(true); setError(""); setSyncMessage("");
    try { const { job } = await api.syncFalabellaPerfumes(); await waitForSync(job, "Falabella"); await loadCatalog(); }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : "No se pudo actualizar Falabella."); }
    finally { setSyncing(false); }
  }

  async function updateRipley() {
    setSyncingRipley(true); setError(""); setSyncMessage("");
    try { const { job } = await api.syncRipleyPerfumes(); await waitForSync(job, "Ripley"); await loadCatalog(); }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : "No se pudo actualizar Ripley."); }
    finally { setSyncingRipley(false); }
  }

  // ── Filtrado y paginación (client-side, instantáneo) ────────────────────
  const brands     = useMemo(() => [...new Set(items.map(i => i.product.brand))].sort(), [items]);
  const categories = useMemo(() => [...new Set(items.map(i => i.product.category))].sort(), [items]);

  const filteredItems = useMemo(() =>
    items
      .filter(item =>
        (!brand    || item.product.brand    === brand)    &&
        (!category || item.product.category === category) &&
        (!gender   || item.product.gender   === gender)
      )
      .sort((a, b) => {
        if (sort === "name")  return `${a.product.brand} ${a.product.name}`.localeCompare(`${b.product.brand} ${b.product.name}`, "es");
        if (sort === "price") return (a.minPrice ?? Number.MAX_SAFE_INTEGER) - (b.minPrice ?? Number.MAX_SAFE_INTEGER);
        const diff = (b.product.matchedStores ?? 0) - (a.product.matchedStores ?? 0);
        return diff || (a.minPrice ?? Number.MAX_SAFE_INTEGER) - (b.minPrice ?? Number.MAX_SAFE_INTEGER);
      }),
    [items, brand, category, gender, sort]
  );

  const totalPages   = Math.max(1, Math.ceil(filteredItems.length / PRODUCTS_PER_PAGE));
  const currentPage  = Math.min(page, totalPages);
  const visibleItems = useMemo(
    () => filteredItems.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE),
    [filteredItems, currentPage]
  );
  const products     = useMemo(() => visibleItems.map(toProduct), [visibleItems]);
  const filterCount  = [brand, category, gender].filter(Boolean).length;

  const comparedCount  = useMemo(() => items.filter(i => (i.product.matchedStores ?? 0) > 1).length, [items]);
  const falabellaCount = useMemo(() => items.filter(i => i.product.source === "falabella-cl" || i.prices.some(p => p.storeName === "Falabella")).length, [items]);
  const ripleyCount    = useMemo(() => items.filter(i => i.product.source === "ripley-cl"    || i.prices.some(p => p.storeName === "Ripley")).length,    [items]);

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  // ── Paginación ──────────────────────────────────────────────────────────
  function renderPagination(compact = false) {
    if (filteredItems.length <= PRODUCTS_PER_PAGE) return null;
    return (
      <nav className={`${styles.pagination} ${compact ? styles.compactPagination : ""}`} aria-label="Páginas del catálogo">
        <button className={styles.pageArrow} onClick={() => goToPage(1)} disabled={currentPage === 1} aria-label="Primera página">|←</button>
        <button className={styles.pageArrow} onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Página anterior">←</button>
        <div className={styles.pageNumbers}>
          {pageNumbers.map(n => (
            <button key={n} className={n === currentPage ? styles.activePage : ""} onClick={() => goToPage(n)} aria-current={n === currentPage ? "page" : undefined}>
              {n}
            </button>
          ))}
        </div>
        <div className={styles.pageIndicator}><strong>{currentPage}</strong><span>de {totalPages}</span></div>
        <button className={styles.pageArrow} onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Página siguiente">→</button>
        <button className={styles.pageArrow} onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages} aria-label="Última página">→|</button>
      </nav>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <section className={styles.explorer}>
      {/* Barra de búsqueda */}
      <div className={styles.search}>
        <Icon name="search" />
        <input
          value={inputValue}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Busca por marca, familia olfativa o nombre..."
        />
        <button aria-expanded={filtersOpen} onClick={() => setFiltersOpen(o => !o)}>
          <Icon name="filter" />
          <span>Filtros{filterCount ? ` (${filterCount})` : ""}</span>
        </button>
        {isAdmin && (
          <>
            <button onClick={updateFalabella} disabled={syncing}>{syncing ? "Actualizando…" : "Actualizar Falabella"}</button>
            <button onClick={updateRipley}    disabled={syncingRipley}>{syncingRipley ? "Actualizando…" : "Actualizar Ripley"}</button>
          </>
        )}
      </div>

      {syncMessage && <p className={styles.status}>{syncMessage}</p>}

      {loading ? (
        <p className={styles.empty}>Consultando precios…</p>
      ) : error ? (
        <p className={styles.error} role="alert">{error}</p>
      ) : (
        <div className={styles.catalogShell}>
          {/* ── Rail de filtros ── */}
          <aside className={`${styles.filterRail} ${filtersOpen ? styles.openFilters : ""}`}>
            <div className={styles.filterIntro}>
              <div>
                <span>Perfumes</span>
                <strong>{filteredItems.length} resultados</strong>
              </div>
              <button onClick={resetFilters} disabled={!filterCount}>Borrar filtros</button>
            </div>
            <div className={styles.storeStats}>
              <span><strong>{comparedCount}</strong> comparados</span>
              <span><strong>{falabellaCount}</strong> Falabella</span>
              <span><strong>{ripleyCount}</strong> Ripley</span>
            </div>
            <div className={styles.filters}>
              <label>
                Marca
                <select value={brand} onChange={e => setFilter("brand", e.target.value)}>
                  <option value="">Todas</option>
                  {brands.map(v => <option key={v}>{v}</option>)}
                </select>
              </label>
              <label>
                Categoría
                <select value={category} onChange={e => setFilter("cat", e.target.value)}>
                  <option value="">Todas</option>
                  {categories.map(v => <option key={v}>{v}</option>)}
                </select>
              </label>
              <label>
                Género
                <select value={gender} onChange={e => setFilter("gender", e.target.value)}>
                  <option value="">Todos</option>
                  <option>Masculino</option>
                  <option>Femenino</option>
                  <option>Unisex</option>
                </select>
              </label>
            </div>
            <p className={styles.filterNote}>Solo ofertas vendidas directamente por tiendas verificadas.</p>
          </aside>

          {/* ── Stage principal ── */}
          <div className={styles.catalogStage}>
            <div className={styles.catalogToolbar}>
              <div>
                <p>Home · Perfumes</p>
                <h2>Catálogo de fragancias</h2>
              </div>
              <label>
                Ordenar por
                <select value={sort} onChange={e => setFilter("sort", e.target.value)}>
                  <option value="recommended">Mejor comparación</option>
                  <option value="price">Precio más bajo</option>
                  <option value="name">Marca y nombre</option>
                </select>
              </label>
              <div className={styles.topPager}>
                <span>
                  {Math.min((currentPage - 1) * PRODUCTS_PER_PAGE + 1, filteredItems.length)}–{Math.min(currentPage * PRODUCTS_PER_PAGE, filteredItems.length)} de {filteredItems.length}
                </span>
                {renderPagination(true)}
              </div>
            </div>

            <div className={styles.grid}>
              {products.map(product => (
                <ProductCard key={product.id} product={product} href={productHref(product.id)} />
              ))}
            </div>

            {filteredItems.length > PRODUCTS_PER_PAGE && (
              <div className={styles.paginationWrap}>{renderPagination()}</div>
            )}
          </div>
        </div>
      )}

      {!loading && !error && filteredItems.length === 0 && (
        <p className={styles.empty}>No encontramos fragancias para "{inputValue}".</p>
      )}
    </section>
  );
}
