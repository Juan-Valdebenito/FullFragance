"use client";

import { FormEvent, useState } from "react";
import { ApiError } from "@/shared/api/client";
import { useAdmin } from "../AdminContext";
import { AreaChart } from "./AreaChart";
import { Panel, SectionHeader, StatCard } from "./ui";
import styles from "./admin.module.css";

const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

function weekday(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("es-CL", { weekday: "short" }).replace(".", "");
}

function monthLabel(month: string) {
  return new Date(`${month}-01T12:00:00`).toLocaleDateString("es-CL", { month: "short", year: "2-digit" }).replace(".", "");
}

const MONTH_RANGE_OPTIONS = [
  { value: 1, label: "1 mes" },
  { value: 2, label: "2 meses" },
  { value: 3, label: "3 meses" },
  { value: 6, label: "6 meses" },
  { value: 12, label: "1 año" },
];

export function MonitoringSection() {
  const { metrics, loadingMetrics, saveAdRevenue } = useAdmin();
  const [revenueInput, setRevenueInput] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [monthsRange, setMonthsRange] = useState(12);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const revenue = Number(revenueInput);
    if (!Number.isFinite(revenue) || revenue < 0) {
      setStatus("Ingresa un monto válido en pesos chilenos.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      await saveAdRevenue(revenue);
      setStatus("Ingreso actualizado para el mes actual.");
      setRevenueInput("");
    } catch (reason) {
      setStatus(reason instanceof ApiError ? reason.message : "No se pudo actualizar el ingreso publicitario.");
    } finally {
      setSaving(false);
    }
  }

  const count = (value: number | undefined) => (value ?? 0).toLocaleString("es-CL");
  const series = (metrics?.views.series ?? []).map((point) => ({ label: weekday(point.date), value: point.views }));
  const visibleMonthly = (metrics?.views.monthly ?? []).slice(-monthsRange);
  const monthlySeries = visibleMonthly.map((point) => ({ label: monthLabel(point.month), value: point.views }));
  const monthlyTotal = visibleMonthly.reduce((sum, point) => sum + point.views, 0);
  const weekViews = metrics?.views.last7Days ?? 0;
  const previousWeekViews = metrics?.views.previous7Days ?? 0;
  const weeklyChange = previousWeekViews ? Math.round((weekViews - previousWeekViews) / previousWeekViews * 100) : null;
  const peak = [...series].sort((a, b) => b.value - a.value)[0];
  const topPage = metrics?.views.topPages[0];

  return (
    <>
      <SectionHeader
        title="Monitoreo"
        description="Usuarios, visitas e ingresos. Las visitas se cuentan de forma agregada y respetan Do Not Track."
      >
        <label className={styles.monitoringPeriod}>
          <span>Período</span>
          <select
            value={monthsRange}
            onChange={(event) => setMonthsRange(Number(event.target.value))}
            aria-label="Meses a mostrar"
          >
            {MONTH_RANGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </SectionHeader>

      <div className={`${styles.statGrid} ${styles.monitoringStats}`}>
        <StatCard icon="users" label="Usuarios registrados" value={count(metrics?.users.total)} hint={`${count(metrics?.users.newLast7Days)} nuevos en 7 días`} loading={loadingMetrics} />
        <StatCard icon="users" label="Cuentas nuevas hoy" value={count(metrics?.users.newToday)} loading={loadingMetrics} />
        <StatCard icon="eye" label="Vistas hoy" value={count(metrics?.views.today)} hint={`${count(weekViews)} en 7 días${weeklyChange === null ? "" : ` · ${weeklyChange >= 0 ? "+" : ""}${weeklyChange}% vs. semana previa`}`} loading={loadingMetrics} />
        <StatCard icon="money" label="Ingresos por anuncios" value={money.format(metrics?.ads.revenueCLP ?? 0)} hint={metrics?.ads.currentMonth ?? "Mes actual"} loading={loadingMetrics} />
      </div>

      {!loadingMetrics && <section className={styles.trafficBrief} aria-label="Lectura rápida del tráfico">
        <div><h2>Lectura rápida</h2><p>El tráfico se calcula con vistas agregadas, sin identificar a las personas.</p></div>
        <ul>
          <li><span>Pico de la semana</span><strong>{peak ? `${peak.label} · ${count(peak.value)} vistas` : "Sin datos"}</strong></li>
          <li><span>Página principal</span><strong>{topPage ? `${topPage.page} · ${count(topPage.views)} vistas` : "Sin datos"}</strong></li>
          <li><span>Alcance del contenido</span><strong>{count(metrics?.views.uniquePages)} páginas vistas</strong></li>
        </ul>
      </section>}

      <div className={`${styles.split} ${styles.monitoringPrimary}`}>
        <Panel title="Actividad diaria" meta="Últimos 7 días" className={styles.monitoringChartPanel}>
          {loadingMetrics ? <div className={styles.skeletonBlock} /> : <AreaChart points={series} unit="vistas" />}
        </Panel>

        <Panel title="Páginas más consultadas" meta="Últimos 7 días" className={styles.monitoringListPanel}>
          {metrics?.views.topPages.length ? (
            <ol className={styles.rankList}>
              {metrics.views.topPages.map((page) => (
                <li key={page.page}>
                  <code>{page.page}</code>
                  <span>{page.views.toLocaleString("es-CL")}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.empty}>Aún no hay visitas registradas.</p>
          )}
        </Panel>
      </div>

      <div className={`${styles.split} ${styles.monitoringSecondary}`}>
        <Panel title="Tendencia mensual" meta={`${count(monthlyTotal)} vistas en el período`} className={styles.monitoringChartPanel}>
          {loadingMetrics ? <div className={styles.skeletonBlock} /> : <AreaChart points={monthlySeries} unit="vistas" periodLabel="por mes" variant="bar" />}
        </Panel>

        <Panel title="Desglose del período" meta="Vistas acumuladas" className={styles.monitoringListPanel}>
          {visibleMonthly.length ? (
            <ol className={styles.rankList}>
              {[...visibleMonthly].reverse().map((point) => (
                <li key={point.month}>
                  <code>{monthLabel(point.month)}</code>
                  <span>{point.views.toLocaleString("es-CL")}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.empty}>Aún no hay vistas registradas.</p>
          )}
        </Panel>
      </div>

      <Panel title="Ingreso publicitario del mes" meta="Registro manual" className={styles.revenuePanel}>
        <form className={styles.inlineForm} onSubmit={submit}>
          <p>No hay un proveedor de anuncios conectado. Ingresa el total del reporte mensual para seguirlo aquí.</p>
          <label>
            <span>Monto (CLP)</span>
            <input
              type="number"
              min="0"
              step="1"
              value={revenueInput}
              onChange={(event) => setRevenueInput(event.target.value)}
              placeholder={metrics ? money.format(metrics.ads.revenueCLP) : "$0"}
              required
            />
          </label>
          <button type="submit" className={styles.primaryButton} disabled={saving}>{saving ? "Guardando…" : "Guardar"}</button>
          {status && <p role="status" className={styles.formStatus}>{status}</p>}
        </form>
      </Panel>
    </>
  );
}
