"use client";
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, usePathname } from "next/navigation";
import { api, ApiError, productImageUrl } from "@/shared/api/client";
import type { Comparison, SyncJob } from "@/shared/api/types";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import type { Product } from "../domain/product";
import { isPerfumeSegment, perfumeSegmentForBrand, perfumeSegments } from "../domain/segment";
import { ProductCard } from "./ProductCard";
import { Icon } from "@/shared/components/Icon";
import styles from "./catalog.module.css";

const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const sourceBadges: Record<string, string> = {
  "falabella-cl": "Falabella",
  "ripley-cl": "Ripley",
  "alisha-cl": "Alisha",
  "silk-cl": "Silk",
  "elite-cl": "Elite",
  "cosmetic-cl": "Cosmetic",
  "paris-cl": "Paris",
  "abc-cl": "ABC",
  "preunic-cl": "Preunic",
  "lodoro-cl": "L'Odoro",
};
const PRODUCTS_PER_PAGE = 12;
type SortMode = "recommended" | "price" | "price-desc" | "savings" | "stores" | "name" | "name-desc";

function isSetProduct(product: Comparison["product"]) {
  // Se calcula desde el texto para evitar datos de catálogos previos que
  // marcaron como set un perfume individual con el volumen repetido.
  const text = `${product.name} ${product.unit}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/\b(?:set|pack|kit|estuche|cofre|coffret)\b/.test(text)) return true;
  const volumes = text.match(/\b\d+(?:[.,]\d+)?\s*(?:ml|cl|oz|l)\b/g) ?? [];
  return new Set(volumes.map((volume) => volume.replace(",", ".").replace(/\s/g, ""))).size >= 2;
}

export function toProduct(item: Comparison): Product {
  const pricesByChain = [...item.prices]
    .sort((a, b) => a.price - b.price)
    .filter((price, priceIndex, prices) =>
      prices.findIndex(candidate => candidate.storeName === price.storeName) === priceIndex
    );
  // El card muestra cinco precios para mantener una altura legible. Conservamos
  // el conteo restante para no dar la impresión de que el distintivo es erróneo.
  const cheapestByChain = pricesByChain.slice(0, 5);
  const badge =
    item.product.matchedStores && item.product.matchedStores > 1
      ? `Comparado en ${item.product.matchedStores} tiendas`
      : item.product.priceIsMock
      ? "Precio demo"
      : isSetProduct(item.product)
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
    imageCandidates: [...new Set((item.product.imageUrls || [item.product.imageUrl])
      .filter((imageUrl): imageUrl is string => Boolean(imageUrl))
      .map(productImageUrl)
      .filter((imageUrl): imageUrl is string => Boolean(imageUrl)))],
    prices: cheapestByChain.map((price, priceIndex) => ({
      id: price.storeId,
      store: price.storeName,
      price: money.format(price.price),
      offer: priceIndex === 0,
    })),
    extraStoreCount: Math.max(0, pricesByChain.length - cheapestByChain.length),
    badge,
  };
}

export function CatalogExplorer({ initialQuery = "" }: { initialQuery?: string }) {
  const optionalSession = useOptionalSession();
  const user = optionalSession?.user ?? null;
  const isAdmin = user?.role === "admin";

  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ── Leer estado desde la URL ────────────────────────────────────────────
  const urlQuery    = searchParams.get("q")      ?? initialQuery;
  const brand       = searchParams.get("brand")  ?? "";
  const category    = searchParams.get("cat")    ?? "";
  const gender      = searchParams.get("gender") ?? "";
  const minPriceParam = searchParams.get("minPrice") ?? "";
  const maxPriceParam = searchParams.get("maxPrice") ?? "";
  const minPrice = Number(minPriceParam) > 0 ? Number(minPriceParam) : null;
  const maxPrice = Number(maxPriceParam) > 0 ? Number(maxPriceParam) : null;
  const store = searchParams.get("store") ?? "";
  const presentation = searchParams.get("presentation") ?? "";
  const comparison = searchParams.get("comparison") ?? "";
  const segmentParam = searchParams.get("segment") ?? "";
  const segment = isPerfumeSegment(segmentParam) ? segmentParam : "";
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
  const [syncingAlisha, setSyncingAlisha] = useState(false);
  const [syncingSilk, setSyncingSilk] = useState(false);
  const [syncingElite, setSyncingElite] = useState(false);
  const [syncingCosmetic, setSyncingCosmetic] = useState(false);
  const [syncingParis, setSyncingParis] = useState(false);
  const [syncingAbc, setSyncingAbc] = useState(false);
  const [error, setError] = useState("");
  const [syncMessage, setSyncMessage] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const loadCatalog = useCallback(async (search = urlQuery) => {
    setItems(await api.comparisons(search));
  }, [urlQuery]);

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
   * Actualiza múltiples params de forma inmediata, sin esperar una navegación
   * del App Router. Next sincroniza estas llamadas con useSearchParams.
   */
  function applyParams(changes: Record<string, string | null>, mode: "replace" | "push" = "replace") {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    const query = params.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    // replace para filtros (no crea entrada en historial), push para paginación.
    if (mode === "push") window.history.pushState(null, "", url);
    else window.history.replaceState(null, "", url);
  }

  /** Cambia un filtro y resetea la página a 1 — una sola llamada atómica */
  function setFilter(key: string, value: string) {
    applyParams({ [key]: value || null, page: null });
  }

  /** Cambio de página — usa push() para que Back funcione */
  function goToPage(nextPage: number) {
    const clamped = Math.min(Math.max(nextPage, 1), totalPages);
    applyParams({ page: clamped === 1 ? null : String(clamped) }, "push");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /** Reset de todos los filtros en una sola llamada */
  function resetFilters() {
    applyParams({ brand: null, cat: null, gender: null, minPrice: null, maxPrice: null, store: null, presentation: null, comparison: null, segment: null, sort: null, page: null });
  }

  /** Input de búsqueda: actualización local inmediata + debounce a URL */
  function handleSearchChange(value: string) {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      applyParams({ q: value || null, page: null });
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

  async function updateAlisha() {
    setSyncingAlisha(true); setError(""); setSyncMessage("");
    try { const { job } = await api.syncAlishaPerfumes(); await waitForSync(job, "Alisha"); await loadCatalog(); }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : "No se pudo actualizar Alisha."); }
    finally { setSyncingAlisha(false); }
  }

  async function updateSilk() {
    setSyncingSilk(true); setError(""); setSyncMessage("");
    try { const { job } = await api.syncSilkPerfumes(); await waitForSync(job, "Silk"); await loadCatalog(); }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : "No se pudo actualizar Silk."); }
    finally { setSyncingSilk(false); }
  }

  async function updateElite() {
    setSyncingElite(true); setError(""); setSyncMessage("");
    try { const { job } = await api.syncElitePerfumes(); await waitForSync(job, "Elite"); await loadCatalog(); }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : "No se pudo actualizar Elite."); }
    finally { setSyncingElite(false); }
  }

  async function updateCosmetic() {
    setSyncingCosmetic(true); setError(""); setSyncMessage("");
    try { const { job } = await api.syncCosmeticPerfumes(); await waitForSync(job, "Cosmetic"); await loadCatalog(); }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : "No se pudo actualizar Cosmetic."); }
    finally { setSyncingCosmetic(false); }
  }

  async function updateParis() {
    setSyncingParis(true); setError(""); setSyncMessage("");
    try { const { job } = await api.syncParisPerfumes(); await waitForSync(job, "Paris"); await loadCatalog(); }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : "No se pudo actualizar Paris."); }
    finally { setSyncingParis(false); }
  }

  async function updateAbc() {
    setSyncingAbc(true); setError(""); setSyncMessage("");
    try { const { job } = await api.syncAbcPerfumes(); await waitForSync(job, "ABC"); await loadCatalog(); }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : "No se pudo actualizar ABC."); }
    finally { setSyncingAbc(false); }
  }

  // ── Filtrado y paginación (client-side, instantáneo) ────────────────────
  const brands     = useMemo(() => [...new Set(items.map(i => i.product.brand))].sort(), [items]);
  const categories = useMemo(() => [...new Set(items.map(i => i.product.category))].sort(), [items]);
  const stores = useMemo(() => [...new Set(items.flatMap(item => item.prices.map(price => price.storeName)))].sort(), [items]);

  const filteredItems = useMemo(() =>
    items
      .filter(item =>
        (!brand    || item.product.brand    === brand)    &&
        (!category || item.product.category === category) &&
        (!gender   || item.product.gender   === gender)   &&
        (!minPrice || (item.minPrice ?? item.product.basePrice) >= minPrice) &&
        (!maxPrice || (item.minPrice ?? item.product.basePrice) <= maxPrice) &&
        (!store || item.prices.some(price => price.storeName === store)) &&
        (!presentation || (presentation === "set" ? isSetProduct(item.product) : !isSetProduct(item.product))) &&
        (!comparison || (item.product.matchedStores ?? item.prices.length) >= 2) &&
        (!segment  || perfumeSegmentForBrand(item.product.brand) === segment)
      )
      .sort((a, b) => {
        if (sort === "name") return `${a.product.brand} ${a.product.name}`.localeCompare(`${b.product.brand} ${b.product.name}`, "es");
        if (sort === "name-desc") return `${b.product.brand} ${b.product.name}`.localeCompare(`${a.product.brand} ${a.product.name}`, "es");
        if (sort === "price") return (a.minPrice ?? Number.MAX_SAFE_INTEGER) - (b.minPrice ?? Number.MAX_SAFE_INTEGER);
        if (sort === "price-desc") return (b.minPrice ?? 0) - (a.minPrice ?? 0);
        if (sort === "savings") {
          const savingsA = (a.maxPrice && a.minPrice) ? a.maxPrice - a.minPrice : 0;
          const savingsB = (b.maxPrice && b.minPrice) ? b.maxPrice - b.minPrice : 0;
          return savingsB - savingsA;
        }
        if (sort === "stores") {
          const storesA = a.product.matchedStores ?? a.prices.length ?? 0;
          const storesB = b.product.matchedStores ?? b.prices.length ?? 0;
          return storesB - storesA;
        }
        const diff = (b.product.matchedStores ?? 0) - (a.product.matchedStores ?? 0);
        return diff || (a.minPrice ?? Number.MAX_SAFE_INTEGER) - (b.minPrice ?? Number.MAX_SAFE_INTEGER);
      }),
    [items, brand, category, gender, minPrice, maxPrice, store, presentation, comparison, segment, sort]
  );

  const totalPages   = Math.max(1, Math.ceil(filteredItems.length / PRODUCTS_PER_PAGE));
  const currentPage  = Math.min(page, totalPages);
  const visibleItems = useMemo(
    () => filteredItems.slice((currentPage - 1) * PRODUCTS_PER_PAGE, currentPage * PRODUCTS_PER_PAGE),
    [filteredItems, currentPage]
  );
  const products     = useMemo(() => visibleItems.map(toProduct), [visibleItems]);
  const filterCount  = [brand, category, gender, minPriceParam, maxPriceParam, store, presentation, comparison, segment].filter(Boolean).length;
  const activeSegment = perfumeSegments.find(option => option.value === segment) ?? perfumeSegments[0];

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
            <button onClick={updateAlisha}    disabled={syncingAlisha}>{syncingAlisha ? "Actualizando…" : "Actualizar Alisha"}</button>
            <button onClick={updateSilk}      disabled={syncingSilk}>{syncingSilk ? "Actualizando…" : "Actualizar Silk"}</button>
            <button onClick={updateElite}     disabled={syncingElite}>{syncingElite ? "Actualizando…" : "Actualizar Elite"}</button>
            <button onClick={updateCosmetic}  disabled={syncingCosmetic}>{syncingCosmetic ? "Actualizando…" : "Actualizar Cosmetic"}</button>
            <button onClick={updateParis}     disabled={syncingParis}>{syncingParis ? "Actualizando…" : "Actualizar Paris"}</button>
            <button onClick={updateAbc}       disabled={syncingAbc}>{syncingAbc ? "Actualizando…" : "Actualizar ABC"}</button>
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
            <div className={styles.filters}>
              <fieldset className={styles.priceRange}>
                <legend>Rango de precio</legend>
                <div>
                  <label>
                    Desde
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="1000"
                      value={minPriceParam}
                      onChange={e => setFilter("minPrice", e.target.value)}
                      placeholder="$1.000"
                    />
                  </label>
                  <label>
                    Hasta
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="1000"
                      value={maxPriceParam}
                      onChange={e => setFilter("maxPrice", e.target.value)}
                      placeholder="$10.000"
                    />
                  </label>
                </div>
              </fieldset>
              <label>
                Marca
                <select value={brand} onChange={e => setFilter("brand", e.target.value)}>
                  <option value="">Todas</option>
                  {brands.map(v => <option key={v}>{v}</option>)}
                </select>
              </label>
              <label>
                Disponible en
                <select value={store} onChange={e => setFilter("store", e.target.value)}>
                  <option value="">Todas las tiendas</option>
                  {stores.map(value => <option key={value}>{value}</option>)}
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
              <label>
                Presentación
                <select value={presentation} onChange={e => setFilter("presentation", e.target.value)}>
                  <option value="">Todas</option>
                  <option value="individual">Perfume individual</option>
                  <option value="set">Set o kit</option>
                </select>
              </label>
              <label>
                Comparación de precios
                <select value={comparison} onChange={e => setFilter("comparison", e.target.value)}>
                  <option value="">Cualquier disponibilidad</option>
                  <option value="multiple">Disponible en 2 o más tiendas</option>
                </select>
              </label>
            </div>
            <p className={styles.filterNote}>Solo ofertas vendidas directamente por tiendas verificadas.</p>
          </aside>

          {/* ── Stage principal ── */}
          <div className={styles.catalogStage}>
            <div className={styles.catalogToolbar}>
              <div>
                <p>Home · Perfumes{segment ? ` · ${activeSegment.label}` : ""}</p>
                <h2>{activeSegment.title}</h2>
              </div>
              <label>
                Ordenar por
                <select value={sort} onChange={e => setFilter("sort", e.target.value)}>
                  <option value="recommended">Mejor comparación</option>
                  <option value="price">Precio: menor a mayor</option>
                  <option value="price-desc">Precio: mayor a menor</option>
                  <option value="savings">Mayor ahorro entre tiendas</option>
                  <option value="stores">Más tiendas comparadas</option>
                  <option value="name">Nombre: A a Z</option>
                  <option value="name-desc">Nombre: Z a A</option>
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
