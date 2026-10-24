"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, ApiError, productImageCandidates } from "@/shared/api/client";
import type { ApiPrice, Comparison, PriceHistoryPoint, ProductDetailResult, StorePriceHistoryPoint } from "@/shared/api/types";
import { BrandIcon } from "@/shared/components/BrandIcon";
import { Icon } from "@/shared/components/Icon";
import { useImageFallback } from "@/shared/hooks/useImageFallback";
import { FavoriteButton } from "./FavoriteButton";
import styles from "./ProductDetail.module.css";

const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const shortDate = new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short" });
const detailDate = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", year: "numeric" });
const stores: Record<string, string> = {
  Sephora: "https://www.sephora.cl",
  Falabella: "https://www.falabella.com/falabella-cl",
  Ripley: "https://simple.ripley.cl",
  "Alisha Perfumes": "https://alishaperfumes.cl",
  "Silk Perfumes": "https://silkperfumes.cl",
  "Elite Perfumes": "https://www.eliteperfumes.cl",
  Cosmetic: "https://cosmetic.cl",
  Paris: "https://www.paris.cl",
  ABC: "https://www.abc.cl",
  Preunic: "https://preunic.cl",
  "L'Odoro": "https://www.lodoro.cl",
  "Le Paris Parfums": "https://leparisparfums.com",
  "Dreams Parfums": "https://dreamsparfums.cl",
  "La Polar": "https://www.lapolar.cl",
};

const noteIconFor = (family: string): "leaf" | "tree" | "flower" =>
  family.includes("Amader") ? "tree" : family.includes("Floral") ? "flower" : "leaf";

const noteToneFor = (family: string) => {
  const normalizedFamily = family.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  if (normalizedFamily.includes("floral")) return "Floral";
  if (normalizedFamily.includes("amader")) return "Woody";
  if (normalizedFamily.includes("citr")) return "Citrus";
  if (normalizedFamily.includes("frut")) return "Fruity";
  if (normalizedFamily.includes("orient") || normalizedFamily.includes("espec")) return "Spicy";
  return "Fresh";
};

const isAvailable = (price: ApiPrice) => price.available !== false;

// Un precio por tienda (el más bajo), primero las que tienen stock y luego de
// más barata a más cara. Así "Mejor precio" nunca cae en una tienda agotada.
function offersByStore(prices: ApiPrice[]) {
  const cheapestByStore = new Map<string, ApiPrice>();
  for (const price of prices) {
    const storeKey = price.storeId || price.storeName;
    const current = cheapestByStore.get(storeKey);
    if (!current || price.price < current.price) cheapestByStore.set(storeKey, price);
  }
  return [...cheapestByStore.values()].sort(
    (a, b) => Number(isAvailable(b)) - Number(isAvailable(a)) || a.price - b.price,
  );
}

function storeUrl(price: ApiPrice, productName: string) {
  return price.productUrl
    ?? stores[price.storeName]
    ?? `https://www.google.com/search?q=${encodeURIComponent(`${productName} ${price.storeName}`)}`;
}

function volumeInMl(unit: string, isSet = false) {
  if (isSet) return null;
  const match = unit.match(/(\d+(?:[.,]\d+)?)\s*ml\b/i);
  if (!match) return null;
  const volume = Number(match[1].replace(",", "."));
  return Number.isFinite(volume) && volume > 0 ? volume : null;
}

const chartColors = ["var(--chart-series-1)", "var(--chart-series-2)", "var(--chart-series-3)", "var(--chart-series-4)", "var(--chart-series-5)", "var(--chart-series-6)"];

type ChartPoint = StorePriceHistoryPoint & { isCurrent?: boolean };

function PriceHistory({ history, storeHistory = [], prices = [] }: { history: PriceHistoryPoint[]; storeHistory?: StorePriceHistoryPoint[]; prices?: ApiPrice[] }) {
  // Compatibilidad con historiales ya guardados antes de exponer cada tienda.
  const historical = storeHistory.length
    ? storeHistory
    : history.map(point => ({ date: point.date, price: point.minPrice, storeId: point.storeName, storeName: point.storeName, available: point.available }));
  // Una oferta vigente también se muestra aunque esa tienda todavía no tenga
  // historial. Es un punto "actual", no una observación retroactiva.
  const today = new Date().toISOString().slice(0, 10);
  const currentPoints: ChartPoint[] = prices
    .filter(price => price.price > 0)
    .map(price => ({ date: today, price: price.price, storeId: price.storeId, storeName: price.storeName, available: price.available !== false, isCurrent: true }));
  const observations: ChartPoint[] = [...historical, ...currentPoints.filter(current => !historical.some(point => point.storeId === current.storeId && point.date === current.date))];
  const allDates = [...new Set(observations.map(point => point.date))].sort();
  const [from, setFrom] = useState("");
  const [until, setUntil] = useState("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (!observations.length) {
    return (
      <section className={styles.historyPanel} aria-labelledby="history-title">
        <h2 id="history-title">Historial de precios</h2>
        <p className={styles.historyEmpty}>El historial comenzará con la próxima sincronización de esta fragancia.</p>
      </section>
    );
  }

  const earliest = allDates[0];
  const latestDate = allDates.at(-1)!;
  const visible = observations.filter(point => (!from || point.date >= from) && (!until || point.date <= until));
  const dates = [...new Set(visible.map(point => point.date))].sort();
  const width = 900;
  const height = 300;
  const padding = { top: 18, right: 24, bottom: 48, left: 82 };
  const visiblePrices = visible.map(point => point.price);
  if (!visiblePrices.length) {
    return (
      <section className={styles.historyPanel} aria-labelledby="history-title">
        <div className={styles.historyHeading}><div><span className={styles.historyEyebrow}>EVOLUCIÓN DEL PRECIO</span><h2 id="history-title">Precio histórico por tienda</h2></div></div>
        <p className={styles.historyEmpty}>No hay precios registrados dentro del período seleccionado.</p>
      </section>
    );
  }
  const rawMin = Math.min(...visiblePrices);
  const rawMax = Math.max(...visiblePrices);
  const spread = Math.max(rawMax - rawMin, rawMin * .05, 1000);
  const min = Math.max(0, rawMin - spread * .12);
  const max = rawMax + spread * .12;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const times = dates.map(date => Date.parse(`${date}T00:00:00Z`));
  const timeSpan = times.at(-1)! - times[0];
  const x = (date: string) => padding.left + (timeSpan === 0 ? chartWidth / 2 : (Date.parse(`${date}T00:00:00Z`) - times[0]) * chartWidth / timeSpan);
  const y = (price: number) => padding.top + (max - price) * chartHeight / (max - min);
  const dateLabel = (date: string) => shortDate.format(new Date(`${date}T12:00:00`));
  const activeDate = dates.includes(selectedDate ?? "") ? selectedDate! : dates.at(-1)!;
  const active = visible.filter(point => point.date === activeDate);
  const stores = [...new Map([...prices.map(price => [price.storeId, price.storeName] as const), ...observations.map(point => [point.storeId, point.storeName] as const)]).entries()]
    .map(([id, name], index) => ({ id, name, color: chartColors[index % chartColors.length] }));
  const storesWithHistory = new Set(historical.map(point => point.storeId)).size;
  const ticks = Array.from({ length: 5 }, (_, index) => min + (max - min) * index / 4);
  const baseline = height - padding.bottom;
  const labelEvery = Math.max(1, Math.ceil(dates.length / 12));

  return (
    <section className={styles.historyPanel} aria-labelledby="history-title">
      <div className={styles.historyHeading}>
        <div>
          <h2 id="history-title">Precio histórico por tienda</h2>
          <p className={styles.historyCoverage}>{stores.length} ofertas vigentes · {storesWithHistory} con historial · los círculos vacíos muestran un precio actual sin historial.</p>
        </div>
        <div className={styles.historyFilters}>
          <label>Desde<input type="date" min={earliest} max={until || latestDate} value={from} onChange={event => setFrom(event.target.value)} /></label>
          <label>Hasta<input type="date" min={from || earliest} max={latestDate} value={until} onChange={event => setUntil(event.target.value)} /></label>
        </div>
      </div>
      <div className={styles.chartScroller} onPointerMove={event => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const position = (event.clientX - bounds.left) / bounds.width * width;
        const closest = dates.reduce((best, date) => Math.abs(x(date) - position) < Math.abs(x(best) - position) ? date : best, dates[0]);
        setSelectedDate(closest);
      }}>
        <svg className={styles.historyChart} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Precios de oferta por tienda entre ${dateLabel(dates[0])} y ${dateLabel(dates.at(-1)!)}`}>
          {ticks.map(price => (
            <g key={price}>
              <line className={styles.chartGrid} x1={padding.left} x2={width - padding.right} y1={y(price)} y2={y(price)} />
              <text className={styles.chartPriceLabel} x={padding.left - 10} y={y(price) + 4}>{money.format(price)}</text>
            </g>
          ))}
          {stores.map(store => {
            const points = visible.filter(point => point.storeId === store.id);
            const recorded = points.filter(point => !point.isCurrent);
            return <g key={store.id}>{recorded.length > 1 && <polyline className={styles.chartLine} style={{ stroke: store.color }} points={recorded.map(point => `${x(point.date)},${y(point.price)}`).join(" ")} />}{points.map(point => <circle key={`${point.storeId}-${point.date}-${point.isCurrent ? "current" : "history"}`} className={styles.chartPoint} style={{ fill: point.isCurrent ? "var(--surface-lowest)" : store.color, stroke: store.color }} cx={x(point.date)} cy={y(point.price)} r={point.isCurrent ? "5" : "4"} />)}</g>;
          })}
          <line className={styles.chartCursor} x1={x(activeDate)} x2={x(activeDate)} y1={padding.top} y2={baseline} />
          {dates.map((date, index) => (index % labelEvery === 0 || index === dates.length - 1) && <text key={date} className={styles.chartDateLabel} x={x(date)} y={height - 16} textAnchor="middle">{dateLabel(date)}</text>)}
          <text className={styles.chartAxisTitle} x="20" y={height / 2} transform={`rotate(-90 20 ${height / 2})`}>Precio</text>
        </svg>
      </div>
      <div className={styles.historyLegend} aria-label="Tiendas">
        {stores.map(store => {
          const records = visible.filter(point => point.storeId === store.id && !point.isCurrent).length;
          return <span key={store.id}><i style={{ backgroundColor: store.color }} />{store.name} <small>{records ? `(${records} ${records === 1 ? "registro" : "registros"})` : "(precio actual)"}</small></span>;
        })}
      </div>
      <div className={styles.historyReadout}>
        <div><span>{dateLabel(activeDate)}</span><strong>{active.length} tienda{active.length === 1 ? "" : "s"} registrada{active.length === 1 ? "" : "s"}</strong></div>
        <ul className={styles.historyValues}>{active.map(point => <li key={point.storeId}><span>{point.storeName}{point.isCurrent ? " · actual" : ""}</span><strong>{money.format(point.price)}</strong></li>)}</ul>
      </div>
      {dates.length > 1 && <label className={styles.historyControl}>
        <span>Explorar fecha <small>{dateLabel(activeDate)}</small></span>
        <input type="range" min="0" max={dates.length - 1} value={dates.indexOf(activeDate)} onChange={event => setSelectedDate(dates[Number(event.target.value)])} aria-valuetext={`${dateLabel(activeDate)}: ${active.map(point => `${point.storeName} ${money.format(point.price)}`).join(", ")}`} />
      </label>}
      <details className={styles.historyData}>
        <summary>Ver datos del gráfico en tabla</summary>
        <div><table><caption>Precios registrados por fecha y tienda</caption><thead><tr><th>Fecha</th><th>Tienda</th><th>Precio</th><th>Tipo</th></tr></thead><tbody>{visible.map(point => <tr key={`${point.storeId}-${point.date}-${point.isCurrent ? "current" : "history"}`}><td>{dateLabel(point.date)}</td><td>{point.storeName}</td><td>{money.format(point.price)}</td><td>{point.isCurrent ? "Precio actual" : "Historial"}</td></tr>)}</tbody></table></div>
      </details>
    </section>
  );
}

interface ProductDetailProps {
  productId: string;
  /**
   * URL de vuelta al catálogo (incluye página y filtros activos).
   * Si no se pasa, vuelve a /dashboard sin estado.
   */
  backHref?: string;
  /** Datos pedidos en el servidor. Sin ellos, el componente los pide en el navegador. */
  initialResult?: ProductDetailResult | null;
}

export function ProductDetail({ productId, backHref = "/dashboard", initialResult = null }: ProductDetailProps) {
  const [result, setResult] = useState<ProductDetailResult | null>(initialResult);
  const [error, setError] = useState("");
  const [similar, setSimilar] = useState<Comparison[]>([]);

  const loadProduct = useCallback(() => {
    setError("");
    return api.productPrices(productId)
      .then(setResult)
      .catch(reason => setError(reason instanceof ApiError ? reason.message : "No se pudo cargar el perfume."));
  }, [productId]);

  // Respaldo: si el servidor no obtuvo los datos (backend en cold start), se
  // reintenta desde el navegador.
  useEffect(() => {
    if (initialResult) return;
    void loadProduct();
  }, [initialResult, loadProduct]);

  const offers = useMemo(() => offersByStore(result?.prices ?? []), [result]);
  const buyable = offers.filter(isAvailable);
  const best = buyable[0];
  const hasComparison = offers.length > 1;
  const savings = buyable.length > 1 ? buyable[buyable.length - 1].price - buyable[0].price : 0;

  // Si está en una sola tienda, se buscan otras versiones que sí se comparan.
  useEffect(() => {
    if (!result || hasComparison) return;
    api.similarProducts(productId).then(setSimilar).catch(() => setSimilar([]));
  }, [productId, result, hasComparison]);

  const product = result?.product ?? null;
  const imageCandidates = useMemo(() => (product ? productImageCandidates(product) : []), [product]);
  const { image, markFailed } = useImageFallback(imageCandidates);

  if (!product) {
    return (
      <main className={`container ${styles.state}`}>
        {error ? (
          <>
            <p>{error}</p>
            <div className={styles.stateActions}><button type="button" onClick={() => void loadProduct()}>Reintentar</button><Link href={backHref}>Volver al catálogo</Link></div>
          </>
        ) : (
          <p aria-busy="true">Cargando perfume…</p>
        )}
      </main>
    );
  }

  const fullName = `${product.brand} ${product.name}`;
  // Sólo datos reales: la descripción viene del perfil o de la tienda, y las
  // notas deducidas del nombre (notesInferred) no se presentan como hechos.
  const description = product.description?.trim() || null;
  const notes = product.notesInferred ? [] : product.olfactoryNotes ?? [];
  const facts = [
    { label: "Marca", value: product.brand !== "Sin marca" ? product.brand : null },
    { label: "Presentación", value: product.unit || null },
    { label: "Público", value: product.gender || null },
    { label: "Tiendas", value: offers.length ? `${offers.length} ${offers.length === 1 ? "tienda" : "tiendas"}` : null },
  ].filter(fact => fact.value);
  const volume = volumeInMl(product.unit, product.isSet);
  const latestHistory = result?.history.at(-1);
  const purchaseFacts = [
    { label: "Precio por ml", value: best && volume ? `${money.format(best.price / volume)} / ml` : null },
    { label: "Disponibilidad", value: offers.length ? `${buyable.length} de ${offers.length} tiendas` : "Sin ofertas" },
    { label: "Ahorro posible", value: savings > 0 ? money.format(savings) : hasComparison ? "Mismo precio" : null },
    { label: "Última revisión", value: latestHistory ? detailDate.format(new Date(`${latestHistory.date}T12:00:00`)) : null },
  ].filter(fact => fact.value);
  const purchaseMessage = !best
    ? "No hay stock disponible por ahora. Puedes guardar el perfume y volver a revisar más adelante."
    : savings > 0
      ? `La oferta de ${best.storeName} permite ahorrar ${money.format(savings)} frente a la alternativa disponible más cara.`
      : hasComparison
        ? "Las tiendas disponibles tienen el mismo precio. Conviene elegir según despacho, retiro y condiciones de cada tienda."
        : "Solo encontramos una tienda con esta presentación. Revisa el historial antes de comprar para tener una referencia del precio.";

  return (
    <main className={`container ${styles.main}`}>
      {/* Breadcrumb con vuelta al estado exacto del catálogo */}
      <nav className={styles.breadcrumb} aria-label="Ruta">
        <Link href={backHref}>Catálogo</Link>
        <Icon name="arrow" size={14} />
        <Link href={`/dashboard?brand=${encodeURIComponent(product.brand)}`}>{product.brand}</Link>
        <Icon name="arrow" size={14} />
        <span aria-current="page">{product.name}</span>
      </nav>

      {/* Arriba: foto + nombre, mejor precio y tiendas. El h1 va primero en el
          DOM para lectores de pantalla y buscadores. */}
      <section className={styles.hero}>
        <div className={styles.summary}>
          <Link className={styles.brand} href={`/dashboard?brand=${encodeURIComponent(product.brand)}`}>{product.brand}</Link>
          <h1>{product.name}</h1>
          <div className={styles.tags}>
            {product.unit && <span>{product.unit}</span>}
            {product.gender && <span>{product.gender}</span>}
            {product.isSet && <span>Set o kit</span>}
          </div>

          {best ? (
            <div className={styles.bestBox}>
              <div className={styles.bestTop}>
                <span>Mejor precio hoy</span>
                {hasComparison && <span className={styles.storeCount}><Icon name="swap" size={16} /> {offers.length} tiendas comparadas</span>}
              </div>
              <strong className={styles.bestPrice}>{money.format(best.price)}</strong>
              <p className={styles.bestStore}>
                en <strong>{best.storeName}</strong>
                {savings > 0 && <> · ahorras hasta <strong>{money.format(savings)}</strong></>}
              </p>
              <div className={styles.bestActions}>
                <a className={styles.buyButton} href={storeUrl(best, fullName)} target="_blank" rel="noopener noreferrer">
                  Ir a {best.storeName} <span aria-hidden="true">↗</span>
                </a>
                <FavoriteButton productId={product.id} aliases={product.aliases} large />
              </div>
            </div>
          ) : (
            <div className={styles.bestBox}>
              <div className={styles.bestTop}><span>Sin stock por ahora</span></div>
              <p className={styles.bestStore}>Ninguna tienda lo tiene disponible hoy. Guárdalo para revisarlo más tarde.</p>
              <div className={styles.bestActions}>
                <FavoriteButton productId={product.id} aliases={product.aliases} large />
              </div>
            </div>
          )}
        </div>

        <div className={styles.visual}>
          {image ? (
            <Image
              src={image}
              unoptimized
              alt={`${product.name} de ${product.brand}`}
              fill
              priority
              sizes="(max-width: 900px) 100vw, 45vw"
              onError={() => markFailed(image)}
            />
          ) : (
            <span className={styles.visualPlaceholder}><BrandIcon size={96} /></span>
          )}
        </div>

        <section className={styles.offers} aria-labelledby="offers-title">
          <h2 id="offers-title">
            {offers.length === 1 ? "Oferta actual" : `Ofertas actuales en ${offers.length} tiendas`}
          </h2>
          {offers.length ? (
            <ol className={styles.offerList}>
              {offers.map(price => {
                const available = isAvailable(price);
                const isBest = price === best;
                return (
                  <li
                    key={`${price.storeId}-${price.storeName}`}
                    className={`${styles.offerRow} ${isBest ? styles.offerBest : ""} ${available ? "" : styles.offerSoldOut}`}
                  >
                    <span className={styles.offerStore}>
                      <strong>{price.storeName}</strong>
                      <small>{isBest ? "Más barato" : available ? "Disponible online" : "Sin stock"}</small>
                    </span>
                    <strong className={styles.offerPrice}>{money.format(price.price)}</strong>
                    <a href={storeUrl(price, fullName)} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${product.name} en ${price.storeName}`}>
                      Ver <span aria-hidden="true">↗</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className={styles.noOffers}>Todavía no hay precios disponibles.</p>
          )}
          {hasComparison && (
            <p className={styles.matchNote}>
              <Icon name="search" size={14} /> Verificamos que es el mismo perfume, formato y concentración en cada tienda.
            </p>
          )}
        </section>
      </section>

      {!hasComparison && similar.length > 0 && (
        <section className={styles.similarPanel} aria-labelledby="similar-title">
          <h2 id="similar-title">Otras versiones que sí se pueden comparar</h2>
          <p>Mismo perfume en otro tamaño o concentración, disponible en varias tiendas.</p>
          <div className={styles.similarList}>
            {similar.map(item => (
              <Link key={item.product.id} href={`/perfumes/${item.product.id}`} className={styles.similarItem}>
                <strong>{item.product.name}</strong>
                <small>En {item.product.matchedStores ?? item.prices.length} tiendas{item.product.unit ? ` · ${item.product.unit}` : ""}</small>
                {item.minPrice ? <span>desde {money.format(item.minPrice)}</span> : null}
              </Link>
            ))}
          </div>
        </section>
      )}

      <PriceHistory history={result?.history ?? []} storeHistory={result?.storeHistory} prices={result?.prices ?? []} />

      {/* Información editorial del perfume, después de la decisión de compra. */}
      <section className={styles.details}>
        <div className={styles.about}>
          <h2>Acerca de este perfume</h2>
          {facts.length > 0 && (
            <dl className={styles.facts}>
              {facts.map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
            </dl>
          )}
          {description && <p>{description}</p>}

          <section className={styles.purchaseSummary} aria-labelledby="purchase-summary-title">
            <h3 id="purchase-summary-title">Resumen de compra</h3>
            <dl>
              {purchaseFacts.map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
            </dl>
            <p>{purchaseMessage}</p>
          </section>

          {notes.length > 0 && (
            <>
              <h3>Notas olfativas</h3>
              <div className={styles.notesGrid}>
                {notes.map(note => (
                  <article key={note.id} className={`${styles.noteBadge} ${styles[`note${noteToneFor(note.family)}`]}`}>
                    <span className={styles.noteIcon} aria-hidden="true"><Icon name={noteIconFor(note.family)} size={20} /></span>
                    <div>
                      <strong>{note.name}</strong>
                      <small>{note.family}</small>
                      {note.description && <p>{note.description}</p>}
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}
