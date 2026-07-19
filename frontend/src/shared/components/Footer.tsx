import Link from "next/link";
import { Brand } from "./Brand";
import styles from "./shared.module.css";

export function Footer({ compact = false }: { compact?: boolean }) {
  return <footer className={`${styles.footer} ${compact ? styles.compact : ""}`}><div className={`container ${styles.footerInner}`}>
    <div><Brand /><p>© 2026 FullFragrance. La autoridad en alta perfumería.</p></div>
    <nav aria-label="Enlaces legales"><Link href="#">Privacidad</Link><Link href="#">Términos</Link><Link href="#">Contacto</Link><Link href="#">Newsletter</Link></nav>
  </div></footer>;
}
