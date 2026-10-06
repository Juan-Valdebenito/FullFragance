"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api, ApiError } from "@/shared/api/client";
import type { AdminMetrics, Comparison, SyncJob } from "@/shared/api/types";
import { ADMIN_STORES, type AdminStore } from "./domain/stores";

export type ActivityKind = "sync" | "error" | "info";
export type ActivityEvent = { id: number; title: string; time: string; kind: ActivityKind };
export type StoreSyncState = { running: boolean; failed: boolean; job: SyncJob | null; message: string };

type AdminValue = {
  items: Comparison[];
  loadingCatalog: boolean;
  metrics: AdminMetrics | null;
  loadingMetrics: boolean;
  reload: () => Promise<void>;
  saveAdRevenue: (revenue: number) => Promise<void>;
  syncState: Record<string, StoreSyncState>;
  syncStore: (store: AdminStore) => Promise<void>;
  syncAll: () => Promise<void>;
  syncingAll: boolean;
  anySyncRunning: boolean;
  activity: ActivityEvent[];
};

const AdminContext = createContext<AdminValue | null>(null);
const IDLE: StoreSyncState = { running: false, failed: false, job: null, message: "" };

function clock() {
  return new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
}

// El estado vive en el layout de /admin: una sincronización en curso sigue
// avanzando aunque el admin cambie de sección.
export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Comparison[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [syncState, setSyncState] = useState<Record<string, StoreSyncState>>({});
  const [syncingAll, setSyncingAll] = useState(false);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const nextActivityId = useRef(1);

  const log = useCallback((title: string, kind: ActivityKind) => {
    const event = { id: nextActivityId.current++, title, time: clock(), kind };
    setActivity((current) => [event, ...current].slice(0, 30));
  }, []);

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    try {
      setItems(await api.comparisons(""));
    } catch {
      log("No se pudo consultar el catálogo", "error");
    } finally {
      setLoadingCatalog(false);
    }
  }, [log]);

  const loadMetrics = useCallback(async () => {
    setLoadingMetrics(true);
    try {
      setMetrics(await api.adminMetrics());
    } catch {
      log("No se pudieron cargar las métricas de visitas", "error");
    } finally {
      setLoadingMetrics(false);
    }
  }, [log]);

  useEffect(() => {
    const timeout = window.setTimeout(() => { void loadCatalog(); void loadMetrics(); }, 0);
    return () => window.clearTimeout(timeout);
  }, [loadCatalog, loadMetrics]);

  const reload = useCallback(async () => {
    await Promise.all([loadCatalog(), loadMetrics()]);
  }, [loadCatalog, loadMetrics]);

  const saveAdRevenue = useCallback(async (revenue: number) => {
    setMetrics(await api.setAdRevenue(revenue));
  }, []);

  const patchStore = useCallback((source: string, patch: Partial<StoreSyncState>) => {
    setSyncState((current) => ({ ...current, [source]: { ...(current[source] ?? IDLE), ...patch } }));
  }, []);

  const syncStore = useCallback(async (store: AdminStore) => {
    patchStore(store.source, { running: true, failed: false, job: null, message: "Iniciando…" });
    log(`Sincronización de ${store.name} iniciada`, "info");
    try {
      let { job } = await store.sync();
      while (job.status === "running") {
        const pct = job.targetProducts ? ` (${Math.round((job.imported / job.targetProducts) * 100)}%)` : "";
        const page = job.currentPage > 0 ? `Página ${job.currentPage} · ` : "";
        patchStore(store.source, { job, message: `${page}${job.imported} productos${pct}` });
        await new Promise((resolve) => window.setTimeout(resolve, 2000));
        job = await api.syncJob(job.id);
      }
      if (job.status === "failed") throw new ApiError(job.error || `Falló la sincronización de ${store.name}.`, 500);
      patchStore(store.source, { job, message: `${job.imported} productos importados` });
      log(`${store.name}: ${job.imported} productos importados`, "sync");
      await loadCatalog();
    } catch (error) {
      const message = error instanceof ApiError ? error.message : `Error al sincronizar ${store.name}.`;
      patchStore(store.source, { failed: true, message });
      log(`${store.name}: ${message}`, "error");
    } finally {
      patchStore(store.source, { running: false });
    }
  }, [loadCatalog, log, patchStore]);

  const syncAll = useCallback(async () => {
    setSyncingAll(true);
    log("Sincronización de todas las tiendas iniciada", "info");
    try {
      for (const store of ADMIN_STORES) await syncStore(store);
    } finally {
      setSyncingAll(false);
    }
  }, [log, syncStore]);

  const anySyncRunning = syncingAll || Object.values(syncState).some((state) => state.running);

  const value = useMemo<AdminValue>(() => ({
    items, loadingCatalog, metrics, loadingMetrics, reload, saveAdRevenue,
    syncState, syncStore, syncAll, syncingAll, anySyncRunning, activity,
  }), [items, loadingCatalog, metrics, loadingMetrics, reload, saveAdRevenue, syncState, syncStore, syncAll, syncingAll, anySyncRunning, activity]);

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error("useAdmin debe usarse dentro de AdminProvider");
  return context;
}

export function useStoreSync(source: string) {
  return useAdmin().syncState[source] ?? IDLE;
}
