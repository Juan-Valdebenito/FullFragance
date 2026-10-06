"use client";

import { useAdmin, useStoreSync } from "../AdminContext";
import { ADMIN_STORES, type AdminStore } from "../domain/stores";
import { ActivityList } from "./ActivityList";
import { AdminIcon } from "./AdminIcon";
import { Panel, SectionHeader } from "./ui";
import styles from "./admin.module.css";

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
  const { items, syncAll, syncingAll, anySyncRunning, activity } = useAdmin();
  const counts = new Map<string, number>();
  for (const item of items) {
    for (const name of new Set(item.prices.map((price) => price.storeName))) counts.set(name, (counts.get(name) ?? 0) + 1);
  }

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

      <div className={styles.storeGrid}>
        {ADMIN_STORES.map((store) => (
          <StoreSyncCard key={store.source} store={store} count={counts.get(store.name) ?? 0} />
        ))}
      </div>

      <Panel title="Historial" meta="Esta sesión">
        <ActivityList events={activity} empty="Aún no se ejecutan sincronizaciones." showAction={false} />
      </Panel>
    </>
  );
}
