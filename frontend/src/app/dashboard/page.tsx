import type { Metadata } from "next";
import { CatalogExplorer } from "@/features/catalog/components/CatalogExplorer";
import { Header } from "@/shared/components/Header";
import { Footer } from "@/shared/components/Footer";
import { StorePanel } from "@/features/stores/components/StorePanel";
import styles from "./dashboard.module.css";

export const metadata: Metadata = { title: "Comparador de perfumes | FullFragrance" };
export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const params = await searchParams;
  const initialQuery = typeof params.q === "string" ? params.q : "";
  return <><Header active="catalog"/><main className={`container ${styles.main}`}>
    <section className={styles.hero}><p className="eyebrow">Comparador local</p><h1 className="display">Encuentra tu perfume al mejor precio</h1><p>Reunimos las fragancias disponibles en Falabella y Ripley, identificamos cuándo se trata del mismo perfume y ordenamos sus precios para ayudarte a elegir dónde comprar.</p></section>
    <nav className={styles.tabs}><span className={styles.active}>Comparar precios</span><a href="/recomendaciones">Para ti</a><a href="/test">Notas olfativas</a><a href="/favoritos">Mis favoritos</a><small>Precios actuales</small></nav>
    <div className={styles.layout}><StorePanel/><CatalogExplorer initialQuery={initialQuery} /></div>
  </main><Footer/></>;
}
