import Link from "next/link";
import { Brand } from "./Brand";
import { Icon } from "./Icon";
import styles from "./shared.module.css";

export function Header({ active }: { active?: "catalog" | "test" }) {
  return <header className={styles.topbar}><div className={`container ${styles.nav}`}>
    <div className={styles.navStart}><Brand /><nav aria-label="Navegación principal">
      <Link className={active === "catalog" ? styles.active : ""} href="/dashboard">Catálogo</Link>
      <Link className={active === "test" ? styles.active : ""} href="/test">Test Olfativo</Link>
      <Link href="/recomendaciones">Para ti</Link><Link href="/dashboard">Tiendas</Link>
    </nav></div>
    <div className={styles.actions}><span><Icon name="pin" /> Santiago, CL</span><Link aria-label="Perfil" href="/"><Icon name="user" /></Link><Link aria-label="Salir" href="/"><Icon name="logout" /></Link></div>
  </div></header>;
}
