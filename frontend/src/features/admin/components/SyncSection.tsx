"use client";

import { useMemo, useState } from "react";
import { useAdmin, useStoreSync, type StoreSyncState } from "../AdminContext";
import { ADMIN_STORES, type AdminStore } from "../domain/stores";
import { ActivityList } from "./ActivityList";
import { AdminIcon } from "./AdminIcon";
import { Panel, SectionHeader } from "./ui";
import styles from "./admin.module.css";

type StatusKey = "done" | "pending" | "running" | "failed";
type FilterKey = "all" | StatusKey;

function statusOf(store: AdminStore, count: number, syncState: Record<string, StoreSyncState>): StatusKey {
  const state = syncState[store.source];
  if (state?.running) return "running";
  if (state?.failed) return "failed";
  return count > 0 ? "done" : "pending";
}

const FILTER_LABELS: Record<FilterKey, string> = {
  all: "Todas",
  done: "Completadas",
  pending: "Sin hacer",
  running: "En curso",
  failed: "Con errores",
};

function StoreSyncCard({ store, count }: { store: AdminStore; count: number }) {
  const { syncStore, syncingAll } = useAdmin();
  const { running, failed, job, message } = useStoreSync(store.source);
  const progress = job?.targetProducts
    ? Math.min(100, Math.round((job.imported / job.targetProducts) * 100))
    : job?.status === "completed" ? 100 : null;
  const done = job?.status === "completed";
  const state = running ? "En curso" : failed ? "Error" : done ? "Completado" : "Listo";

  return (
    <article
      className={`${styles.storeCard} ${count === 0 ? styles.storeEmpty : ""}`}
      style={{ "--store": store.color } as React.CSSProperties}
    >
      <header>
        <span className={styles.dot} style={{ background: store.color }} />
        <div>
          <h3>{store.name}</h3>
          <small>{store.domain} · {store.protocol}</small>
        </div>
        <span className={`${styles.state} ${running ? styles.stateRunning : failed ? styles.stateError : done ? styles.stateOk : ""}`}>{state}</span>
      </header>

      <p className={styles.storeCount}>
        {count === 0
          ? <>Sin perfumes: <strong className={styles.storeWarn}>revisa el scraper</strong></>
          : <><strong>{count.toLocaleString("es-CL")}</strong> perfumes en catálogo</>}
      </p>

      {running && (
        <div className={styles.progress} aria-hidden="true">
          <span style={{ width: `${progress ?? 12}%` }} className={progress === null ? styles.progressIndeterminate : ""} />
        </div>
      )}
      {message && <p className={styles.storeMessage} role="status">{message}</p>}

      <button type="button" className={styles.ghostButton} onClick={() => void syncStore(store)} disabled={running || syncingAll}>
        <AdminIcon name="sync" size={16} />
        {running ? "Sincronizando…" : "Sincronizar"}
      </button>
    </article>
  );
}

export function SyncSection() {
  const { items, syncAll, syncingAll, anySyncRunning, activity, syncState } = useAdmin();
  const [filter, setFilter] = useState<FilterKey>("all");

  const storesWithStatus = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      for (const name of new Set(item.prices.map((price) => price.storeName))) counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return ADMIN_STORES.map((store) => {
      const count = counts.get(store.name) ?? 0;
      return { store, count, status: statusOf(store, count, syncState) };
    });
  }, [items, syncState]);

  const filterCounts = useMemo(() => {
    const result: Record<FilterKey, number> = { all: storesWithStatus.length, done: 0, pending: 0, running: 0, failed: 0 };
    for (const entry of storesWithStatus) result[entry.status] += 1;
    return result;
  }, [storesWithStatus]);

  // "En curso" y "Con errores" solo aparecen si hay al menos una tienda en ese estado:
  // evita ensuciar el filtro con categorías vacías la mayoría del tiempo.
  const visibleFilters: FilterKey[] = (["all", "done", "pending", "running", "failed"] as FilterKey[])
    .filter((key) => key === "all" || key === "done" || key === "pending" || filterCounts[key] > 0);

  const visibleStores = filter === "all" ? storesWithStatus : storesWithStatus.filter((entry) => entry.status === filter);

  return (
    <>
      <SectionHeader
        title="Sincronización"
        description="Ejecuta los scrapers de cada tienda. El progreso continúa aunque cambies de sección."
      >
        <button type="button" className={styles.primaryButton} onClick={() => void syncAll()} disabled={anySyncRunning}>
          <AdminIcon name="sync" size={16} />
          {syncingAll ? "Sincronizando todo…" : "Sincronizar todo"}
        </button>
      </SectionHeader>

      <div className={styles.statusFilter} role="group" aria-label="Filtrar tiendas por estado">
        {visibleFilters.map((key) => (
          <button
            key={key}
            type="button"
            className={`${styles.filterPill} ${filter === key ? styles.filterPillActive : ""}`}
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
          >
            {FILTER_LABELS[key]} <span>{filterCounts[key]}</span>
          </button>
        ))}
      </div>

      {visibleStores.length ? (
        <div className={styles.storeGrid}>
          {visibleStores.map(({ store, count }) => (
            <StoreSyncCard key={store.source} store={store} count={count} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>No hay tiendas con este estado.</p>
      )}

      <Panel title="Historial" meta="Esta sesión">
        <ActivityList events={activity} empty="Aún no se ejecutan sincronizaciones." showAction={false} />
      </Panel>
    </>
  );
}
