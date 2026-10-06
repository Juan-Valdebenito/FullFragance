"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useAdmin } from "../AdminContext";
import { ADMIN_STORES, adminStore } from "../domain/stores";
import { AdminIcon } from "./AdminIcon";
import { SectionHeader } from "./ui";
import styles from "./admin.module.css";

const PAGE_SIZE = 25;
const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

function normalize(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export function CatalogSection({ initialQuery = "" }: { initialQuery?: string }) {
  const { items, loadingCatalog } = useAdmin();
  const [query, setQuery] = useState(initialQuery);
  const [storeFilter, setStoreFilter] = useState("all");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const q = normalize(query);
    const store = adminStore(storeFilter);
    return items.filter((item) => {
      const matchesText = !q || normalize(`${item.product.brand} ${item.product.name} ${item.product.id}`).includes(q);
      const matchesStore = storeFilter === "all"
        || (storeFilter === "multi" ? (item.product.matchedStores ?? 0) > 1 : item.prices.some((price) => price.storeName === store?.name));
      return matchesText && matchesStore;
    });
  }, [items, query, storeFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const rows = filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  return (
    <>
      <SectionHeader title="Catálogo" description={`Audita los ${items.length.toLocaleString("es-CL")} perfumes cargados en la base de datos.`} />

      <section className={styles.panel}>
        <div className={styles.tableToolbar}>
          <label className={styles.search}>
            <AdminIcon name="search" />
            <input
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(0); }}
              placeholder="Marca, perfume o ID…"
              aria-label="Filtrar catálogo"
            />
          </label>
          <select
            className={styles.select}
            value={storeFilter}
            onChange={(event) => { setStoreFilter(event.target.value); setPage(0); }}
            aria-label="Filtrar por tienda"
          >
            <option value="all">Todas las tiendas</option>
            <option value="multi">En 2 o más tiendas</option>
            {ADMIN_STORES.map((store) => <option key={store.source} value={store.source}>{store.name}</option>)}
          </select>
          <span className={styles.panelMeta}>{filtered.length.toLocaleString("es-CL")} resultados</span>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Perfume</th>
                <th>Presentación</th>
                <th>Origen</th>
                <th className={styles.numeric}>Mejor precio</th>
                <th>Tiendas</th>
                <th>Stock</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {loadingCatalog ? (
                <tr><td colSpan={7} className={styles.tableEmpty}>Cargando catálogo…</td></tr>
              ) : rows.length ? rows.map((item) => {
                const source = adminStore(item.product.source ?? "");
                const stores = item.product.matchedStores ?? 1;
                const available = item.product.available !== false;
                return (
                  <tr key={item.product.id}>
                    <td>
                      <span className={styles.cellTitle}>{item.product.name}</span>
                      <span className={styles.cellSub}>{item.product.brand} · <code>{item.product.id}</code></span>
                    </td>
                    <td>{item.product.unit || "—"}</td>
                    <td>
                      <span className={styles.storeTag}>
                        <span className={styles.dot} style={{ background: source?.color ?? "var(--outline)" }} />
                        {source?.name ?? "Varias"}
                      </span>
                    </td>
                    <td className={styles.numeric}>{item.minPrice ? money.format(item.minPrice) : "—"}</td>
                    <td>{stores > 1 ? <span className={styles.badgeAccent}>{stores} tiendas</span> : <span className={styles.badge}>1 tienda</span>}</td>
                    <td><span className={available ? styles.stockOk : styles.stockOut}>{available ? "Disponible" : "Agotado"}</span></td>
                    <td className={styles.numeric}>
                      <Link href={`/perfumes/${item.product.id}`} className={styles.rowLink} target="_blank" aria-label={`Abrir ficha de ${item.product.name}`}>
                        <AdminIcon name="external" size={16} />
                      </Link>
                    </td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={7} className={styles.tableEmpty}>Sin resultados para estos filtros.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <nav className={styles.pager} aria-label="Páginas del catálogo">
            <button type="button" className={styles.iconButton} onClick={() => setPage(current - 1)} disabled={current === 0} aria-label="Página anterior">
              <AdminIcon name="chevronLeft" />
            </button>
            <span>{current + 1} de {pages}</span>
            <button type="button" className={styles.iconButton} onClick={() => setPage(current + 1)} disabled={current === pages - 1} aria-label="Página siguiente">
              <AdminIcon name="chevronRight" />
            </button>
          </nav>
        )}
      </section>
    </>
  );
}
