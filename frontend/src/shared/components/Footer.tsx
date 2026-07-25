import Link from "next/link";
import { Brand } from "./Brand";
import styles from "./shared.module.css";

export function Footer({ compact = false }: { compact?: boolean }) {
  return <footer className={`${styles.footer} ${compact ? styles.compact : ""}`}><div className={`container ${styles.footerInner}`}>
    <section className={styles.footerProfile}>
      <Brand />
      <p>Comparador local de perfumes de tiendas verificadas. Ordenamos precios, detectamos coincidencias entre comercios y ayudamos a comprar con mejor información.</p>
      <div className={styles.footerContact}>
        <a href="mailto:contacto@fullfragrance.cl">contacto@fullfragrance.cl</a>
        <a href="tel:+56912345678">+56 9 1234 5678</a>
        <span>Santiago, Chile</span>
      </div>
    </section>
    <section className={styles.footerColumn}>
      <h2>Plataforma</h2>
      <Link href="/dashboard">Comparar precios</Link>
      <Link href="/tiendas">Tiendas cercanas</Link>
      <Link href="/test">Test olfativo</Link>
      <Link href="/recomendaciones">Recomendaciones</Link>
      <Link href="/favoritos">Favoritos</Link>
    </section>
    <section className={styles.footerColumn}>
      <h2>Contacto</h2>
      <Link href="mailto:contacto@fullfragrance.cl">Soporte comercial</Link>
      <Link href="mailto:datos@fullfragrance.cl">Correcciones de datos</Link>
      <Link href="/politica-de-datos">Política de datos</Link>
      <Link href="/politica-de-uso">Política de uso</Link>
    </section>
    <aside className={styles.footerTrust}>
      <span>Tiendas verificadas</span>
      <strong>Comparación multi-tienda</strong>
      <p>Catálogo orientado a perfumería, sin productos marketplace en las comparaciones principales.</p>
    </aside>
  </div></footer>;
}
