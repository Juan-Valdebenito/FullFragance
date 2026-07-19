import type { Metadata } from "next";
import { CatalogExplorer } from "@/features/catalog/components/CatalogExplorer";
import { Header } from "@/shared/components/Header";
import { Footer } from "@/shared/components/Footer";
import { StorePanel } from "@/features/stores/components/StorePanel";
import styles from "./dashboard.module.css";

export const metadata: Metadata = { title: "Precios en Santiago | FullFragrance" };
export default function DashboardPage() {
  return <><Header active="catalog"/><main className={`container ${styles.main}`}>
    <section className={styles.hero}><p className="eyebrow">Comparador local</p><h1 className="display">Precios en Santiago</h1><p>Monitorizamos las principales perfumerías de lujo para ofrecerte el mejor valor hoy.</p></section>
    <nav className={styles.tabs}><span className={styles.active}>Comparar precios</span><a href="/recomendaciones">Para ti</a><a href="/test">Notas olfativas</a><a href="/favoritos">Mis favoritos</a><small>Precios actuales</small></nav>
    <div className={styles.layout}><StorePanel/><CatalogExplorer /></div>
  </main><Footer/></>;
}
