"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/shared/api/client";
import type { City, Comparison, SyncJob, User } from "@/shared/api/types";
import { Icon } from "@/shared/components/Icon";
import { CatalogExplorer } from "@/features/catalog/components/CatalogExplorer";
import styles from "./admin.module.css";

const SANTIAGO: City = { name: "Santiago", country: "Chile", lat: -33.4489, lon: -70.6693 };
const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

type Section = "overview" | "sync" | "catalog";

interface AdminDashboardProps {
  user: User;
  initialQuery?: string;
}

// ── Sidebar navigation ──────────────────────────────────────
const NAV: { id: Section | "client"; label: string; icon: string; dividerBefore?: boolean }[] = [
  { id: "overview", icon: "📊", label: "Visión General" },
  { id: "sync",     icon: "🔄", label: "Sincronización" },
  { id: "catalog",  icon: "📦", label: "Inspector de Catálogo" },
  { id: "client",   icon: "🛍️", label: "Vista de Cliente", dividerBefore: true },
];

// ── Helpers ─────────────────────────────────────────────────
function now() { return new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" }); }

export function AdminDashboard({ user, initialQuery = "" }: AdminDashboardProps) {
  const [section, setSection] = useState<Section | "client">("overview");
  const [items, setItems] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync state
  const [syncingFalabella, setSyncingFalabella] = useState(false);
  const [syncingRipley,    setSyncingRipley]    = useState(false);
  const [falabellaJob, setFalabellaJob] = useState<SyncJob | null>(null);
  const [ripleyJob,    setRipleyJob]    = useState<SyncJob | null>(null);
  const [falabellaMsg, setFalabellaMsg] = useState("");
  const [ripleyMsg,    setRipleyMsg]    = useState("");

  // Activity log
  const [activity, setActivity] = useState<{ id: number; title: string; time: string; tag: string; tagClass: string; color: string }[]>([
    { id: 1, title: "Sistema iniciado correctamente",        time: now(), tag: "Sistema", tagClass: styles.tagSystem,  color: "#22c55e" },
    { id: 2, title: "Admin inició sesión",                   time: now(), tag: "Auth",    tagClass: styles.tagAuth,    color: "#a78bfa" },
    { id: 3, title: "Catálogo cargado en memoria",           time: now(), tag: "Sistema", tagClass: styles.tagSystem,  color: "#22c55e" },
  ]);

  function addActivity(title: string, tag: string, tagClass: string, color: string) {
    setActivity(prev => [{ id: Date.now(), title, time: now(), tag, tagClass, color }, ...prev].slice(0, 10));
  }

  // Table filter
  const [tableSearch, setTableSearch] = useState("");

  const loadCatalogData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.comparisons(user.city ?? SANTIAGO, "");
      setItems(data);
    } catch {
      addActivity("Error al cargar métricas del catálogo", "Advertencia", styles.tagWarning, "#f59e0b");
    } finally {
      setLoading(false);
    }
  }, [user.city]);

  useEffect(() => { loadCatalogData(); }, [loadCatalogData]);

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

  // ── Computed metrics ────────────────────────────────────
  const totalProducts  = items.length;
  const multiStore     = useMemo(() => items.filter(i => (i.product.matchedStores ?? 0) > 1).length, [items]);
  const falabellaCount = useMemo(() => items.filter(i => i.prices.some(p => p.storeName === "Falabella")).length, [items]);
  const ripleyCount    = useMemo(() => items.filter(i => i.prices.some(p => p.storeName === "Ripley")).length, [items]);
  const withPriceCount = useMemo(() => items.filter(i => (i.minPrice ?? 0) > 0).length, [items]);
  const coveragePct    = totalProducts > 0 ? Math.round((withPriceCount / totalProducts) * 100) : 0;

  // Top brands
  const topBrands = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) {
      const b = item.product.brand || "Sin marca";
      map.set(b, (map.get(b) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [items]);
  const maxBrandCount = topBrands[0]?.[1] ?? 1;

  // Table filter
  const filteredTableItems = useMemo(() => {
    const q = tableSearch.trim().toLowerCase();
    if (!q) return items.slice(0, 30);
    return items.filter(i =>
      i.product.brand.toLowerCase().includes(q) ||
      i.product.name.toLowerCase().includes(q) ||
      i.product.id.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [items, tableSearch]);

  // ── System health ───────────────────────────────────────
  const healthItems = [
    { label: "Backend API", sub: "http://localhost:3000", status: "Operativo", cls: styles.healthOk, icon: "🟢" },
    { label: "Base de datos SQLite", sub: "catalog.sqlite", status: totalProducts > 0 ? "Activa" : "Vacía", cls: totalProducts > 0 ? styles.healthOk : styles.healthWarning, icon: totalProducts > 0 ? "🟢" : "🟡" },
    { label: "Scraper Falabella", sub: "falabella-cl · scraping habilitado", status: syncingFalabella ? "Ejecutando..." : falabellaJob?.status === "failed" ? "Error" : "Listo", cls: falabellaJob?.status === "failed" ? styles.healthError : styles.healthOk, icon: falabellaJob?.status === "failed" ? "🔴" : "🟢" },
    { label: "Scraper Ripley", sub: "ripley-cl · scraping habilitado", status: syncingRipley ? "Ejecutando..." : ripleyJob?.status === "failed" ? "Error" : "Listo", cls: ripleyJob?.status === "failed" ? styles.healthError : styles.healthOk, icon: ripleyJob?.status === "failed" ? "🔴" : "🟢" },
    { label: "Proxy de Imágenes", sub: "/api/images/ripley · curl activo", status: "Operativo", cls: styles.healthOk, icon: "🟢" },
    { label: "Caché de Catálogo", sub: "En memoria · se invalida al sincronizar", status: "Activo", cls: styles.healthOk, icon: "🟢" },
  ];

  // ── SIDEBAR ─────────────────────────────────────────────
  const sidebar = (
    <aside className={styles.sidebar}>
      <span className={styles.sidebarTitle}>Panel Admin</span>
      {NAV.map(item => (
        <span key={item.id}>
          {item.dividerBefore && <hr className={styles.sidebarDivider} />}
          <button
            type="button"
            className={`${styles.sidebarItem} ${section === item.id ? styles.sidebarItemActive : ""}`}
            onClick={() => setSection(item.id as Section | "client")}
          >
            <span className={styles.sidebarIcon}>{item.icon}</span>
            {item.label}
          </button>
        </span>
      ))}
    </aside>
  );

  // ── CONTROL BAR ─────────────────────────────────────────
  const controlBar = (
    <div className={styles.controlBar}>
      <div className={styles.adminBadge}>
        <span className={styles.pulseDot} />
        Administrador · {user.email}
      </div>
      <div className={styles.viewModeToggle}>
        <button type="button" className={section !== "client" ? styles.active : ""} onClick={() => setSection("overview")}>
          📊 Panel Admin
        </button>
        <button type="button" className={section === "client" ? styles.active : ""} onClick={() => setSection("client")}>
          🛍️ Vista de Cliente
        </button>
      </div>
    </div>
  );

  // ── SECTION: OVERVIEW ───────────────────────────────────
  const overviewSection = (
    <div className={styles.mainContent}>
      {/* Metrics */}
      <section className={styles.metricsGrid}>
        {[
          { label: "Catálogo Total",   value: loading ? "..." : totalProducts,  sub: "Perfumes en base de datos",         icon: "📦", iconCls: styles.metricIconBlue,   delta: null },
          { label: "Multi-tienda",     value: loading ? "..." : multiStore,     sub: "Coincidencias Falabella + Ripley",  icon: "🔗", iconCls: styles.metricIconGreen,  delta: totalProducts > 0 ? `${Math.round((multiStore / totalProducts) * 100)}%` : null, pos: true },
          { label: "Falabella",        value: loading ? "..." : falabellaCount, sub: "Ofertas sincronizadas",             icon: "🛒", iconCls: styles.metricIconAmber,  delta: null },
          { label: "Ripley",           value: loading ? "..." : ripleyCount,    sub: "Ofertas sincronizadas",             icon: "🏬", iconCls: styles.metricIconPurple, delta: null },
        ].map(m => (
          <article key={m.label} className={styles.metricCard}>
            <div className={styles.metricTop}>
              <span className={styles.metricLabel}>{m.label}</span>
              <div className={`${styles.metricIcon} ${m.iconCls}`}>{m.icon}</div>
            </div>
            <strong className={styles.metricValue}>{m.value}</strong>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className={styles.metricSubtext}>{m.sub}</span>
              {m.delta !== null && (
                <span className={`${styles.metricDelta} ${m.pos ? styles.metricDeltaPos : styles.metricDeltaNeg}`}>
                  ↑ {m.delta}
                </span>
              )}
            </div>
          </article>
        ))}
      </section>

      {/* 2-col: brands + activity */}
      <div className={styles.panelRow}>
        {/* Brand distribution */}
        <div className={styles.panelCard}>
          <div className={styles.sectionHeader}>
            <h2>Top Marcas en Catálogo</h2>
            <span className={styles.sectionHeaderSub}>{loading ? "..." : `${topBrands.length} marcas`}</span>
          </div>
          <div className={styles.brandChart}>
            {loading ? (
              [1,2,3,4,5].map(i => (
                <div key={i} className={styles.brandRow}>
                  <div className={`${styles.skeleton}`} style={{ height: 14, borderRadius: 4 }} />
                  <div className={`${styles.skeleton}`} style={{ height: 8 }} />
                  <div className={`${styles.skeleton}`} style={{ height: 14, width: 32, borderRadius: 4 }} />
                </div>
              ))
            ) : topBrands.map(([brand, count]) => (
              <div key={brand} className={styles.brandRow}>
                <span className={styles.brandRowName} title={brand}>{brand}</span>
                <div className={styles.brandRowBar}>
                  <div className={styles.brandRowFill} style={{ width: `${(count / maxBrandCount) * 100}%` }} />
                </div>
                <span className={styles.brandRowCount}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity log */}
        <div className={styles.panelCard}>
          <div className={styles.sectionHeader}>
            <h2>Actividad Reciente</h2>
            <span className={styles.sectionHeaderSub}>Última sesión</span>
          </div>
          <div className={styles.timeline}>
            {activity.map(ev => (
              <div key={ev.id} className={styles.timelineItem}>
                <div className={styles.timelineTrack}>
                  <div className={styles.timelineDot} style={{ background: ev.color }} />
                  <div className={styles.timelineLineSegment} />
                </div>
                <div className={styles.timelineContent}>
                  <p className={styles.timelineTitle}>{ev.title}</p>
                  <p className={styles.timelineTime}>{ev.time}</p>
                  <span className={`${styles.timelineTag} ${ev.tagClass}`}>{ev.tag}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className={styles.panelCard}>
        <div className={styles.sectionHeader}>
          <h2>Salud del Sistema</h2>
          <span className={`${styles.metricDelta} ${styles.metricDeltaPos}`}>Todo Operativo</span>
        </div>
        <div className={styles.healthGrid}>
          {healthItems.map(h => (
            <div key={h.label} className={`${styles.healthItem} ${h.cls}`}>
              <div className={styles.healthLeft}>
                <span style={{ fontSize: "1.1rem" }}>{h.icon}</span>
                <div>
                  <p className={styles.healthItemLabel}>{h.label}</p>
                  <p className={styles.healthItemSub}>{h.sub}</p>
                </div>
              </div>
              <span className={styles.healthStatus}>
                <span className={styles.healthDot} />
                {h.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Coverage quick-stat */}
      <div className={styles.panelCard}>
        <div className={styles.sectionHeader}>
          <h2>Cobertura de Precios</h2>
          <strong style={{ font: "700 1.4rem 'Space Grotesk',sans-serif" }}>{coveragePct}%</strong>
        </div>
        <div className={styles.syncProgress}>
          <div className={styles.syncProgressBar}>
            <div className={styles.syncProgressFill} style={{ width: `${coveragePct}%` }} />
          </div>
          <div className={styles.syncProgressLabel}>
            <span>{withPriceCount} productos con precio activo</span>
            <span>{totalProducts - withPriceCount} sin precio</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ── SECTION: SYNC ────────────────────────────────────────
  const syncSection = (
    <div className={styles.mainContent}>
      <div className={styles.sectionHeader}>
        <h2>Centro de Sincronización</h2>
        <span className={styles.sectionHeaderSub}>Ejecuta scrapers y actualiza el catálogo en tiempo real</span>
      </div>

      <div className={styles.syncGrid}>
        {/* Falabella card */}
        <article className={styles.syncCard}>
          <div className={styles.syncCardHeader}>
            <div className={styles.syncStoreTitle}>
              <div className={`${styles.syncStoreLogo} ${styles.syncStoreLogoFalabella}`}>🛒</div>
              <div className={styles.syncStoreInfo}>
                <h3>Falabella Perfumería</h3>
                <span>falabella-cl · hasta ~3 000 productos</span>
              </div>
            </div>
            <span className={`${styles.syncStatusBadge} ${syncingFalabella ? styles.statusRunning : falabellaJob?.status === "completed" ? styles.statusCompleted : styles.statusIdle}`}>
              {syncingFalabella ? "Ejecutando..." : falabellaJob?.status === "completed" ? "Completado" : "Listo"}
            </span>
          </div>

          {falabellaJob && (
            <div className={styles.syncProgress}>
              <div className={styles.syncProgressBar}>
                <div className={styles.syncProgressFill} style={{ width: `${falabellaJob.targetProducts ? Math.min(100, Math.round((falabellaJob.imported / falabellaJob.targetProducts) * 100)) : (falabellaJob.status === "completed" ? 100 : 10)}%` }} />
              </div>
              <div className={styles.syncProgressLabel}>
                <span>{falabellaJob.imported} importados · pág {falabellaJob.currentPage}/{falabellaJob.totalPages}</span>
                <span>{falabellaJob.targetProducts ? `~${falabellaJob.targetProducts} esperados` : ""}</span>
              </div>
            </div>
          )}

          <button type="button" className={styles.syncBtn} onClick={handleSyncFalabella} disabled={syncingFalabella}>
            {syncingFalabella ? "⏳ Sincronizando Falabella..." : "🔄 Actualizar Catálogo Falabella"}
          </button>

          {falabellaMsg && <p className={styles.syncMessage}>{falabellaMsg}</p>}
        </article>

        {/* Ripley card */}
        <article className={styles.syncCard}>
          <div className={styles.syncCardHeader}>
            <div className={styles.syncStoreTitle}>
              <div className={`${styles.syncStoreLogo} ${styles.syncStoreLogoRipley}`}>🏬</div>
              <div className={styles.syncStoreInfo}>
                <h3>Ripley Perfumería</h3>
                <span>ripley-cl · hasta ~600 productos</span>
              </div>
            </div>
            <span className={`${styles.syncStatusBadge} ${syncingRipley ? styles.statusRunning : ripleyJob?.status === "completed" ? styles.statusCompleted : styles.statusIdle}`}>
              {syncingRipley ? "Ejecutando..." : ripleyJob?.status === "completed" ? "Completado" : "Listo"}
            </span>
          </div>

          {ripleyJob && (
            <div className={styles.syncProgress}>
              <div className={styles.syncProgressBar}>
                <div className={styles.syncProgressFill} style={{ width: `${ripleyJob.targetProducts ? Math.min(100, Math.round((ripleyJob.imported / ripleyJob.targetProducts) * 100)) : (ripleyJob.status === "completed" ? 100 : 10)}%` }} />
              </div>
              <div className={styles.syncProgressLabel}>
                <span>{ripleyJob.imported} importados · pág {ripleyJob.currentPage}/{ripleyJob.totalPages}</span>
                <span>{ripleyJob.targetProducts ? `~${ripleyJob.targetProducts} esperados` : ""}</span>
              </div>
            </div>
          )}

          <button type="button" className={styles.syncBtn} onClick={handleSyncRipley} disabled={syncingRipley}>
            {syncingRipley ? "⏳ Sincronizando Ripley..." : "🔄 Actualizar Catálogo Ripley"}
          </button>

          {ripleyMsg && <p className={styles.syncMessage}>{ripleyMsg}</p>}
        </article>
      </div>

      {/* Activity in sync section too */}
      <div className={styles.panelCard}>
        <div className={styles.sectionHeader}>
          <h2>Log de Sincronización</h2>
        </div>
        <div className={styles.timeline}>
          {activity.filter(a => a.tag === "Sync" || a.tag === "Advertencia").length === 0 ? (
            <p className={styles.metricSubtext}>Sin eventos de sincronización recientes.</p>
          ) : activity.filter(a => a.tag === "Sync" || a.tag === "Advertencia").map(ev => (
            <div key={ev.id} className={styles.timelineItem}>
              <div className={styles.timelineTrack}>
                <div className={styles.timelineDot} style={{ background: ev.color }} />
                <div className={styles.timelineLineSegment} />
              </div>
              <div className={styles.timelineContent}>
                <p className={styles.timelineTitle}>{ev.title}</p>
                <p className={styles.timelineTime}>{ev.time}</p>
                <span className={`${styles.timelineTag} ${ev.tagClass}`}>{ev.tag}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── SECTION: CATALOG TABLE ───────────────────────────────
  const catalogTableSection = (
    <div className={styles.mainContent}>
      <div className={styles.tableSection}>
        <div className={styles.tableHeader}>
          <div>
            <h2 style={{ font: "700 1.2rem 'Space Grotesk',sans-serif" }}>Inspector de Catálogo</h2>
            <span className={styles.sectionHeaderSub}>{items.length} productos · mostrando {filteredTableItems.length}</span>
          </div>
          <div className={styles.tableSearch}>
            <Icon name="search" />
            <input
              value={tableSearch}
              onChange={e => setTableSearch(e.target.value)}
              placeholder="Marca, nombre o ID..."
            />
          </div>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.adminTable}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Marca</th>
                <th>Nombre</th>
                <th>Presentación</th>
                <th>Fuente</th>
                <th>Precio Mín.</th>
                <th>Disponible</th>
                <th>Coincidencia</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredTableItems.length ? filteredTableItems.map(item => {
                const src = item.product.source;
                const srcCls = src === "falabella-cl" ? styles.sourceFalabella : src === "ripley-cl" ? styles.sourceRipley : styles.sourceMulti;
                const srcLabel = src === "falabella-cl" ? "Falabella" : src === "ripley-cl" ? "Ripley" : "Multi";
                const avail = item.product.available !== false;
                return (
                  <tr key={item.product.id}>
                    <td><code style={{ fontSize: ".68rem", opacity: .8 }}>{item.product.id}</code></td>
                    <td><strong>{item.product.brand}</strong></td>
                    <td style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.product.name}</td>
                    <td>{item.product.unit}</td>
                    <td><span className={`${styles.sourceBadge} ${srcCls}`}>{srcLabel}</span></td>
                    <td><strong>{item.minPrice ? money.format(item.minPrice) : "—"}</strong></td>
                    <td>
                      <span className={`${styles.availBadge} ${avail ? styles.availBadgeOk : styles.availBadgeBad}`}>
                        {avail ? "✓ Sí" : "✗ No"}
                      </span>
                    </td>
                    <td>
                      {(item.product.matchedStores ?? 0) > 1
                        ? <span style={{ color: "#15803d", fontWeight: 700, fontSize: ".75rem" }}>✓ 2 Tiendas</span>
                        : <span style={{ color: "var(--on-surface-muted)", fontSize: ".75rem" }}>1 Tienda</span>}
                    </td>
                    <td>
                      <Link href={`/perfumes/${item.product.id}`} className={styles.tableActionLink}>
                        Ver ↗
                      </Link>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: 32, color: "var(--on-surface-muted)" }}>
                    No se encontraron productos para &ldquo;{tableSearch}&rdquo;
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
      {controlBar}

      {section === "client" ? (
        <CatalogExplorer initialQuery={initialQuery} />
      ) : (
        <div className={styles.adminLayout}>
          {sidebar}
          <div>
            {section === "overview"  && overviewSection}
            {section === "sync"      && syncSection}
            {section === "catalog"   && catalogTableSection}
          </div>
        </div>
      )}
    </div>
  );
}
