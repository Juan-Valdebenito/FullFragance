import Link from "next/link";
import { Brand } from "./Brand";
import { FooterPlatformLinks } from "./FooterPlatformLinks";
import styles from "./shared.module.css";

export function Footer({ compact = false }: { compact?: boolean }) {
  return <footer className={`${styles.footer} ${compact ? styles.compact : ""}`}><div className={`container ${styles.footerInner}`}>
    <section className={styles.footerProfile}>
      <Brand />
      <p>Comparador local de perfumes de tiendas verificadas. Ordenamos precios, detectamos coincidencias entre comercios y ayudamos a comprar con mejor información.</p>
      <div className={styles.footerContact}>
        <a href="mailto:fullfragance67@gmail.com">fullfragance67@gmail.com</a>
        <a href="tel:+56984616551">+56 9 8461 6551</a>
        <span>Santiago, Chile</span>
      </div>
    </section>
    <section className={styles.footerColumn}>
      <h2>Plataforma</h2>
      <FooterPlatformLinks />
    </section>
    <section className={styles.footerColumn}>
      <h2>Contacto</h2>
      <Link href="mailto:fullfragance67@gmail.com">Soporte comercial</Link>
      <Link href="mailto:fullfragance67@gmail.com">Correcciones de datos</Link>
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
