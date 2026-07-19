import type { Metadata } from "next";
import { CatalogExplorer } from "@/features/catalog/components/CatalogExplorer";
import { Header } from "@/shared/components/Header";
import { Footer } from "@/shared/components/Footer";
import { Icon } from "@/shared/components/Icon";
import styles from "./dashboard.module.css";

export const metadata: Metadata = { title: "Precios en Santiago | FullFragrance" };
export default function DashboardPage() {
  return <><Header active="catalog"/><main className={`container ${styles.main}`}>
    <section className={styles.hero}><p className="eyebrow">Comparador local</p><h1 className="display">Precios en Santiago</h1><p>Monitorizamos las principales perfumerías de lujo para ofrecerte el mejor valor hoy.</p></section>
    <nav className={styles.tabs}><span className={styles.active}>Comparar precios</span><a href="/recomendaciones">Para ti</a><a href="/test">Notas olfativas</a><span>Mis favoritos</span><small>Actualizado hace 4 min</small></nav>
    <div className={styles.layout}><aside className={styles.mapCard}><div className={styles.mapHeader}><h2>Tiendas cerca de ti</h2><span><i/>6 tiendas abiertas</span></div><div className={styles.map}>
      <div className={styles.mapLines}/><div className={styles.callout}><strong>Sephora Parque Arauco</strong><p>Mejor precio para Chanel Nº5 disponible en tienda.</p><button>Ver inventario</button></div>
      <span className={`${styles.marker} ${styles.one}`}><Icon name="pin"/></span><span className={`${styles.marker} ${styles.two}`}><Icon name="pin"/></span><span className={`${styles.marker} ${styles.three}`}><Icon name="pin"/></span>
    </div><div className={styles.mall}><span><Icon name="pin"/></span><div><strong>Costanera Center</strong><p>3 opciones de precio disponibles</p></div><Icon name="arrow"/></div></aside><CatalogExplorer /></div>
  </main><Footer/></>;
}
