"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/shared/api/client";
import type { AdminMetrics, Comparison, SyncJob, User } from "@/shared/api/types";
import { Icon } from "@/shared/components/Icon";
import { CatalogExplorer } from "@/features/catalog/components/CatalogExplorer";
import styles from "./admin.module.css";

const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const BRANDS_PER_PAGE = 8;

type Section = "overview" | "analytics" | "sync" | "catalog";

interface AdminDashboardProps {
  user: User;
  initialQuery?: string;
}

function now() { return new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }); }
function normalizeStoreFilter(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function AdminDashboard({ user, initialQuery = "" }: AdminDashboardProps) {
  const [section, setSection] = useState<Section | "client">("overview");
  const [items, setItems] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [revenueInput, setRevenueInput] = useState("");
  const [revenueStatus, setRevenueStatus] = useState("");
  const [savingRevenue, setSavingRevenue] = useState(false);

  // Sync state
  const [syncingFalabella, setSyncingFalabella] = useState(false);
  const [syncingRipley,    setSyncingRipley]    = useState(false);
  const [syncingAlisha,    setSyncingAlisha]    = useState(false);
  const [syncingSilk,      setSyncingSilk]      = useState(false);
  const [syncingElite,     setSyncingElite]     = useState(false);
  const [syncingCosmetic,  setSyncingCosmetic]  = useState(false);
  const [syncingParis,     setSyncingParis]     = useState(false);
  const [syncingAbc,       setSyncingAbc]       = useState(false);
  const [syncingPreunic,   setSyncingPreunic]   = useState(false);
  const [syncingLodoro,    setSyncingLodoro]    = useState(false);
  const [syncingAll,       setSyncingAll]       = useState(false);

  const [falabellaJob, setFalabellaJob] = useState<SyncJob | null>(null);
  const [ripleyJob,    setRipleyJob]    = useState<SyncJob | null>(null);
  const [alishaJob,    setAlishaJob]    = useState<SyncJob | null>(null);
  const [silkJob,      setSilkJob]      = useState<SyncJob | null>(null);
  const [eliteJob,     setEliteJob]     = useState<SyncJob | null>(null);
  const [cosmeticJob,  setCosmeticJob]  = useState<SyncJob | null>(null);
  const [parisJob,     setParisJob]     = useState<SyncJob | null>(null);
  const [abcJob,       setAbcJob]       = useState<SyncJob | null>(null);
  const [preunicJob,   setPreunicJob]   = useState<SyncJob | null>(null);
  const [lodoroJob,    setLodoroJob]    = useState<SyncJob | null>(null);

  const [falabellaMsg, setFalabellaMsg] = useState("");
  const [ripleyMsg,    setRipleyMsg]    = useState("");
  const [alishaMsg,    setAlishaMsg]    = useState("");
  const [silkMsg,      setSilkMsg]      = useState("");
  const [eliteMsg,     setEliteMsg]     = useState("");
  const [cosmeticMsg,  setCosmeticMsg]  = useState("");
  const [parisMsg,     setParisMsg]     = useState("");
  const [abcMsg,       setAbcMsg]       = useState("");
  const [preunicMsg,   setPreunicMsg]   = useState("");
  const [lodoroMsg,    setLodoroMsg]    = useState("");

  // Activity log
  const [activity, setActivity] = useState<{ id: number; title: string; time: string; tag: string; tagClass: string; color: string }[]>([
    { id: 1, title: "Sistema iniciado y listo",              time: now(), tag: "Sistema", tagClass: styles.tagSystem,  color: "#22c55e" },
    { id: 2, title: "Sesión iniciada como Administrador",    time: now(), tag: "Auth",    tagClass: styles.tagAuth,    color: "#8b5cf6" },
    { id: 3, title: "Catálogo cargado en memoria activa",     time: now(), tag: "Sistema", tagClass: styles.tagSystem,  color: "#22c55e" },
  ]);

  function addActivity(title: string, tag: string, tagClass: string, color: string) {
    setActivity(prev => [{ id: Date.now(), title, time: now(), tag, tagClass, color }, ...prev].slice(0, 12));
  }

  // Table filter
  const [tableSearch, setTableSearch] = useState("");
  const [tableStoreFilter, setTableStoreFilter] = useState("all");
  const [brandPage, setBrandPage] = useState(0);

  const loadCatalogData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.comparisons("");
      setItems(data);
    } catch {
      addActivity("Error al consultar la base de datos de catálogo", "Advertencia", styles.tagWarning, "#f59e0b");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void loadCatalogData(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadCatalogData]);

  const loadMonitoringData = useCallback(async () => {
    try {
      setLoadingMetrics(true);
      setMetrics(await api.adminMetrics());
    } catch {
      addActivity("Error al cargar métricas de usuarios y visitas", "Advertencia", styles.tagWarning, "#f59e0b");
    } finally {
      setLoadingMetrics(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void loadMonitoringData(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadMonitoringData]);

  async function reloadAdminData() {
    await Promise.all([loadCatalogData(), loadMonitoringData()]);
  }

  async function saveAdRevenue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const revenue = Number(revenueInput);
    if (!Number.isFinite(revenue) || revenue < 0) {
      setRevenueStatus("Ingresa un monto válido en pesos chilenos.");
      return;
    }
    setSavingRevenue(true);
    setRevenueStatus("");
    try {
      setMetrics(await api.setAdRevenue(revenue));
      setRevenueStatus("Ingreso publicitario actualizado para el mes actual.");
      setRevenueInput("");
    } catch (reason) {
      setRevenueStatus(reason instanceof ApiError ? reason.message : "No se pudo actualizar el ingreso publicitario.");
    } finally {
      setSavingRevenue(false);
    }
  }

  // ── Sync helpers ────────────────────────────────────────
  async function waitForSync(
    initialJob: SyncJob,
    storeName: string,
    setJob: (j: SyncJob) => void,
    setMsg: (m: string) => void,
  ) {
    let job = initialJob;
    while (job.status === "running") {
      setJob(job);
      const pct = job.targetProducts ? Math.round((job.imported / job.targetProducts) * 100) : null;
      const progress = job.currentPage > 0 ? ` · pág. ${job.currentPage}` : "";
      setMsg(`Escaneando ${storeName}${progress} · ${job.imported} productos${pct !== null ? ` (${pct}%)` : ""}`);
      await new Promise(r => window.setTimeout(r, 2000));
      job = await api.syncJob(job.id);
    }
    if (job.status === "failed") throw new ApiError(job.error || `Falló la sincronización de ${storeName}.`, 500);
    setJob(job);
    setMsg(`✅ ${storeName} actualizado: ${job.imported} perfumes importados.`);
    addActivity(`Sincronización de ${storeName} completada (${job.imported} productos)`, "Sync", styles.tagSync, "#3b82f6");
    await loadCatalogData();
  }

  async function handleSyncFalabella() {
    setSyncingFalabella(true); setFalabellaMsg("Iniciando conexión con Falabella...");
    addActivity("Sincronización de Falabella iniciada", "Sync", styles.tagSync, "#3b82f6");
    try {
      const { job } = await api.syncFalabellaPerfumes();
      await waitForSync(job, "Falabella", setFalabellaJob, setFalabellaMsg);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error al sincronizar Falabella.";
      setFalabellaMsg(msg);
      addActivity(`Error Falabella: ${msg}`, "Advertencia", styles.tagWarning, "#f59e0b");
    } finally { setSyncingFalabella(false); }
  }

  async function handleSyncRipley() {
    setSyncingRipley(true); setRipleyMsg("Iniciando conexión con Ripley...");
    addActivity("Sincronización de Ripley iniciada", "Sync", styles.tagSync, "#3b82f6");
    try {
      const { job } = await api.syncRipleyPerfumes();
      await waitForSync(job, "Ripley", setRipleyJob, setRipleyMsg);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error al sincronizar Ripley.";
      setRipleyMsg(msg);
      addActivity(`Error Ripley: ${msg}`, "Advertencia", styles.tagWarning, "#f59e0b");
    } finally { setSyncingRipley(false); }
  }

  async function handleSyncAlisha() {
    setSyncingAlisha(true); setAlishaMsg("Iniciando conexión con Alisha Perfumes...");
    addActivity("Sincronización de Alisha iniciada", "Sync", styles.tagSync, "#3b82f6");
    try {
      const { job } = await api.syncAlishaPerfumes();
      await waitForSync(job, "Alisha", setAlishaJob, setAlishaMsg);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error al sincronizar Alisha.";
      setAlishaMsg(msg);
      addActivity(`Error Alisha: ${msg}`, "Advertencia", styles.tagWarning, "#f59e0b");
    } finally { setSyncingAlisha(false); }
  }

  async function handleSyncSilk() {
    setSyncingSilk(true); setSilkMsg("Iniciando conexión con Silk Perfumes...");
    addActivity("Sincronización de Silk iniciada", "Sync", styles.tagSync, "#3b82f6");
    try {
      const { job } = await api.syncSilkPerfumes();
      await waitForSync(job, "Silk", setSilkJob, setSilkMsg);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error al sincronizar Silk.";
      setSilkMsg(msg);
      addActivity(`Error Silk: ${msg}`, "Advertencia", styles.tagWarning, "#f59e0b");
    } finally { setSyncingSilk(false); }
  }

  async function handleSyncElite() {
    setSyncingElite(true); setEliteMsg("Iniciando conexión con Elite Perfumes...");
    addActivity("Sincronización de Elite iniciada", "Sync", styles.tagSync, "#3b82f6");
    try {
      const { job } = await api.syncElitePerfumes();
      await waitForSync(job, "Elite", setEliteJob, setEliteMsg);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error al sincronizar Elite.";
      setEliteMsg(msg);
      addActivity(`Error Elite: ${msg}`, "Advertencia", styles.tagWarning, "#f59e0b");
    } finally { setSyncingElite(false); }
  }

  async function handleSyncCosmetic() {
    setSyncingCosmetic(true); setCosmeticMsg("Iniciando catálogo UCP de Cosmetic...");
    addActivity("Sincronización de Cosmetic iniciada", "Sync", styles.tagSync, "#059669");
    try {
      const { job } = await api.syncCosmeticPerfumes();
      await waitForSync(job, "Cosmetic", setCosmeticJob, setCosmeticMsg);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error al sincronizar Cosmetic.";
      setCosmeticMsg(msg);
      addActivity(`Error Cosmetic: ${msg}`, "Advertencia", styles.tagWarning, "#f59e0b");
    } finally { setSyncingCosmetic(false); }
  }

  async function handleSyncParis() {
    setSyncingParis(true); setParisMsg("Iniciando conexión con Paris...");
    addActivity("Sincronización de Paris iniciada", "Sync", styles.tagSync, "#e11d48");
    try {
      const { job } = await api.syncParisPerfumes();
      await waitForSync(job, "Paris", setParisJob, setParisMsg);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error al sincronizar Paris.";
      setParisMsg(msg);
      addActivity(`Error Paris: ${msg}`, "Advertencia", styles.tagWarning, "#f59e0b");
    } finally { setSyncingParis(false); }
  }

  async function handleSyncAbc() {
    setSyncingAbc(true); setAbcMsg("Iniciando conexión con ABC...");
    addActivity("Sincronización de ABC iniciada", "Sync", styles.tagSync, "#0b4ea2");
    try {
      const { job } = await api.syncAbcPerfumes();
      await waitForSync(job, "ABC", setAbcJob, setAbcMsg);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error al sincronizar ABC.";
      setAbcMsg(msg);
      addActivity(`Error ABC: ${msg}`, "Advertencia", styles.tagWarning, "#f59e0b");
    } finally { setSyncingAbc(false); }
  }

  async function handleSyncPreunic() {
    setSyncingPreunic(true); setPreunicMsg("Iniciando conexión con Preunic...");
    addActivity("Sincronización de Preunic iniciada", "Sync", styles.tagSync, "#e11d48");
    try {
      const { job } = await api.syncPreunicPerfumes();
      await waitForSync(job, "Preunic", setPreunicJob, setPreunicMsg);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error al sincronizar Preunic.";
      setPreunicMsg(msg);
      addActivity(`Error Preunic: ${msg}`, "Advertencia", styles.tagWarning, "#f59e0b");
    } finally { setSyncingPreunic(false); }
  }

  async function handleSyncLodoro() {
    setSyncingLodoro(true); setLodoroMsg("Iniciando conexión con L'Odoro...");
    addActivity("Sincronización de L'Odoro iniciada", "Sync", styles.tagSync, "#7c3aed");
    try {
      const { job } = await api.syncLodoroPerfumes();
      await waitForSync(job, "L'Odoro", setLodoroJob, setLodoroMsg);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Error al sincronizar L'Odoro.";
      setLodoroMsg(msg);
      addActivity(`Error L'Odoro: ${msg}`, "Advertencia", styles.tagWarning, "#f59e0b");
    } finally { setSyncingLodoro(false); }
  }

  async function handleSyncAll() {
    setSyncingAll(true);
    addActivity("Sincronización masiva de todas las tiendas iniciada", "Sync", styles.tagSync, "#3b82f6");
    try {
      await handleSyncFalabella();
      await handleSyncRipley();
      await handleSyncAlisha();
      await handleSyncSilk();
      await handleSyncElite();
      await handleSyncCosmetic();
      await handleSyncParis();
      await handleSyncAbc();
      await handleSyncPreunic();
      await handleSyncLodoro();
    } finally {
      setSyncingAll(false);
    }
  }

  // ── Computed metrics ────────────────────────────────────
  const totalProducts  = items.length;
  const multiStore     = useMemo(() => items.filter(i => (i.product.matchedStores ?? 0) > 1).length, [items]);
  const falabellaCount = useMemo(() => items.filter(i => i.prices.some(p => p.storeName === "Falabella")).length, [items]);
  const ripleyCount    = useMemo(() => items.filter(i => i.prices.some(p => p.storeName === "Ripley")).length, [items]);
  const alishaCount    = useMemo(() => items.filter(i => i.prices.some(p => p.storeName === "Alisha Perfumes")).length, [items]);
  const silkCount      = useMemo(() => items.filter(i => i.prices.some(p => p.storeName === "Silk Perfumes")).length, [items]);
  const eliteCount     = useMemo(() => items.filter(i => i.prices.some(p => p.storeName === "Elite Perfumes")).length, [items]);
  const cosmeticCount  = useMemo(() => items.filter(i => i.prices.some(p => p.storeName === "Cosmetic")).length, [items]);
  const parisCount     = useMemo(() => items.filter(i => i.prices.some(p => p.storeName === "Paris")).length, [items]);
  const abcCount       = useMemo(() => items.filter(i => i.prices.some(p => p.storeName === "ABC")).length, [items]);
  const preunicCount   = useMemo(() => items.filter(i => i.prices.some(p => p.storeName === "Preunic")).length, [items]);
  const lodoroCount    = useMemo(() => items.filter(i => i.prices.some(p => p.storeName === "L'Odoro")).length, [items]);
  const withPriceCount = useMemo(() => items.filter(i => (i.minPrice ?? 0) > 0).length, [items]);
  const coveragePct    = totalProducts > 0 ? Math.round((withPriceCount / totalProducts) * 100) : 0;
  const multiStorePct  = totalProducts > 0 ? Math.round((multiStore / totalProducts) * 100) : 0;

  // All brands available in the catalog, ordered by product count.
  const catalogBrands = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const b = item.product.brand || "Sin marca";
      map.set(b, (map.get(b) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);
  const maxBrandCount = catalogBrands[0]?.[1] ?? 1;
  const brandPageCount = Math.max(Math.ceil(catalogBrands.length / BRANDS_PER_PAGE), 1);
  const currentBrandPage = Math.min(brandPage, brandPageCount - 1);
  const visibleBrands = catalogBrands.slice(
    currentBrandPage * BRANDS_PER_PAGE,
    (currentBrandPage + 1) * BRANDS_PER_PAGE,
  );

  // Table filter
  const filteredTableItems = useMemo(() => {
    const q = tableSearch.toLowerCase().trim();
    return items.filter(i => {
      const matchesText = !q || (
        i.product.brand.toLowerCase().includes(q) ||
        i.product.name.toLowerCase().includes(q) ||
        i.product.id.toLowerCase().includes(q)
      );
      const matchesStore = tableStoreFilter === "all" || (
        tableStoreFilter === "multi" ? (i.product.matchedStores ?? 0) > 1 :
        i.prices.some(p => normalizeStoreFilter(p.storeName).includes(normalizeStoreFilter(tableStoreFilter)))
      );
      return matchesText && matchesStore;
    }).slice(0, 60);
  }, [items, tableSearch, tableStoreFilter]);

  // System health
  const healthItems = [
    { label: "Backend API (Express)", sub: "http://localhost:3000", status: "Operativo", cls: styles.healthOk, icon: "⚡" },
    { label: "Base de datos (PostgreSQL)", sub: "PostgreSQL · migración idempotente", status: totalProducts > 0 ? "Activa" : "Vacía", cls: totalProducts > 0 ? styles.healthOk : styles.healthWarning, icon: "🗄️" },
    { label: "Scraper Falabella", sub: "falabella-cl · JSON API", status: syncingFalabella ? "Ejecutando..." : falabellaJob?.status === "failed" ? "Error" : "Listo", cls: falabellaJob?.status === "failed" ? styles.healthError : styles.healthOk, icon: "🛍️" },
    { label: "Scraper Ripley", sub: "ripley-cl · REST Client", status: syncingRipley ? "Ejecutando..." : ripleyJob?.status === "failed" ? "Error" : "Listo", cls: ripleyJob?.status === "failed" ? styles.healthError : styles.healthOk, icon: "🏬" },
    { label: "Scrapers Shopify / UCP (4)", sub: "Alisha, Silk, Elite y Cosmetic", status: (syncingAlisha || syncingSilk || syncingElite || syncingCosmetic) ? "Ejecutando..." : "Listos", cls: styles.healthOk, icon: "🌸" },
    { label: "Scraper Paris", sub: "paris.cl · Catálogo SSR", status: syncingParis ? "Ejecutando..." : parisJob?.status === "failed" ? "Error" : "Listo", cls: parisJob?.status === "failed" ? styles.healthError : styles.healthOk, icon: "🛍️" },
    { label: "Scraper ABC", sub: "abc.cl · Catálogo SSR", status: syncingAbc ? "Ejecutando..." : abcJob?.status === "failed" ? "Error" : "Listo", cls: abcJob?.status === "failed" ? styles.healthError : styles.healthOk, icon: "🛒" },
    { label: "Scraper Preunic", sub: "preunic.cl · API de catálogo", status: syncingPreunic ? "Ejecutando..." : preunicJob?.status === "failed" ? "Error" : "Listo", cls: preunicJob?.status === "failed" ? styles.healthError : styles.healthOk, icon: "🧴" },
    { label: "Scraper L'Odoro", sub: "lodoro.cl · UCP/MCP", status: syncingLodoro ? "Ejecutando..." : lodoroJob?.status === "failed" ? "Error" : "Listo", cls: lodoroJob?.status === "failed" ? styles.healthError : styles.healthOk, icon: "🌺" },
  ];

  // ── HEADER CONTROL BAR ──────────────────────────────────
  const headerNav = (
    <div className={styles.adminHeaderNav}>
      <div className={styles.headerLeft}>
        <div className={styles.adminBadge}>
          <span className={styles.pulseDot} />
          <strong>Admin</strong> · {user.email}
        </div>
        <nav className={styles.adminTabs} aria-label="Secciones de administración">
          <button
            type="button"
            className={section === "overview" ? styles.tabActive : ""}
            onClick={() => setSection("overview")}
          >
            📊 Visión General
          </button>
          <button
            type="button"
            className={section === "analytics" ? styles.tabActive : ""}
            onClick={() => setSection("analytics")}
          >
            👥 Monitoreo
          </button>
          <button
            type="button"
            className={section === "sync" ? styles.tabActive : ""}
            onClick={() => setSection("sync")}
          >
            🔄 Sincronización
          </button>
          <button
            type="button"
            className={section === "catalog" ? styles.tabActive : ""}
            onClick={() => setSection("catalog")}
          >
            📦 Inspector ({totalProducts})
          </button>
        </nav>
      </div>

      <div className={styles.headerRight}>
        <button
          type="button"
          className={styles.reloadBtn}
          onClick={reloadAdminData}
          disabled={loading || loadingMetrics}
          title="Recargar datos del catálogo"
        >
          {loading || loadingMetrics ? "Cargando..." : "↻ Recargar"}
        </button>

        <button
          type="button"
          className={section === "client" ? styles.clientBtnActive : styles.clientBtn}
          onClick={() => setSection(section === "client" ? "overview" : "client")}
        >
          {section === "client" ? "⚙️ Volver a Admin" : "🛍️ Vista de Cliente"}
        </button>
      </div>
    </div>
  );

  // ── SECTION 1: OVERVIEW ─────────────────────────────────
  const overviewSection = (
    <div className={styles.adminBody}>
      {/* Primary KPI Cards */}
      <section className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span>Catálogo Total</span>
            <div className={`${styles.kpiIcon} ${styles.iconGold}`}>📦</div>
          </div>
          <strong className={styles.kpiValue}>{loading ? "..." : totalProducts.toLocaleString("es-CL")}</strong>
          <p className={styles.kpiSub}>Perfumes agrupados e identificados</p>
        </article>

        <article className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span>Coincidencia Multi-tienda</span>
            <div className={`${styles.kpiIcon} ${styles.iconGreen}`}>🔗</div>
          </div>
          <strong className={styles.kpiValue}>{loading ? "..." : multiStore.toLocaleString("es-CL")}</strong>
          <p className={styles.kpiSub}>
            <span className={styles.badgeGreen}>{multiStorePct}% del catálogo</span> presente en 2+ tiendas
          </p>
        </article>

        <article className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span>Cobertura de Precios</span>
            <div className={`${styles.kpiIcon} ${styles.iconBlue}`}>💎</div>
          </div>
          <strong className={styles.kpiValue}>{loading ? "..." : `${coveragePct}%`}</strong>
          <p className={styles.kpiSub}>{withPriceCount.toLocaleString("es-CL")} productos con precio activo</p>
        </article>

        <article className={styles.kpiCard}>
          <div className={styles.kpiHeader}>
            <span>Tiendas Conectadas</span>
            <div className={`${styles.kpiIcon} ${styles.iconPurple}`}>🏬</div>
          </div>
          <strong className={styles.kpiValue}>10</strong>
          <p className={styles.kpiSub}>Falabella, Ripley, Alisha, Silk, Elite, Cosmetic, Paris, ABC, Preunic y L'Odoro</p>
        </article>
      </section>

      {/* Horizontal store distribution breakdown */}
      <div className={styles.panelCard}>
        <div className={styles.panelHeader}>
          <h3>Distribución por Tienda Verificada</h3>
          <span className={styles.panelHeaderBadge}>10 Fuentes de origen</span>
        </div>
        <div className={styles.storePillsRow}>
          {[
            { name: "Falabella", count: falabellaCount, color: "#287b43", tag: "falabella-cl" },
            { name: "Ripley",    count: ripleyCount,    color: "#7c3aed", tag: "ripley-cl" },
            { name: "Alisha",    count: alishaCount,    color: "#ec4899", tag: "alisha-cl" },
            { name: "Silk",      count: silkCount,      color: "#2563eb", tag: "silk-cl" },
            { name: "Elite",     count: eliteCount,     color: "#d97706", tag: "elite-cl" },
            { name: "Cosmetic",  count: cosmeticCount,  color: "#059669", tag: "cosmetic-cl" },
            { name: "Paris",     count: parisCount,     color: "#e11d48", tag: "paris-cl" },
            { name: "ABC",       count: abcCount,       color: "#0b4ea2", tag: "abc-cl" },
            { name: "Preunic",   count: preunicCount,   color: "#e11d48", tag: "preunic-cl" },
            { name: "L'Odoro",   count: lodoroCount,    color: "#7c3aed", tag: "lodoro-cl" },
          ].map(s => {
            const pct = totalProducts > 0 ? Math.round((s.count / totalProducts) * 100) : 0;
            return (
              <div key={s.name} className={styles.storePillItem}>
                <div className={styles.storePillTop}>
                  <span className={styles.storeDot} style={{ background: s.color }} />
                  <strong>{s.name}</strong>
                  <span>{s.count.toLocaleString("es-CL")} ({pct}%)</span>
                </div>
                <div className={styles.storeProgressBar}>
                  <div className={styles.storeProgressFill} style={{ width: `${pct}%`, background: s.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2 columns: Brands + System Health / Activity */}
      <div className={styles.grid2Col}>
        {/* Brand chart */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <h3>Marcas en Catálogo</h3>
            <small>{catalogBrands.length} marcas disponibles</small>
          </div>
          <div className={styles.brandList}>
            {loading ? (
              [1, 2, 3, 4, 5].map(i => (
                <div key={i} className={styles.brandSkeleton} />
              ))
            ) : visibleBrands.map(([brandName, count]) => {
              const pct = Math.round((count / maxBrandCount) * 100);
              return (
                <div key={brandName} className={styles.brandRow}>
                  <span className={styles.brandName} title={brandName}>{brandName}</span>
                  <div className={styles.brandBarOuter}>
                    <div className={styles.brandBarInner} style={{ width: `${pct}%` }} />
                  </div>
                  <strong className={styles.brandCount}>{count}</strong>
                </div>
              );
            })}
          </div>
          {!loading && catalogBrands.length > BRANDS_PER_PAGE && (
            <nav className={styles.brandPagination} aria-label="Paginación de marcas">
              <button
                type="button"
                onClick={() => setBrandPage(currentBrandPage - 1)}
                disabled={currentBrandPage === 0}
              >
                Anterior
              </button>
              <span>Página {currentBrandPage + 1} de {brandPageCount}</span>
              <button
                type="button"
                onClick={() => setBrandPage(currentBrandPage + 1)}
                disabled={currentBrandPage === brandPageCount - 1}
              >
                Siguiente
              </button>
            </nav>
          )}
        </div>

        {/* System Health & Activity */}
        <div className={styles.panelCard}>
          <div className={styles.panelHeader}>
            <h3>Salud del Sistema & Log</h3>
            <span className={styles.statusActiveBadge}>🟢 En Línea</span>
          </div>

          <div className={styles.healthMiniList}>
            {healthItems.map(h => (
              <div key={h.label} className={styles.healthMiniRow}>
                <span className={styles.healthMiniIcon}>{h.icon}</span>
                <div className={styles.healthMiniText}>
                  <strong>{h.label}</strong>
                  <small>{h.sub}</small>
                </div>
                <span className={`${styles.healthMiniBadge} ${h.cls}`}>{h.status}</span>
              </div>
            ))}
          </div>

          <div className={styles.dividerLine} />

          <h4 className={styles.subTitle}>Actividad Reciente</h4>
          <div className={styles.timelineList}>
            {activity.slice(0, 4).map(ev => (
              <div key={ev.id} className={styles.timelineRow}>
                <span className={styles.timelineDot} style={{ background: ev.color }} />
                <div className={styles.timelineText}>
                  <p>{ev.title}</p>
                  <small>{ev.time}</small>
                </div>
                <span className={`${styles.tagBadge} ${ev.tagClass}`}>{ev.tag}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // ── SECTION 2: USER & REVENUE MONITORING ────────────────
  const viewsSeries = metrics?.views.series ?? [];
  const maxViews = Math.max(1, ...viewsSeries.map(point => point.views));
  const analyticsSection = (
    <div className={styles.adminBody}>
      <div className={styles.monitoringIntro}>
        <div>
          <p className="eyebrow">Métricas de la plataforma</p>
          <h2>Usuarios y monetización</h2>
          <p>Las visitas se registran de forma agregada y respetan la señal “Do Not Track” del navegador.</p>
        </div>
        <span className={styles.monitoringTag}>{loadingMetrics ? "Actualizando…" : "Últimos 7 días"}</span>
      </div>

      <section className={styles.kpiGrid}>
        <article className={styles.kpiCard}>
          <div className={styles.kpiHeader}><span>Usuarios registrados</span><div className={`${styles.kpiIcon} ${styles.iconPurple}`}>👤</div></div>
          <strong className={styles.kpiValue}>{loadingMetrics ? "..." : (metrics?.users.total ?? 0).toLocaleString("es-CL")}</strong>
          <p className={styles.kpiSub}>{metrics?.users.newLast7Days ?? 0} cuentas creadas en los últimos 7 días</p>
        </article>
        <article className={styles.kpiCard}>
          <div className={styles.kpiHeader}><span>Vistas hoy</span><div className={`${styles.kpiIcon} ${styles.iconBlue}`}>👁️</div></div>
          <strong className={styles.kpiValue}>{loadingMetrics ? "..." : (metrics?.views.today ?? 0).toLocaleString("es-CL")}</strong>
          <p className={styles.kpiSub}>{metrics?.views.last7Days ?? 0} vistas de páginas en los últimos 7 días</p>
        </article>
        <article className={styles.kpiCard}>
          <div className={styles.kpiHeader}><span>Nuevas cuentas hoy</span><div className={`${styles.kpiIcon} ${styles.iconGreen}`}>✦</div></div>
          <strong className={styles.kpiValue}>{loadingMetrics ? "..." : (metrics?.users.newToday ?? 0).toLocaleString("es-CL")}</strong>
          <p className={styles.kpiSub}>Crecimiento de usuarios registrados</p>
        </article>
        <article className={styles.kpiCard}>
          <div className={styles.kpiHeader}><span>Ingresos por anuncios</span><div className={`${styles.kpiIcon} ${styles.iconGold}`}>$</div></div>
          <strong className={styles.kpiValue}>{loadingMetrics ? "..." : money.format(metrics?.ads.revenueCLP ?? 0)}</strong>
          <p className={styles.kpiSub}>Monto reportado manualmente · {metrics?.ads.currentMonth ?? "mes actual"}</p>
        </article>
      </section>

      <div className={styles.grid2Col}>
        <section className={styles.panelCard}>
          <div className={styles.panelHeader}><h3>Vistas por día</h3><span className={styles.panelHeaderBadge}>Sin datos personales</span></div>
          <div className={styles.viewsChart}>
            {viewsSeries.map(point => (
              <div className={styles.viewBarItem} key={point.date}>
                <strong>{point.views}</strong>
                <div className={styles.viewBarTrack}><div className={styles.viewBarFill} style={{ height: `${Math.max(4, (point.views / maxViews) * 100)}%` }} /></div>
                <span>{new Date(`${point.date}T12:00:00`).toLocaleDateString("es-CL", { weekday: "short" }).replace(".", "")}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.panelCard}>
          <div className={styles.panelHeader}><h3>Páginas más vistas</h3><span className={styles.panelHeaderBadge}>Últimos 7 días</span></div>
          <div className={styles.pageViewsList}>
            {metrics?.views.topPages.length ? metrics.views.topPages.map(page => (
              <div className={styles.pageViewsRow} key={page.page}><code>{page.page}</code><strong>{page.views} vistas</strong></div>
            )) : <p className={styles.emptyText}>Aún no hay visitas registradas.</p>}
          </div>
        </section>
      </div>

      <section className={styles.revenueCard}>
        <div>
          <p className="eyebrow">Monetización</p>
          <h3>Actualiza el ingreso de anuncios</h3>
          <p>No hay un proveedor publicitario conectado aún. Ingresa aquí el total del reporte mensual de tu plataforma de anuncios para monitorearlo sin mezclarlo con datos estimados.</p>
        </div>
        <form onSubmit={saveAdRevenue}>
          <label>Ingreso del mes (CLP)<input type="number" min="0" step="1" value={revenueInput} onChange={event => setRevenueInput(event.target.value)} placeholder={metrics ? money.format(metrics.ads.revenueCLP) : "$0"} required /></label>
          <button disabled={savingRevenue}>{savingRevenue ? "Guardando…" : "Guardar ingreso"}</button>
          {revenueStatus && <p role="status">{revenueStatus}</p>}
        </form>
      </section>
    </div>
  );

  // ── SECTION 2: SYNC CENTER ──────────────────────────────
  const syncSection = (
    <div className={styles.adminBody}>
      <div className={styles.syncHeaderRow}>
        <div>
          <h2>Centro de Sincronización</h2>
          <p className={styles.sectionDesc}>Ejecuta scrapers en vivo para mantener actualizados precios y stock de las 10 tiendas.</p>
        </div>
        <button
          type="button"
          className={styles.syncAllBtn}
          onClick={handleSyncAll}
          disabled={syncingAll || syncingFalabella || syncingRipley || syncingAlisha || syncingSilk || syncingElite || syncingCosmetic || syncingParis || syncingAbc || syncingPreunic || syncingLodoro}
        >
          {syncingAll ? "⏳ Sincronizando Todo..." : "⚡ Sincronizar Todo el Catálogo"}
        </button>
      </div>

      <div className={styles.syncGrid}>
        {/* Falabella */}
        <article className={styles.syncCard}>
          <div className={styles.syncCardTop}>
            <div className={styles.syncCardLogoWrap} style={{ background: "rgba(40, 123, 67, 0.1)", color: "#287b43" }}>
              🛒
            </div>
            <div>
              <h3>Falabella Perfumería</h3>
              <small>falabella-cl · Tienda Retail principal</small>
            </div>
            <span className={`${styles.syncStateBadge} ${syncingFalabella ? styles.stateRunning : falabellaJob?.status === "completed" ? styles.stateOk : styles.stateIdle}`}>
              {syncingFalabella ? "Ejecutando..." : falabellaJob?.status === "completed" ? "Completado" : "Listo"}
            </span>
          </div>
          {falabellaJob && (
            <div className={styles.syncProgressContainer}>
              <div className={styles.syncProgressBar}>
                <div className={styles.syncProgressFill} style={{ width: `${falabellaJob.targetProducts ? Math.min(100, Math.round((falabellaJob.imported / falabellaJob.targetProducts) * 100)) : (falabellaJob.status === "completed" ? 100 : 10)}%` }} />
              </div>
              <small>{falabellaJob.imported} productos importados · pág {falabellaJob.currentPage}/{falabellaJob.totalPages}</small>
            </div>
          )}
          <button type="button" className={styles.syncRunBtn} onClick={handleSyncFalabella} disabled={syncingFalabella || syncingAll}>
            {syncingFalabella ? "Iniciando scraper..." : "🔄 Sincronizar Falabella"}
          </button>
          {falabellaMsg && <p className={styles.syncMsg}>{falabellaMsg}</p>}
        </article>

        {/* Ripley */}
        <article className={styles.syncCard}>
          <div className={styles.syncCardTop}>
            <div className={styles.syncCardLogoWrap} style={{ background: "rgba(124, 58, 237, 0.1)", color: "#7c3aed" }}>
              🏬
            </div>
            <div>
              <h3>Ripley Perfumería</h3>
              <small>ripley-cl · Tienda Retail principal</small>
            </div>
            <span className={`${styles.syncStateBadge} ${syncingRipley ? styles.stateRunning : ripleyJob?.status === "completed" ? styles.stateOk : styles.stateIdle}`}>
              {syncingRipley ? "Ejecutando..." : ripleyJob?.status === "completed" ? "Completado" : "Listo"}
            </span>
          </div>
          {ripleyJob && (
            <div className={styles.syncProgressContainer}>
              <div className={styles.syncProgressBar}>
                <div className={styles.syncProgressFill} style={{ width: `${ripleyJob.targetProducts ? Math.min(100, Math.round((ripleyJob.imported / ripleyJob.targetProducts) * 100)) : (ripleyJob.status === "completed" ? 100 : 10)}%` }} />
              </div>
              <small>{ripleyJob.imported} productos importados · pág {ripleyJob.currentPage}/{ripleyJob.totalPages}</small>
            </div>
          )}
          <button type="button" className={styles.syncRunBtn} onClick={handleSyncRipley} disabled={syncingRipley || syncingAll}>
            {syncingRipley ? "Iniciando scraper..." : "🔄 Sincronizar Ripley"}
          </button>
          {ripleyMsg && <p className={styles.syncMsg}>{ripleyMsg}</p>}
        </article>

        {/* Alisha */}
        <article className={styles.syncCard}>
          <div className={styles.syncCardTop}>
            <div className={styles.syncCardLogoWrap} style={{ background: "rgba(236, 72, 153, 0.1)", color: "#ec4899" }}>
              🌸
            </div>
            <div>
              <h3>Alisha Perfumes</h3>
              <small>alisha-cl · Importador especializado</small>
            </div>
            <span className={`${styles.syncStateBadge} ${syncingAlisha ? styles.stateRunning : alishaJob?.status === "completed" ? styles.stateOk : styles.stateIdle}`}>
              {syncingAlisha ? "Ejecutando..." : alishaJob?.status === "completed" ? "Completado" : "Listo"}
            </span>
          </div>
          {alishaJob && (
            <div className={styles.syncProgressContainer}>
              <div className={styles.syncProgressBar}>
                <div className={styles.syncProgressFill} style={{ width: `${alishaJob.status === "completed" ? 100 : Math.min(95, alishaJob.currentPage * 8)}%` }} />
              </div>
              <small>{alishaJob.imported} productos importados · pág {alishaJob.currentPage}/{alishaJob.totalPages}</small>
            </div>
          )}
          <button type="button" className={styles.syncRunBtn} onClick={handleSyncAlisha} disabled={syncingAlisha || syncingAll}>
            {syncingAlisha ? "Iniciando scraper..." : "🔄 Sincronizar Alisha"}
          </button>
          {alishaMsg && <p className={styles.syncMsg}>{alishaMsg}</p>}
        </article>

        {/* Silk */}
        <article className={styles.syncCard}>
          <div className={styles.syncCardTop}>
            <div className={styles.syncCardLogoWrap} style={{ background: "rgba(37, 99, 235, 0.1)", color: "#2563eb" }}>
              ✨
            </div>
            <div>
              <h3>Silk Perfumes</h3>
              <small>silk-cl · Boutique de fragancias</small>
            </div>
            <span className={`${styles.syncStateBadge} ${syncingSilk ? styles.stateRunning : silkJob?.status === "completed" ? styles.stateOk : styles.stateIdle}`}>
              {syncingSilk ? "Ejecutando..." : silkJob?.status === "completed" ? "Completado" : "Listo"}
            </span>
          </div>
          {silkJob && (
            <div className={styles.syncProgressContainer}>
              <div className={styles.syncProgressBar}>
                <div className={styles.syncProgressFill} style={{ width: `${silkJob.status === "completed" ? 100 : Math.min(95, silkJob.currentPage * 8)}%` }} />
              </div>
              <small>{silkJob.imported} productos importados · pág {silkJob.currentPage}/{silkJob.totalPages}</small>
            </div>
          )}
          <button type="button" className={styles.syncRunBtn} onClick={handleSyncSilk} disabled={syncingSilk || syncingAll}>
            {syncingSilk ? "Iniciando scraper..." : "🔄 Sincronizar Silk"}
          </button>
          {silkMsg && <p className={styles.syncMsg}>{silkMsg}</p>}
        </article>

        {/* Elite */}
        <article className={styles.syncCard}>
          <div className={styles.syncCardTop}>
            <div className={styles.syncCardLogoWrap} style={{ background: "rgba(217, 119, 6, 0.1)", color: "#d97706" }}>
              💎
            </div>
            <div>
              <h3>Elite Perfumes</h3>
              <small>elite-cl · Perfumería de nicho & lujo</small>
            </div>
            <span className={`${styles.syncStateBadge} ${syncingElite ? styles.stateRunning : eliteJob?.status === "completed" ? styles.stateOk : styles.stateIdle}`}>
              {syncingElite ? "Ejecutando..." : eliteJob?.status === "completed" ? "Completado" : "Listo"}
            </span>
          </div>
          {eliteJob && (
            <div className={styles.syncProgressContainer}>
              <div className={styles.syncProgressBar}>
                <div className={styles.syncProgressFill} style={{ width: `${eliteJob.status === "completed" ? 100 : Math.min(95, eliteJob.currentPage * 22)}%` }} />
              </div>
              <small>{eliteJob.imported} productos importados · pág {eliteJob.currentPage}/{eliteJob.totalPages}</small>
            </div>
          )}
          <button type="button" className={styles.syncRunBtn} onClick={handleSyncElite} disabled={syncingElite || syncingAll}>
            {syncingElite ? "Iniciando scraper..." : "🔄 Sincronizar Elite"}
          </button>
          {eliteMsg && <p className={styles.syncMsg}>{eliteMsg}</p>}
        </article>

        {/* Cosmetic */}
        <article className={styles.syncCard}>
          <div className={styles.syncCardTop}>
            <div className={styles.syncCardLogoWrap} style={{ background: "rgba(5, 150, 105, 0.1)", color: "#059669" }}>
              ✨
            </div>
            <div>
              <h3>Cosmetic.cl</h3>
              <small>cosmetic-cl · Catálogo Shopify UCP/MCP</small>
            </div>
            <span className={`${styles.syncStateBadge} ${syncingCosmetic ? styles.stateRunning : cosmeticJob?.status === "completed" ? styles.stateOk : styles.stateIdle}`}>
              {syncingCosmetic ? "Ejecutando..." : cosmeticJob?.status === "completed" ? "Completado" : "Listo"}
            </span>
          </div>
          {cosmeticJob && (
            <div className={styles.syncProgressContainer}>
              <div className={styles.syncProgressBar}>
                <div className={styles.syncProgressFill} style={{ width: `${cosmeticJob.targetProducts ? Math.min(100, Math.round((cosmeticJob.imported / cosmeticJob.targetProducts) * 100)) : (cosmeticJob.status === "completed" ? 100 : 10)}%` }} />
              </div>
              <small>{cosmeticJob.imported} productos importados · pág {cosmeticJob.currentPage}/{cosmeticJob.totalPages}</small>
            </div>
          )}
          <button type="button" className={styles.syncRunBtn} onClick={handleSyncCosmetic} disabled={syncingCosmetic || syncingAll}>
            {syncingCosmetic ? "Iniciando scraper..." : "🔄 Sincronizar Cosmetic"}
          </button>
          {cosmeticMsg && <p className={styles.syncMsg}>{cosmeticMsg}</p>}
        </article>

        {/* Paris */}
        <article className={styles.syncCard}>
          <div className={styles.syncCardTop}>
            <div className={styles.syncCardLogoWrap} style={{ background: "rgba(225, 29, 72, 0.1)", color: "#e11d48" }}>
              🛍️
            </div>
            <div>
              <h3>Paris.cl</h3>
              <small>paris-cl · Catálogo de perfumería</small>
            </div>
            <span className={`${styles.syncStateBadge} ${syncingParis ? styles.stateRunning : parisJob?.status === "completed" ? styles.stateOk : styles.stateIdle}`}>
              {syncingParis ? "Ejecutando..." : parisJob?.status === "completed" ? "Completado" : "Listo"}
            </span>
          </div>
          {parisJob && (
            <div className={styles.syncProgressContainer}>
              <div className={styles.syncProgressBar}>
                <div className={styles.syncProgressFill} style={{ width: `${parisJob.targetProducts ? Math.min(100, Math.round((parisJob.imported / parisJob.targetProducts) * 100)) : (parisJob.status === "completed" ? 100 : 3)}%` }} />
              </div>
              <small>{parisJob.imported} productos importados · pág {parisJob.currentPage}/{parisJob.totalPages}</small>
            </div>
          )}
          <button type="button" className={styles.syncRunBtn} onClick={handleSyncParis} disabled={syncingParis || syncingAll}>
            {syncingParis ? "Iniciando scraper..." : "🔄 Sincronizar Paris"}
          </button>
          {parisMsg && <p className={styles.syncMsg}>{parisMsg}</p>}
        </article>

        {/* ABC */}
        <article className={styles.syncCard}>
          <div className={styles.syncCardTop}>
            <div className={styles.syncCardLogoWrap} style={{ background: "rgba(11, 78, 162, 0.1)", color: "#0b4ea2" }}>
              🛒
            </div>
            <div>
              <h3>ABC.cl</h3>
              <small>abc-cl · Catálogo de perfumería</small>
            </div>
            <span className={`${styles.syncStateBadge} ${syncingAbc ? styles.stateRunning : abcJob?.status === "completed" ? styles.stateOk : styles.stateIdle}`}>
              {syncingAbc ? "Ejecutando..." : abcJob?.status === "completed" ? "Completado" : "Listo"}
            </span>
          </div>
          {abcJob && (
            <div className={styles.syncProgressContainer}>
              <div className={styles.syncProgressBar}>
                <div className={styles.syncProgressFill} style={{ width: `${abcJob.targetProducts ? Math.min(100, Math.round((abcJob.imported / abcJob.targetProducts) * 100)) : (abcJob.status === "completed" ? 100 : 10)}%` }} />
              </div>
              <small>{abcJob.imported} productos importados · página permitida</small>
            </div>
          )}
          <button type="button" className={styles.syncRunBtn} onClick={handleSyncAbc} disabled={syncingAbc || syncingAll}>
            {syncingAbc ? "Iniciando scraper..." : "🔄 Sincronizar ABC"}
          </button>
          {abcMsg && <p className={styles.syncMsg}>{abcMsg}</p>}
        </article>

        {/* Preunic */}
        <article className={styles.syncCard}>
          <div className={styles.syncCardTop}>
            <div className={styles.syncCardLogoWrap} style={{ background: "rgba(225, 29, 72, 0.1)", color: "#e11d48" }}>
              🧴
            </div>
            <div>
              <h3>Preunic</h3>
              <small>preunic-cl · Perfumes y fragancias</small>
            </div>
            <span className={`${styles.syncStateBadge} ${syncingPreunic ? styles.stateRunning : preunicJob?.status === "completed" ? styles.stateOk : styles.stateIdle}`}>
              {syncingPreunic ? "Ejecutando..." : preunicJob?.status === "completed" ? "Completado" : "Listo"}
            </span>
          </div>
          {preunicJob && (
            <div className={styles.syncProgressContainer}>
              <div className={styles.syncProgressBar}>
                <div className={styles.syncProgressFill} style={{ width: `${preunicJob.targetProducts ? Math.min(100, Math.round((preunicJob.imported / preunicJob.targetProducts) * 100)) : (preunicJob.status === "completed" ? 100 : 10)}%` }} />
              </div>
              <small>{preunicJob.imported} productos importados · pág {preunicJob.currentPage}/{preunicJob.totalPages}</small>
            </div>
          )}
          <button type="button" className={styles.syncRunBtn} onClick={handleSyncPreunic} disabled={syncingPreunic || syncingAll}>
            {syncingPreunic ? "Iniciando scraper..." : "🔄 Sincronizar Preunic"}
          </button>
          {preunicMsg && <p className={styles.syncMsg}>{preunicMsg}</p>}
        </article>

        {/* L'Odoro */}
        <article className={styles.syncCard}>
          <div className={styles.syncCardTop}>
            <div className={styles.syncCardLogoWrap} style={{ background: "rgba(124, 58, 237, 0.1)", color: "#7c3aed" }}>
              🌺
            </div>
            <div>
              <h3>L'Odoro</h3>
              <small>lodoro-cl · Catálogo UCP/MCP</small>
            </div>
            <span className={`${styles.syncStateBadge} ${syncingLodoro ? styles.stateRunning : lodoroJob?.status === "completed" ? styles.stateOk : styles.stateIdle}`}>
              {syncingLodoro ? "Ejecutando..." : lodoroJob?.status === "completed" ? "Completado" : "Listo"}
            </span>
          </div>
          {lodoroJob && (
            <div className={styles.syncProgressContainer}>
              <div className={styles.syncProgressBar}>
                <div className={styles.syncProgressFill} style={{ width: `${lodoroJob.targetProducts ? Math.min(100, Math.round((lodoroJob.imported / lodoroJob.targetProducts) * 100)) : (lodoroJob.status === "completed" ? 100 : 10)}%` }} />
              </div>
              <small>{lodoroJob.imported} productos importados · pág {lodoroJob.currentPage}/{lodoroJob.totalPages}</small>
            </div>
          )}
          <button type="button" className={styles.syncRunBtn} onClick={handleSyncLodoro} disabled={syncingLodoro || syncingAll}>
            {syncingLodoro ? "Iniciando scraper..." : "🔄 Sincronizar L'Odoro"}
          </button>
          {lodoroMsg && <p className={styles.syncMsg}>{lodoroMsg}</p>}
        </article>
      </div>

      {/* Sync history timeline */}
      <div className={styles.panelCard}>
        <div className={styles.panelHeader}>
          <h3>Historial de Sincronizaciones Recientes</h3>
        </div>
        <div className={styles.timelineList}>
          {activity.filter(a => a.tag === "Sync" || a.tag === "Advertencia").length === 0 ? (
            <p className={styles.emptyText}>No hay eventos de sincronización en esta sesión.</p>
          ) : activity.filter(a => a.tag === "Sync" || a.tag === "Advertencia").map(ev => (
            <div key={ev.id} className={styles.timelineRow}>
              <span className={styles.timelineDot} style={{ background: ev.color }} />
              <div className={styles.timelineText}>
                <p>{ev.title}</p>
                <small>{ev.time}</small>
              </div>
              <span className={`${styles.tagBadge} ${ev.tagClass}`}>{ev.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── SECTION 3: CATALOG INSPECTOR ────────────────────────
  const catalogTableSection = (
    <div className={styles.adminBody}>
      <div className={styles.tableCard}>
        <div className={styles.tableCardHeader}>
          <div>
            <h2>Inspector de Catálogo</h2>
            <p className={styles.sectionDesc}>Visualiza y audita los {items.length} perfumes cargados en la base de datos.</p>
          </div>

          <div className={styles.tableControlsRow}>
            <div className={styles.tableSearchBox}>
              <Icon name="search" />
              <input
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                placeholder="Buscar marca, perfume o ID..."
              />
            </div>

            <select
              className={styles.tableFilterSelect}
              value={tableStoreFilter}
              onChange={e => setTableStoreFilter(e.target.value)}
            >
              <option value="all">Todas las tiendas</option>
              <option value="multi">Sólo Multi-tienda (Coincidentes)</option>
              <option value="falabella">Falabella</option>
              <option value="ripley">Ripley</option>
              <option value="alisha">Alisha</option>
              <option value="silk">Silk</option>
              <option value="elite">Elite</option>
              <option value="cosmetic">Cosmetic</option>
              <option value="paris">Paris</option>
              <option value="abc">ABC</option>
              <option value="preunic">Preunic</option>
              <option value="lodoro">L'Odoro</option>
            </select>
          </div>
        </div>

        <div className={styles.tableScrollArea}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Marca</th>
                <th>Nombre del Perfume</th>
                <th>Presentación</th>
                <th>Tienda Origen</th>
                <th>Mejor Precio</th>
                <th>Disponibilidad</th>
                <th>Coincidencia</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredTableItems.length ? filteredTableItems.map(item => {
                const src = item.product.source;
                const srcCls = src === "falabella-cl" ? styles.badgeFalabella : src === "ripley-cl" ? styles.badgeRipley : src === "alisha-cl" ? styles.badgeAlisha : src === "silk-cl" ? styles.badgeSilk : src === "elite-cl" ? styles.badgeElite : src === "cosmetic-cl" ? styles.badgeCosmetic : src === "paris-cl" ? styles.badgeParis : src === "abc-cl" ? styles.badgeAbc : src === "preunic-cl" ? styles.badgePreunic : src === "lodoro-cl" ? styles.badgeLodoro : styles.badgeMulti;
                const srcLabel = src === "falabella-cl" ? "Falabella" : src === "ripley-cl" ? "Ripley" : src === "alisha-cl" ? "Alisha" : src === "silk-cl" ? "Silk" : src === "elite-cl" ? "Elite" : src === "cosmetic-cl" ? "Cosmetic" : src === "paris-cl" ? "Paris" : src === "abc-cl" ? "ABC" : src === "preunic-cl" ? "Preunic" : src === "lodoro-cl" ? "L'Odoro" : "Multi-tienda";
                const avail = item.product.available !== false;
                const matchedCount = item.product.matchedStores ?? 1;

                return (
                  <tr key={item.product.id}>
                    <td><code className={styles.idCode}>{item.product.id}</code></td>
                    <td><strong>{item.product.brand}</strong></td>
                    <td className={styles.cellName}>{item.product.name}</td>
                    <td><span className={styles.unitBadge}>{item.product.unit}</span></td>
                    <td><span className={`${styles.storeBadge} ${srcCls}`}>{srcLabel}</span></td>
                    <td><strong className={styles.priceText}>{item.minPrice ? money.format(item.minPrice) : "—"}</strong></td>
                    <td>
                      <span className={`${styles.statusDotTag} ${avail ? styles.statusOk : styles.statusBad}`}>
                        {avail ? "En Stock" : "Agotado"}
                      </span>
                    </td>
                    <td>
                      {matchedCount > 1 ? (
                        <span className={styles.multiTag}>✓ {matchedCount} Tiendas</span>
                      ) : (
                        <span className={styles.singleTag}>1 Tienda</span>
                      )}
                    </td>
                    <td>
                      <Link href={`/perfumes/${item.product.id}`} className={styles.viewLink}>
                        Ver Ficha ↗
                      </Link>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={9} className={styles.tableEmpty}>
                    No se encontraron productos para los criterios seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ── FINAL RENDER ─────────────────────────────────────────
  return (
    <div className={styles.shell}>
      {headerNav}

      {section === "client" ? (
        <div className={styles.clientWrapper}>
          <CatalogExplorer initialQuery={initialQuery} />
        </div>
      ) : (
        <>
          {section === "overview" && overviewSection}
          {section === "analytics" && analyticsSection}
          {section === "sync"     && syncSection}
          {section === "catalog"  && catalogTableSection}
        </>
      )}
    </div>
  );
}
