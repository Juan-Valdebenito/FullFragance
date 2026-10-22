"use client";
import { useEffect, useId, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api, ApiError, productImageCandidates } from "@/shared/api/client";
import type { ApiPrice, Comparison, PriceHistoryPoint, ProductDetailResult } from "@/shared/api/types";
import { BrandIcon } from "@/shared/components/BrandIcon";
import { Icon } from "@/shared/components/Icon";
import { useImageFallback } from "@/shared/hooks/useImageFallback";
import { FavoriteButton } from "./FavoriteButton";
import styles from "./ProductDetail.module.css";

const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const shortDate = new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "short" });
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

function PriceHistory({ history }: { history: PriceHistoryPoint[] }) {
  const gradientId = useId();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  if (!history.length) {
    return (
      <section className={styles.historyPanel} aria-labelledby="history-title">
        <h2 id="history-title">Historial de precios</h2>
        <p className={styles.historyEmpty}>El historial comenzará con la próxima sincronización de esta fragancia.</p>
      </section>
    );
  }

  const width = 520;
  const height = 240;
  const padding = { top: 22, right: 18, bottom: 34, left: 76 };
  const prices = history.map(point => point.minPrice);
  const rawMin = Math.min(...prices);
  const rawMax = Math.max(...prices);
  // Un margen mínimo evita exagerar visualmente variaciones pequeñas.
  const spread = Math.max(rawMax - rawMin, rawMin * .05, 1000);
  const min = Math.max(0, rawMin - spread * .12);
  const max = rawMax + spread * .12;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const times = history.map(point => Date.parse(`${point.date}T00:00:00Z`));
  const timeSpan = times[times.length - 1] - times[0];
  const x = (index: number) => padding.left + (timeSpan === 0 ? chartWidth / 2 : (times[index] - times[0]) * chartWidth / timeSpan);
  const y = (price: number) => padding.top + (max - price) * chartHeight / (max - min);
  const line = history.map((point, index) => `${x(index)},${y(point.minPrice)}`).join(" ");
  const latest = history[history.length - 1];
  const lowest = history.reduce((best, point) => point.minPrice < best.minPrice ? point : best);
  const dateLabel = (date: string) => shortDate.format(new Date(`${date}T12:00:00`));
  const selectedIndex = history.findIndex(point => point.date === selectedDate);
  const activeIndex = selectedIndex < 0 ? history.length - 1 : selectedIndex;
  const active = history[activeIndex];
  const difference = latest.minPrice - history[0].minPrice;
  const change = history[0].minPrice > 0 ? difference / history[0].minPrice * 100 : 0;
  const ticks = Array.from({ length: 4 }, (_, index) => min + (max - min) * index / 3);
  const baseline = height - padding.bottom;

  return (
    <section className={styles.historyPanel} aria-labelledby="history-title">
      <div className={styles.historyHeading}>
        <div>
          <span className={styles.historyEyebrow}>EVOLUCIÓN DEL PRECIO</span>
          <h2 id="history-title">¿Es un buen momento?</h2>
          <p>Historial del mejor precio diario · hasta 180 días</p>
        </div>
      </div>
      <div className={styles.historySummary}>
        <div><span className={styles.historyCaption}>Último precio registrado</span><strong className={styles.historyLatest}>{money.format(latest.minPrice)}</strong></div>
        {history.length > 1 && <span className={styles.historyChange} data-direction={difference < 0 ? "down" : difference > 0 ? "up" : "flat"}>
          {difference === 0 ? "Sin cambios" : `${difference < 0 ? "↓" : "↑"} ${Math.abs(change).toLocaleString("es-CL", { maximumFractionDigits: 2 })}%`}
          <small>desde el {dateLabel(history[0].date)}</small>
        </span>}
      </div>
      <dl className={styles.historyStats}>
        <div><dt>Mínimo registrado</dt><dd>{money.format(lowest.minPrice)}</dd></div>
        <div><dt>Máximo registrado</dt><dd>{money.format(rawMax)}</dd></div>
      </dl>
      <div className={styles.chartScroller} onPointerMove={event => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const position = (event.clientX - bounds.left) / bounds.width * width;
        const closest = history.reduce((best, _, index) => Math.abs(x(index) - position) < Math.abs(x(best) - position) ? index : best, 0);
        setSelectedDate(history[closest].date);
      }}>
        <svg className={styles.historyChart} viewBox={`0 0 ${width} ${height}`} role="img" aria-labelledby="history-chart-title history-chart-desc">
          <title id="history-chart-title">Evolución del mejor precio</title>
          <desc id="history-chart-desc">Desde {money.format(history[0].minPrice)} el {dateLabel(history[0].date)} hasta {money.format(latest.minPrice)} el {dateLabel(latest.date)}.</desc>
          <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--gold)" stopOpacity=".26" /><stop offset="100%" stopColor="var(--gold)" stopOpacity=".015" /></linearGradient></defs>
          {ticks.map(price => (
            <g key={price}>
              <line className={styles.chartGrid} x1={padding.left} x2={width - padding.right} y1={y(price)} y2={y(price)} />
              <text className={styles.chartPriceLabel} x={padding.left - 10} y={y(price) + 4}>{money.format(price)}</text>
            </g>
          ))}
          {history.length > 1 && <>
            <polygon points={`${x(0)},${baseline} ${line} ${x(history.length - 1)},${baseline}`} fill={`url(#${gradientId})`} />
            <polyline className={styles.chartLine} points={line} />
          </>}
          <line className={styles.chartCursor} x1={x(activeIndex)} x2={x(activeIndex)} y1={padding.top} y2={baseline} />
          {history.map((point, index) => (
            <circle key={point.date} className={styles.chartPoint} cx={x(index)} cy={y(point.minPrice)} r={history.length > 30 ? 0 : 3}>
              <title>{dateLabel(point.date)}: {money.format(point.minPrice)} en {point.storeName}</title>
            </circle>
          ))}
          <circle cx={x(activeIndex)} cy={y(active.minPrice)} r="10" fill="var(--gold)" opacity=".17" />
          <circle className={styles.chartPoint} cx={x(activeIndex)} cy={y(active.minPrice)} r="5" />
          <text className={styles.chartDateLabel} x={padding.left} y={height - 8}>{dateLabel(history[0].date)}</text>
          {history.length > 1 && <text className={styles.chartDateLabel} x={width - padding.right} y={height - 8} textAnchor="end">{dateLabel(latest.date)}</text>}
        </svg>
      </div>
      <div className={styles.historyReadout}>
        <div><span>{dateLabel(active.date)}</span><strong>{active.storeName}</strong></div>
        <strong>{money.format(active.minPrice)}</strong>
      </div>
      {history.length > 1 && <label className={styles.historyControl}>
        <span>Explora los precios por fecha <small>{history.length} registros</small></span>
        <input type="range" min="0" max={history.length - 1} value={activeIndex} onChange={event => setSelectedDate(history[Number(event.target.value)].date)} aria-valuetext={`${dateLabel(active.date)}: ${money.format(active.minPrice)} en ${active.storeName}`} />
      </label>}
      {history.length === 1 && <p className={styles.historyHint}>Hay una observación registrada. La tendencia aparecerá tras nuevas sincronizaciones.</p>}
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

  // Respaldo: si el servidor no obtuvo los datos (backend en cold start), se
  // reintenta desde el navegador.
  useEffect(() => {
    if (initialResult) return;
    api.productPrices(productId)
      .then(setResult)
      .catch(reason => setError(reason instanceof ApiError ? reason.message : "No se pudo cargar el perfume."));
  }, [productId, initialResult]);

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
            <Link href={backHref}>Volver al catálogo</Link>
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
            {offers.length === 1 ? "Precio en 1 tienda" : `Precios en ${offers.length} tiendas`}
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

      {/* Abajo: ficha del perfume */}
      <section className={styles.details}>
        <div className={styles.about}>
          <h2>Acerca de este perfume</h2>
          {facts.length > 0 && (
            <dl className={styles.facts}>
              {facts.map(fact => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
            </dl>
          )}
          {description && <p>{description}</p>}

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
        <PriceHistory history={result?.history ?? []} />
      </section>
    </main>
  );
}
