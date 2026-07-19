"use client";
import { useMemo, useState } from "react";
import { products } from "../data/products";
import { ProductCard } from "./ProductCard";
import { Icon } from "@/shared/components/Icon";
import styles from "./catalog.module.css";

export function CatalogExplorer() {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => products.filter(p => `${p.brand} ${p.name} ${p.notes.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [query]);
  return <section className={styles.explorer}>
    <div className={styles.search}><Icon name="search" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Busca por marca, nota olfativa o nombre de perfume..."/><button aria-label="Filtros"><Icon name="filter" /> <span>Filtros</span></button></div>
    <div className={styles.grid}>{filtered.map(product => <ProductCard key={product.id} product={product} />)}</div>
    {filtered.length === 0 && <p className={styles.empty}>No encontramos fragancias para “{query}”.</p>}
  </section>;
}
