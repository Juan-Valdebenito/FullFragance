import { useId } from "react";
import styles from "./admin.module.css";

type Point = { label: string; value: number };

const WIDTH = 640;
const HEIGHT = 220;
const PAD = { top: 16, right: 12, bottom: 28, left: 36 };

// Tope del eje Y divisible en 4 tramos enteros y "redondos" (4, 8, 12, 20, 40…).
function niceMax(value: number) {
  const rawStep = Math.max(1, value / 4);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 2.5, 3, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= rawStep && Number.isInteger(candidate)) ?? 10 * magnitude;
  return step * 4;
}

// Gráfico de área en SVG puro: una serie, ejes mínimos y un punto por día.
export function AreaChart({ points, unit, periodLabel = "por día" }: { points: Point[]; unit: string; periodLabel?: string }) {
  const gradientId = useId();
  if (!points.length) return <p className={styles.empty}>Aún no hay datos para graficar.</p>;

  const max = niceMax(Math.max(...points.map((point) => point.value)));
  const innerW = WIDTH - PAD.left - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const x = (index: number) => PAD.left + (points.length === 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
  const y = (value: number) => PAD.top + innerH - (value / max) * innerH;
  const line = points.map((point, index) => `${index ? "L" : "M"}${x(index)},${y(point.value)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${PAD.top + innerH} L${x(0)},${PAD.top + innerH} Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => Math.round(max * fraction));

  return (
    <svg className={styles.chart} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label={`Gráfico de ${unit} ${periodLabel}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.22" />
          <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(tick)} y2={y(tick)} className={styles.chartGrid} />
          <text x={PAD.left - 8} y={y(tick)} className={styles.chartAxis} textAnchor="end" dominantBaseline="middle">{tick}</text>
        </g>
      ))}
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} className={styles.chartLine} />
      {points.map((point, index) => (
        <g key={point.label}>
          <circle cx={x(index)} cy={y(point.value)} r="3.5" className={styles.chartDot}>
            <title>{`${point.label}: ${point.value} ${unit}`}</title>
          </circle>
          <text x={x(index)} y={HEIGHT - 8} className={styles.chartAxis} textAnchor="middle">{point.label}</text>
        </g>
      ))}
    </svg>
  );
}
