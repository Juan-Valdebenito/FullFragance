"use client";

import { useMemo, useState } from "react";
import type { OpportunityTag, PriceHistoryPoint } from "@/shared/api/types";
import styles from "./PriceHistoryChart.module.css";

const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

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

    // Mapeo a coordenadas SVG (ancho 500, alto 160)
    const paddingX = 20;
    const paddingY = 20;
    const width = 500 - paddingX * 2;
    const height = 160 - paddingY * 2;

    const rangeY = max - min || 1;

    const mapped = activePoints.map((pt, idx) => {
      const x = paddingX + (idx / Math.max(1, activePoints.length - 1)) * width;
      const normalizedY = (pt.price - min) / rangeY;
      const y = paddingY + height - normalizedY * height;
      return { ...pt, x, y, index: idx };
    });

    return { minPrice: min, maxPrice: max, avgPrice: avg, points: mapped, minPointIndex: minIdx };
  }, [activePoints]);

  if (!points.length) return null;

  const svgPath = useMemo(() => {
    if (!points.length) return "";
    return points.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`, "");
  }, [points]);

  const areaPath = useMemo(() => {
    if (!points.length) return "";
    const firstX = points[0].x.toFixed(1);
    const lastX = points[points.length - 1].x.toFixed(1);
    return `${svgPath} L ${lastX} 160 L ${firstX} 160 Z`;
  }, [points, svgPath]);

  const hoveredPoint = hoverIndex !== null ? points[hoverIndex] : null;

  const tagClass = opportunity?.type === "great_deal" || opportunity?.type === "lowest_30" || opportunity?.type === "lowest_90"
    ? styles.tagGreatDeal
    : opportunity?.type === "trending_up"
      ? styles.tagTrendingUp
      : styles.tagStable;

  return (
    <section className={styles.container} aria-label="Historial y gráfico de tendencia de precios">
      <header className={styles.header}>
        <div className={styles.headerTitle}>
          <h3>Tendencia de precios</h3>
          {opportunity && (
            <span className={`${styles.opportunityTag} ${tagClass}`}>
              {opportunity.label}
            </span>
          )}
        </div>
        <div className={styles.toggleGroup} role="radiogroup" aria-label="Rango de tiempo">
          <button
            type="button"
            className={`${styles.toggleBtn} ${range === "30" ? styles.toggleActive : ""}`}
            onClick={() => setRange("30")}
            aria-checked={range === "30"}
          >
            30 días
          </button>
          <button
            type="button"
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

      {/* Gráfico interactivo SVG */}
      <div className={styles.chartWrapper}>
        <svg
          className={styles.svgChart}
          viewBox="0 0 500 160"
          preserveAspectRatio="none"
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
              <stop offset="0%" stopColor="#a855f7" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Área sombreada */}
          <path d={areaPath} fill="url(#priceGradient)" />

          {/* Línea principal del gráfico */}
          <path d={svgPath} fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

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
                y1="0"
                x2={hoveredPoint.x}
                y2="160"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <circle cx={hoveredPoint.x} cy={hoveredPoint.y} r="6" fill="#a855f7" stroke="#ffffff" strokeWidth="2" />
            </g>
          )}
        </svg>

        {/* Tooltip interactivo flotante */}
        {hoveredPoint && (
          <div
            className={styles.tooltip}
            style={{
              left: `${(hoveredPoint.x / 500) * 100}%`,
              top: `${Math.max(10, (hoveredPoint.y / 160) * 100 - 25)}%`,
            }}
          >
            <span className={styles.tooltipDate}>
              {new Date(hoveredPoint.date).toLocaleDateString("es-CL", {
                day: "numeric",
                month: "short",
              })}
            </span>
            <strong className={styles.tooltipPrice}>{money.format(hoveredPoint.price)}</strong>
          </div>
        )}
      </div>

      <footer className={styles.footerNote}>
        <span>ℹ Monitoreo diario de ofertas en perfumerías locales.</span>
      </footer>
    </section>
  );
}
