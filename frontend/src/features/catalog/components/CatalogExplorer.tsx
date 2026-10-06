"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { api, ApiError, productImageCandidates, productImageUrl } from "@/shared/api/client";
import type { CatalogSearchResult, Comparison } from "@/shared/api/types";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import type { Product } from "../domain/product";
import { storeLabels } from "../domain/stores";
import { isPerfumeSegment, perfumeSegments } from "../domain/segment";
import { ProductCard } from "./ProductCard";
import { Icon } from "@/shared/components/Icon";
import styles from "./catalog.module.css";

const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const PRODUCTS_PER_PAGE = 12;
type SortMode = "recommended" | "price" | "price-desc" | "savings" | "stores" | "name" | "name-desc";

export function toProduct(item: Comparison): Product {
  // Primero las tiendas con stock: una tienda agotada no puede quedar como la
  // más barata de la tarjeta.
  const pricesByChain = [...item.prices]
    .sort((a, b) => Number(b.available !== false) - Number(a.available !== false) || a.price - b.price)
    .filter((price, priceIndex, prices) =>
      prices.findIndex(candidate => candidate.storeName === price.storeName) === priceIndex
    );
  // El card muestra cinco precios para mantener una altura legible. Conservamos
  // el conteo restante para no dar la impresión de que el distintivo es erróneo.
  const cheapestByChain = pricesByChain.slice(0, 5);
  // La etiqueta dice si el perfume se puede comparar. Antes un perfume de una
  // sola tienda mostraba sólo el nombre de la tienda y parecía una comparación.
  const storeCount = item.product.matchedStores ?? pricesByChain.length;
  const singleStore = pricesByChain[0]?.storeName ?? (item.product.source ? storeLabels[item.product.source] : undefined);
  const badge =
    storeCount > 1
      ? `En ${storeCount} tiendas`
      : item.product.priceIsMock
      ? "Precio demo"
      : singleStore
      ? `Solo en ${singleStore}`
      : "Solo en 1 tienda";
  return {
    id: item.product.id,
    aliases: item.product.aliases,
    brand: item.product.brand,
    name: item.product.name,
    size: item.product.unit,
    // "Perfumes" es la única categoría del catálogo y no aporta en el card.
    notes: item.product.category && item.product.category !== "Perfumes" ? [item.product.category] : [],
    image: productImageUrl(item.product.imageUrl),
    imageCandidates: productImageCandidates(item.product),
    prices: cheapestByChain.map((price, priceIndex) => ({
      id: price.storeId,
      store: price.storeName,
      price: money.format(price.price),
      offer: priceIndex === 0,
    })),
    extraStoreCount: Math.max(0, pricesByChain.length - cheapestByChain.length),
    badge,
    badgeTone: storeCount > 1 ? "compared" : "single",
  };
}

export function CatalogExplorer({ initialQuery = "" }: { initialQuery?: string }) {
  const optionalSession = useOptionalSession();
  const user = optionalSession?.user ?? null;
  const isAdmin = user?.role === "admin";

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // ── Leer estado desde la URL ────────────────────────────────────────────
  const urlQuery    = searchParams.get("q")      ?? initialQuery;
  const brand       = searchParams.get("brand")  ?? "";
  const category    = searchParams.get("cat")    ?? "";
  const gender      = searchParams.get("gender") ?? "";
  const minPriceParam = searchParams.get("minPrice") ?? "";
  const maxPriceParam = searchParams.get("maxPrice") ?? "";
  const store = searchParams.get("store") ?? "";
  const presentation = searchParams.get("presentation") ?? "";
  // Por defecto se muestran los perfumes comparables (2+ tiendas), que es lo que
  // promete el sitio. Con una búsqueda de texto se muestran todos: quien busca
  // un perfume puntual espera encontrarlo aunque esté en una sola tienda.
  const comparisonParam = searchParams.get("comparison") ?? "";
  const defaultComparison = urlQuery ? "all" : "multiple";
  const comparison = comparisonParam === "multiple" || comparisonParam === "all" ? comparisonParam : defaultComparison;
  const segmentParam = searchParams.get("segment") ?? "";
  const segment = isPerfumeSegment(segmentParam) ? segmentParam : "";
  const sort        = (searchParams.get("sort")  ?? "recommended") as SortMode;

  // ── Estado local solo para el input de búsqueda (tipeo rápido) ──────────
  // El valor del input vive en React state para respuesta inmediata.
  // Solo se sincroniza a la URL después de 300 ms de inactividad.
  const [inputValue, setInputValue] = useState(urlQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mantener el input sincronizado si la URL cambia desde afuera (Back/Forward).
  // Se ajusta durante el render para evitar un render extra desde un efecto.
  const [syncedQuery, setSyncedQuery] = useState(urlQuery);
  if (syncedQuery !== urlQuery) {
    setSyncedQuery(urlQuery);
    setInputValue(urlQuery);
  }

  // ── Datos del catálogo ──────────────────────────────────────────────────
  const [result, setResult] = useState<CatalogSearchResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filtros, orden y paginación se resuelven en el backend: sólo viaja la página
  // visible. La clave reúne los parámetros de la URL que afectan el resultado.
  const searchKey = useMemo(() => {
    const params = new URLSearchParams();
    for (const key of ["brand", "cat", "gender", "minPrice", "maxPrice", "store", "presentation", "segment", "sort", "page"]) {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    }
    params.set("comparison", comparison);
    if (urlQuery) params.set("q", urlQuery);
    params.set("pageSize", String(PRODUCTS_PER_PAGE));
    return params.toString();
  }, [searchParams, urlQuery, comparison]);

  useEffect(() => {
    let cancelled = false;
    // Espera breve para agrupar cambios seguidos (ej. escribir un precio).
    const timeout = window.setTimeout(async () => {
      try {
        const data = await api.searchCatalog(new URLSearchParams(searchKey));
        if (!cancelled) { setResult(data); setError(""); }
      } catch (reason) {
        if (!cancelled) setError(reason instanceof ApiError ? reason.message : "No se pudo cargar el catálogo.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 150);
    return () => { cancelled = true; window.clearTimeout(timeout); };
  }, [searchKey]);

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
    // Se usa el router de Next (no window.history directo) para que
    // useSearchParams() quede al tanto del cambio: si no, urlQuery queda
    // desactualizado y el input de búsqueda "revierte" al primer valor.
    // replace para filtros (no crea entrada en historial), push para paginación.
    if (mode === "push") router.push(url, { scroll: false });
    else router.replace(url, { scroll: false });
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

  /** El filtro de comparación sólo queda en la URL si difiere del valor por defecto */
  function setComparison(value: string) {
    setFilter("comparison", value === defaultComparison ? "" : value);
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

  // ── Resultado paginado del backend ──────────────────────────────────────
  const brands       = result?.facets.brands ?? [];
  const categories   = result?.facets.categories ?? [];
  const stores       = result?.facets.stores ?? [];
  const total        = result?.total ?? 0;
  const totalPages   = result?.totalPages ?? 1;
  const currentPage  = result?.page ?? 1;
  const products     = useMemo(() => (result?.items ?? []).map(toProduct), [result]);
  const comparableTotal = result?.comparableTotal ?? 0;
  const unfilteredTotal = result?.unfilteredTotal ?? 0;
  const filterCount  = [brand, category, gender, minPriceParam, maxPriceParam, store, presentation, comparison !== defaultComparison, segment].filter(Boolean).length;
  const activeSegment = perfumeSegments.find(option => option.value === segment) ?? perfumeSegments[0];

  const pageNumbers = useMemo(() => {
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  }, [currentPage, totalPages]);

  // ── Paginación ──────────────────────────────────────────────────────────
  function renderPagination() {
    if (total <= PRODUCTS_PER_PAGE) return null;
    return (
      <nav className={styles.pagination} aria-label="Páginas del catálogo">
        <button className={styles.pageArrow} onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} aria-label="Página anterior">
          <Icon name="arrow" size={16} />
        </button>
        <div className={styles.pageNumbers}>
          {pageNumbers.map(n => (
            <button key={n} className={n === currentPage ? styles.activePage : ""} onClick={() => goToPage(n)} aria-current={n === currentPage ? "page" : undefined}>
              {n}
            </button>
          ))}
        </div>
        <div className={styles.pageIndicator}><strong>{currentPage}</strong><span>de {totalPages}</span></div>
        <button className={styles.pageArrow} onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} aria-label="Página siguiente">
          <Icon name="arrow" size={16} />
        </button>
      </nav>
    );
  }

  const firstShown = Math.min((currentPage - 1) * PRODUCTS_PER_PAGE + 1, total);
  const lastShown = Math.min(currentPage * PRODUCTS_PER_PAGE, total);

  // ── Render ──────────────────────────────────────────────────────────────
  return (
    <section className={styles.explorer}>
      {/* Encabezado: título del segmento, conteo y orden */}
      <div className={styles.catalogHead}>
        <div>
          <h1>{activeSegment.title}</h1>
          <p>
            {loading
              ? "Buscando precios en 12 tiendas…"
              : total
              ? <>Mostrando {firstShown}–{lastShown} de <strong>{total.toLocaleString("es-CL")}</strong> perfumes</>
              : "Sin resultados"}
          </p>
        </div>
        <label className={styles.sort}>
          <span>Ordenar por</span>
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
      </div>

      {/* Segmentos como chips, igual que las categorías de la home */}
      <div className={styles.segments} role="group" aria-label="Tipo de perfumería">
        {perfumeSegments.map(option => (
          <button
            key={option.value || "all"}
            type="button"
            className={option.value === segment ? styles.segmentActive : undefined}
            aria-pressed={option.value === segment}
            onClick={() => setFilter("segment", option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Búsqueda en vivo dentro del catálogo */}
      <div className={styles.search}>
        <Icon name="search" size={18} />
        <label className="srOnly" htmlFor="catalog-search">Buscar en el catálogo</label>
        <input
          id="catalog-search"
          value={inputValue}
          onChange={e => handleSearchChange(e.target.value)}
          placeholder="Filtra por marca, nombre o familia olfativa"
        />
        <button type="button" className={styles.filterToggle} aria-expanded={filtersOpen} onClick={() => setFiltersOpen(o => !o)}>
          <Icon name="filter" size={18} />
          <span>Filtros{filterCount ? ` (${filterCount})` : ""}</span>
        </button>
      </div>

      {isAdmin && (
        <p className={styles.adminNote}>
          Eres admin: la sincronización de las 12 tiendas está en <Link href="/admin/sincronizacion">Panel → Sincronización</Link>.
        </p>
      )}

      {/* Cuando el texto buscado coincide con una o pocas marcas (ej. "Acqua
          di Gio" → Giorgio Armani), se sugiere la marca como atajo para ver
          todo su catálogo. Se oculta si ya hay un filtro de marca activo. */}
      {urlQuery && !brand && brands.length > 0 && (
        <div className={styles.brandSuggestions} aria-label="Marcas encontradas">
          <span>¿Buscabas la marca?</span>
          {brands.slice(0, 8).map(name => (
            <button key={name} onClick={() => setFilter("brand", name)}>{name}</button>
          ))}
        </div>
      )}

      {error ? (
        <p className={styles.error} role="alert">{error}</p>
      ) : (
        <div className={styles.catalogShell}>
          {/* ── Filtros ── */}
          <aside className={`${styles.filterRail} ${filtersOpen ? styles.openFilters : ""}`} aria-label="Filtros">
            <div className={styles.filterIntro}>
              <h2>Filtros</h2>
              <button onClick={resetFilters} disabled={!filterCount}>Borrar filtros</button>
            </div>
            <div className={styles.filters}>
              <fieldset className={styles.priceRange}>
                <legend>Precio</legend>
                <div>
                  <label>
                    <span className="srOnly">Desde</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="1000"
                      value={minPriceParam}
                      onChange={e => setFilter("minPrice", e.target.value)}
                      placeholder="Desde"
                    />
                  </label>
                  <label>
                    <span className="srOnly">Hasta</span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min="1"
                      step="1000"
                      value={maxPriceParam}
                      onChange={e => setFilter("maxPrice", e.target.value)}
                      placeholder="Hasta"
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
                Tienda
                <select value={store} onChange={e => setFilter("store", e.target.value)}>
                  <option value="">Todas las tiendas</option>
                  {stores.map(value => <option key={value}>{value}</option>)}
                </select>
              </label>
              {/* Se oculta mientras el catálogo tenga una sola categoría. */}
              {(categories.length > 1 || category) && (
                <label>
                  Categoría
                  <select value={category} onChange={e => setFilter("cat", e.target.value)}>
                    <option value="">Todas</option>
                    {categories.map(v => <option key={v}>{v}</option>)}
                  </select>
                </label>
              )}
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
                Comparación
                <select value={comparison} onChange={e => setComparison(e.target.value)}>
                  <option value="multiple">En 2 o más tiendas</option>
                  <option value="all">Todos los perfumes</option>
                </select>
              </label>
            </div>
            <p className={styles.filterNote}>Solo ofertas vendidas directamente por tiendas verificadas.</p>
          </aside>

          {/* ── Resultados ── */}
          <div className={styles.catalogStage}>
            {!loading && unfilteredTotal > 0 && (comparison === "multiple" || comparableTotal > 0) && (
              <p className={styles.comparableNotice}>
                {comparison === "multiple" ? (
                  <>
                    <span>
                      Ves los <strong>{comparableTotal.toLocaleString("es-CL")}</strong> perfumes que están en 2 o más tiendas.
                    </span>
                    {unfilteredTotal > comparableTotal && (
                      <button type="button" onClick={() => setComparison("all")}>Ver todos ({unfilteredTotal.toLocaleString("es-CL")})</button>
                    )}
                  </>
                ) : (
                  <>
                    <span>
                      <strong>{comparableTotal.toLocaleString("es-CL")}</strong> de {unfilteredTotal.toLocaleString("es-CL")} se pueden comparar entre tiendas.
                    </span>
                    <button type="button" onClick={() => setComparison("multiple")}>Ver solo comparables</button>
                  </>
                )}
              </p>
            )}

            {loading ? (
              <div className={styles.grid} aria-busy="true">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className={styles.cardSkeleton}>
                    <span className={styles.skeleton} />
                    <span className={styles.skeleton} style={{ width: "40%", height: 12 }} />
                    <span className={styles.skeleton} style={{ width: "85%", height: 16 }} />
                    <span className={styles.skeleton} style={{ height: 70 }} />
                  </div>
                ))}
              </div>
            ) : total === 0 ? (
              <div className={styles.empty}>
                <p>
                  {urlQuery.trim()
                    ? `No encontramos perfumes para "${urlQuery.trim()}".`
                    : "Ningún perfume coincide con los filtros elegidos."}
                </p>
                {filterCount > 0 && <button type="button" onClick={resetFilters}>Borrar filtros</button>}
              </div>
            ) : (
              <div className={styles.grid}>
                {products.map(product => (
                  <ProductCard key={product.id} product={product} href={productHref(product.id)} />
                ))}
              </div>
            )}

            {!loading && total > PRODUCTS_PER_PAGE && (
              <div className={styles.paginationWrap}>{renderPagination()}</div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
