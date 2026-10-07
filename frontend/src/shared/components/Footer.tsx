import Link from "next/link";
import { Brand } from "./Brand";
import { FooterPlatformLinks } from "./FooterPlatformLinks";
import { AdBanner } from "./AdBanner";
import styles from "./shared.module.css";

const EXPLORE_LINKS = [
  { href: "/dashboard?sort=savings", label: "Ofertas de hoy" },
  { href: "/dashboard?segment=designer", label: "Diseñador" },
  { href: "/dashboard?segment=niche", label: "Nicho" },
  { href: "/dashboard?segment=arabic", label: "Árabes" },
];

const AUTHORS = ["Benjamin Cantero", "Juan Valdebenito"];

// Bloque oscuro como el banner de la home y el menú del admin: cierra la
// página con la misma identidad con la que abre.
export function Footer({ compact = false }: { compact?: boolean }) {
  const year = new Date().getFullYear();

  return (
    <footer className={`${styles.footer} ${compact ? styles.compact : ""}`}>
      {!compact && (
        <div className={`container ${styles.footerAdStrip}`}>
          <AdBanner format="strip" slotId={process.env.NEXT_PUBLIC_AD_SLOT_HOME_STRIP} />
        </div>
      )}

      <div className={`container ${styles.footerInner}`}>
        <section className={styles.footerProfile}>
          <Brand />
          <p>Comparamos perfumes originales en las principales tiendas de Chile para que sepas dónde está más barato antes de comprar.</p>
          <ul className={styles.footerContact}>
            <li><a href="mailto:fullfragance67@gmail.com">fullfragance67@gmail.com</a></li>
            <li><a href="tel:+56984616551">+56 9 8461 6551</a></li>
            <li>Temuco, Chile</li>
          </ul>
        </section>

        <nav className={styles.footerColumn} aria-label="Explorar">
          <h2>Explorar</h2>
          <FooterPlatformLinks />
          {EXPLORE_LINKS.map(link => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>

        <nav className={styles.footerColumn} aria-label="Ayuda">
          <h2>Ayuda</h2>
          <a href="mailto:fullfragance67@gmail.com">Soporte</a>
          <a href="mailto:fullfragance67@gmail.com?subject=Corrección de datos">Reportar un precio</a>
          <Link href="/sobre-nosotros">Sobre nosotros</Link>
          <Link href="/como-comparamos">Cómo comparamos</Link>
          <Link href="/guias">Guías</Link>
          <Link href="/politica-de-datos">Política de datos</Link>
          <Link href="/politica-de-uso">Política de uso</Link>
        </nav>
      </div>

      <div className={styles.footerBottom}>
        <div className="container">
          <p>© {year} FullFragance. Precios informados por cada tienda.</p>
          <p className={styles.footerCredits}>
            Creado y desarrollado por <strong>{AUTHORS[0]}</strong> y <strong>{AUTHORS[1]}</strong>
          </p>
        </div>
      </div>
    </footer>
  );
}
