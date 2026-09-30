"use client";

import { useMemo, useState } from "react";
import type { OpportunityTag, PriceHistoryPoint } from "@/shared/api/types";
import styles from "./PriceHistoryChart.module.css";

const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const CHART_WIDTH = 500;
const CHART_HEIGHT = 196;
const CHART_PADDING = { top: 16, right: 16, bottom: 30, left: 46 };

const shortDate = (date: string) => new Date(date).toLocaleDateString("es-CL", { day: "numeric", month: "short" });

interface PriceHistoryChartProps {
  history30d?: PriceHistoryPoint[];
  history90d?: PriceHistoryPoint[];
  opportunity?: OpportunityTag;
  currentPrice: number;
}

export function PriceHistoryChart({
  history30d = [],
  history90d = [],
  opportunity,
  currentPrice,
}: PriceHistoryChartProps) {
  const [range, setRange] = useState<"30" | "90">("30");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const activePoints = useMemo(() => {
    if (range === "30") {
      return history30d.length ? history30d : history90d.slice(-30);
    }
    return history90d.length ? history90d : history30d;
  }, [range, history30d, history90d]);

  const { minPrice, maxPrice, avgPrice, points, minPointIndex } = useMemo(() => {
    if (!activePoints.length) {
      return { minPrice: 0, maxPrice: 0, avgPrice: 0, points: [], minPointIndex: -1 };
    }

    const prices = activePoints.map((p) => p.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
    const minIdx = prices.lastIndexOf(min);

    const width = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
    const height = CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom;

    const rangeY = max - min || 1;

    const mapped = activePoints.map((pt, idx) => {
      const x = CHART_PADDING.left + (idx / Math.max(1, activePoints.length - 1)) * width;
      const normalizedY = (pt.price - min) / rangeY;
      const y = CHART_PADDING.top + height - normalizedY * height;
      return { ...pt, x, y, index: idx };
    });

    return { minPrice: min, maxPrice: max, avgPrice: avg, points: mapped, minPointIndex: minIdx };
  }, [activePoints]);

  const svgPath = useMemo(() => {
    if (!points.length) return "";
    return points.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, "");
  }, [points]);

  const areaPath = useMemo(() => {
    if (!points.length) return "";
    const firstX = points[0].x.toFixed(1);
    const lastX = points[points.length - 1].x.toFixed(1);
    return `${svgPath} L ${lastX} ${CHART_HEIGHT - CHART_PADDING.bottom} L ${firstX} ${CHART_HEIGHT - CHART_PADDING.bottom} Z`;
  }, [points, svgPath]);

  const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : null;
  const gridValues = [maxPrice, Math.round((maxPrice + minPrice) / 2), minPrice];
  const dateLabels = [points[0], points[Math.floor((points.length - 1) / 2)], points[points.length - 1]];

  const tagClass = opportunity?.type === "great_deal" || opportunity?.type === "lowest_30" || opportunity?.type === "lowest_90"
    ? styles.tagGreatDeal
    : opportunity?.type === "trending_up"
      ? styles.tagTrendingUp
      : styles.tagStable;

  if (!points.length) return null;

  return (
    <section className={styles.container} aria-label="Historial y gráfico de tendencia de precios">
      <header className={styles.header}>
        <div>
          <div className={styles.headerTitle}>
            <h3>Tendencia de precios</h3>
            {opportunity && (
              <span className={`${styles.opportunityTag} ${tagClass}`}>
                {opportunity.label}
              </span>
            )}
          </div>
          <p className={styles.headerHint}>Evolución del menor precio disponible en tiendas locales.</p>
        </div>
        <div className={styles.toggleGroup} role="radiogroup" aria-label="Rango de tiempo">
          <button
            type="button"
            role="radio"
            className={`${styles.toggleBtn} ${range === "30" ? styles.toggleActive : ""}`}
            onClick={() => setRange("30")}
            aria-checked={range === "30"}
          >
            30 días
          </button>
          <button
            type="button"
            role="radio"
            className={`${styles.toggleBtn} ${range === "90" ? styles.toggleActive : ""}`}
            onClick={() => setRange("90")}
            aria-checked={range === "90"}
          >
            90 días
          </button>
        </div>
      </header>

      {/* Tarjetas de Métricas de Resumen */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Precio actual</span>
          <strong className={styles.statValue}>{money.format(currentPrice)}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Mínimo ({range}d)</span>
          <strong className={`${styles.statValue} ${styles.statMin}`}>{money.format(minPrice)}</strong>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Promedio ({range}d)</span>
          <strong className={styles.statValue}>{money.format(avgPrice)}</strong>
        </div>
      </div>

      <div className={styles.chartHeader}>
        <span>Historial de {range} días</span>
        <span>Desliza sobre el gráfico para ver el detalle</span>
      </div>

      {/* Gráfico interactivo SVG */}
      <div className={styles.chartWrapper}>
        <svg
          className={styles.svgChart}
          viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={`Gráfico de precios entre ${money.format(minPrice)} y ${money.format(maxPrice)} durante los últimos ${range} días`}
          onMouseLeave={() => setHoverIndex(null)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const normalizedX = mouseX / rect.width;
            const index = Math.min(
              points.length - 1,
              Math.max(0, Math.round(normalizedX * (points.length - 1)))
            );
            setHoverIndex(index);
          }}
        >
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#987148" stopOpacity="0.26" />
              <stop offset="100%" stopColor="#987148" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {gridValues.map((value, index) => {
            const y = CHART_PADDING.top + ((maxPrice - value) / (maxPrice - minPrice || 1)) * (CHART_HEIGHT - CHART_PADDING.top - CHART_PADDING.bottom);
            return (
              <g key={`${value}-${index}`}>
                <line x1={CHART_PADDING.left} x2={CHART_WIDTH - CHART_PADDING.right} y1={y} y2={y} className={styles.gridLine} />
                <text x={CHART_PADDING.left - 8} y={y + 4} className={styles.axisLabel} textAnchor="end">{money.format(value)}</text>
              </g>
            );
          })}

          {/* Área sombreada */}
          <path d={areaPath} fill="url(#priceGradient)" />

          {/* Línea principal del gráfico */}
          <path d={svgPath} fill="none" stroke="#9a6a36" strokeWidth="2.75" strokeLinecap="round" strokeLinejoin="round" />

          {/* Marcador de precio mínimo */}
          {minPointIndex >= 0 && (
            <g transform={`translate(${points[minPointIndex].x}, ${points[minPointIndex].y})`}>
              <circle r="5" fill="#10b981" stroke="#ffffff" strokeWidth="2" />
            </g>
          )}

          {/* Marcador al hacer hover */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={CHART_PADDING.top}
                x2={hoveredPoint.x}
                y2={CHART_HEIGHT - CHART_PADDING.bottom}
                stroke="rgba(111, 78, 40, 0.38)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="6" fill="#9a6a36" stroke="#ffffff" strokeWidth="2.5" />
            </g>
          )}

          {dateLabels.map((point, index) => (
            <text key={`${point.date}-${index}`} x={point.x} y={CHART_HEIGHT - 7} className={styles.axisLabel} textAnchor={index === 0 ? "start" : index === 2 ? "end" : "middle"}>{shortDate(point.date)}</text>
          ))}
        </svg>

        {/* Tooltip interactivo flotante */}
        {hoveredPoint && (
          <div
            className={styles.tooltip}
            style={{
              left: `${(hoveredPoint.x / CHART_WIDTH) * 100}%`,
              top: `${Math.max(18, (hoveredPoint.y / CHART_HEIGHT) * 100 - 8)}%`,
            }}
          >
            <span className={styles.tooltipDate}>
              {shortDate(hoveredPoint.date)}
            </span>
            <strong className={styles.tooltipPrice}>{money.format(hoveredPoint.price)}</strong>
          </div>
        )}
      </div>

      <footer className={styles.footerNote}>
        <span>El punto verde marca el precio más bajo del período.</span>
        <span>Monitoreamos ofertas cada día.</span>
      </footer>
    </section>
  );
}
