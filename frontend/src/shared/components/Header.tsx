import Link from "next/link";
import { Brand } from "./Brand";
import { Icon } from "./Icon";
import { LogoutButton } from "./LogoutButton";
import { UserLocation } from "./UserLocation";
import styles from "./shared.module.css";

export function Header({ active }: { active?: "catalog" | "test" }) {
  return <header className={styles.topbar}><div className={`container ${styles.nav}`}>
    <div className={styles.navStart}><Brand /><nav aria-label="Navegación principal">
      <Link className={active === "catalog" ? styles.active : ""} href="/dashboard">Catálogo</Link>
      <Link className={active === "test" ? styles.active : ""} href="/test">Test Olfativo</Link>
      <Link href="/recomendaciones">Para ti</Link><Link href="/favoritos">Favoritos</Link>
    </nav></div>
    <div className={styles.actions}><span><UserLocation /></span><Link aria-label="Perfil" href="/perfil"><Icon name="user" /></Link><LogoutButton /></div>
  </div></header>;
}
