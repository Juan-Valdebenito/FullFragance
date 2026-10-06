"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import { BrandIcon } from "@/shared/components/BrandIcon";
import { useAdmin } from "../AdminContext";
import { ADMIN_STORES } from "../domain/stores";
import { AdminIcon } from "./AdminIcon";
import { ActivityList } from "./ActivityList";
import { Panel, StatCard, percent } from "./ui";
import styles from "./admin.module.css";

const BRANDS_PER_PAGE = 8;

export function OverviewSection() {
  const { items, loadingCatalog, activity, anySyncRunning } = useAdmin();
  const user = useOptionalSession()?.user;
  const firstName = (user?.name?.trim() || "").split(" ")[0] || "admin";
  const date = new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" });
  const today = date.charAt(0).toUpperCase() + date.slice(1);
  const [brandPage, setBrandPage] = useState(0);

  const stats = useMemo(() => {
    const perStore = new Map<string, number>();
    const brands = new Map<string, number>();
    let multiStore = 0;
    let withPrice = 0;
    for (const item of items) {
      if ((item.product.matchedStores ?? 0) > 1) multiStore += 1;
      if ((item.minPrice ?? 0) > 0) withPrice += 1;
      for (const name of new Set(item.prices.map((price) => price.storeName))) {
        perStore.set(name, (perStore.get(name) ?? 0) + 1);
      }
      const brand = item.product.brand || "Sin marca";
      brands.set(brand, (brands.get(brand) ?? 0) + 1);
    }
    const stores = ADMIN_STORES
      .map((store) => ({ ...store, count: perStore.get(store.name) ?? 0 }))
      .sort((a, b) => b.count - a.count);
    return {
      multiStore,
      withPrice,
      stores,
      activeStores: stores.filter((store) => store.count > 0).length,
      brands: [...brands.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [items]);

  const total = items.length;
  const maxStore = Math.max(1, stats.stores[0]?.count ?? 0);
  const brandPages = Math.max(1, Math.ceil(stats.brands.length / BRANDS_PER_PAGE));
  const page = Math.min(brandPage, brandPages - 1);
  const visibleBrands = stats.brands.slice(page * BRANDS_PER_PAGE, (page + 1) * BRANDS_PER_PAGE);
  const maxBrand = stats.brands[0]?.[1] ?? 1;

  return (
    <>
      {/* Bienvenida: el mismo bloque oscuro con brillo bronce del banner de la home */}
      <section className={styles.welcome} aria-labelledby="welcome-title">
        <div>
          <p className={styles.welcomeDate}>{today}</p>
          <h1 id="welcome-title">Hola, {firstName}</h1>
          <p className={styles.welcomeText}>
            {loadingCatalog
              ? "Cargando el estado del catálogo…"
              : <>Hay <strong>{total.toLocaleString("es-CL")}</strong> perfumes en el catálogo y <strong>{stats.multiStore.toLocaleString("es-CL")}</strong> se comparan en 2 o más tiendas.</>}
            {anySyncRunning && " Hay una sincronización en curso."}
          </p>
          <div className={styles.welcomeActions}>
            <Link className={styles.welcomePrimary} href="/admin/sincronizacion"><AdminIcon name="sync" size={16} /> Sincronizar tiendas</Link>
            <Link className={styles.welcomeSecondary} href="/admin/catalogo"><AdminIcon name="catalog" size={16} /> Revisar catálogo</Link>
            <Link className={styles.welcomeSecondary} href="/"><AdminIcon name="external" size={16} /> Ver sitio</Link>
          </div>
        </div>
        <span className={styles.welcomeEmblem} aria-hidden="true"><BrandIcon size={120} /></span>
      </section>

      <div className={styles.statGrid}>
        <StatCard icon="layers" label="Perfumes en catálogo" value={total.toLocaleString("es-CL")} hint="Agrupados entre tiendas" loading={loadingCatalog} />
        <StatCard icon="tag" label="En 2 o más tiendas" value={stats.multiStore.toLocaleString("es-CL")} hint={`${percent(stats.multiStore, total)}% del catálogo`} progress={percent(stats.multiStore, total)} loading={loadingCatalog} />
        <StatCard icon="activity" label="Con precio activo" value={`${percent(stats.withPrice, total)}%`} hint={`${stats.withPrice.toLocaleString("es-CL")} perfumes`} progress={percent(stats.withPrice, total)} loading={loadingCatalog} />
        <StatCard icon="stores" label="Tiendas con productos" value={`${stats.activeStores} / ${ADMIN_STORES.length}`} hint={<Link href="/admin/sincronizacion">Ver sincronización</Link>} progress={percent(stats.activeStores, ADMIN_STORES.length)} loading={loadingCatalog} />
      </div>

      <div className={styles.split}>
        <Panel title="Perfumes por tienda" meta={`${ADMIN_STORES.length} fuentes`}>
          <ul className={styles.barList}>
            {stats.stores.map((store) => (
              <li key={store.source}>
                <span className={styles.barLabel}>
                  <span className={styles.dot} style={{ background: store.color }} />
                  {store.name}
                </span>
                <span className={styles.barTrack}>
                  <span className={styles.barFill} style={{ width: `${(store.count / maxStore) * 100}%`, background: store.color }} />
                </span>
                <span className={store.count ? styles.barValue : styles.barValueZero}>{store.count ? store.count.toLocaleString("es-CL") : "Sin datos"}</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Actividad reciente" meta="Esta sesión">
          <ActivityList events={activity.slice(0, 6)} />
        </Panel>
      </div>

      <Panel title="Marcas en catálogo" meta={`${stats.brands.length.toLocaleString("es-CL")} marcas`}>
        <ul className={`${styles.barList} ${styles.barListColumns}`}>
          {visibleBrands.map(([brand, count], index) => (
            <li key={brand}>
              <span className={styles.barLabel} title={brand}>
                <span className={styles.rank}>{page * BRANDS_PER_PAGE + index + 1}</span>
                {brand}
              </span>
              <span className={styles.barTrack}>
                <span className={styles.barFill} style={{ width: `${(count / maxBrand) * 100}%` }} />
              </span>
              <span className={styles.barValue}>{count}</span>
            </li>
          ))}
        </ul>
        {brandPages > 1 && (
          <nav className={styles.pager} aria-label="Páginas de marcas">
            <button type="button" className={styles.iconButton} onClick={() => setBrandPage(page - 1)} disabled={page === 0} aria-label="Página anterior">
              <AdminIcon name="chevronLeft" />
            </button>
            <span>{page + 1} de {brandPages}</span>
            <button type="button" className={styles.iconButton} onClick={() => setBrandPage(page + 1)} disabled={page === brandPages - 1} aria-label="Página siguiente">
              <AdminIcon name="chevronRight" />
            </button>
          </nav>
        )}
      </Panel>
    </>
  );
}
