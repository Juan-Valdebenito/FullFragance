"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAdmin } from "../AdminContext";
import { ADMIN_STORES } from "../domain/stores";
import { AdminIcon } from "./AdminIcon";
import { ActivityList } from "./ActivityList";
import { Panel, SectionHeader, StatCard, percent } from "./ui";
import styles from "./admin.module.css";

const BRANDS_PER_PAGE = 8;

export function OverviewSection() {
  const { items, loadingCatalog, activity } = useAdmin();
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
      <SectionHeader title="Resumen" description="Estado del catálogo comparado y de las tiendas conectadas." />

      <div className={styles.statGrid}>
        <StatCard label="Perfumes en catálogo" value={total.toLocaleString("es-CL")} hint="Agrupados entre tiendas" loading={loadingCatalog} />
        <StatCard label="En 2 o más tiendas" value={stats.multiStore.toLocaleString("es-CL")} hint={`${percent(stats.multiStore, total)}% del catálogo`} loading={loadingCatalog} />
        <StatCard label="Con precio activo" value={`${percent(stats.withPrice, total)}%`} hint={`${stats.withPrice.toLocaleString("es-CL")} perfumes`} loading={loadingCatalog} />
        <StatCard label="Tiendas con productos" value={`${stats.activeStores} / ${ADMIN_STORES.length}`} hint={<Link href="/admin/sincronizacion">Ver sincronización</Link>} loading={loadingCatalog} />
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
                  <span className={styles.barFill} style={{ width: `${(store.count / maxStore) * 100}%` }} />
                </span>
                <span className={styles.barValue}>{store.count.toLocaleString("es-CL")}</span>
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
          {visibleBrands.map(([brand, count]) => (
            <li key={brand}>
              <span className={styles.barLabel} title={brand}>{brand}</span>
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
