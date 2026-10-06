import { Brand } from "./Brand";
import { HeaderNav } from "./HeaderNav";
import { HeaderActions } from "./HeaderActions";
import { Icon } from "./Icon";
import styles from "./shared.module.css";

export function Header({ active }: { active?: "catalog" | "test" }) {
  return (
    <header className={styles.topbar}>
      {/* Una sola grilla: en escritorio marca · buscador · cuenta y abajo las
          categorías; en móvil el buscador baja a su propia fila. */}
      <div className={`container ${styles.headerGrid}`}>
        <Brand />
        <form className={styles.headerSearch} action="/dashboard" role="search">
          <label className="srOnly" htmlFor="header-search">Buscar perfume</label>
          <input id="header-search" name="q" placeholder="¿Qué perfume buscas?" autoComplete="off" />
          <button aria-label="Buscar"><Icon name="search" size={18} /></button>
        </form>
        <HeaderActions />
        <HeaderNav active={active} />
      </div>
    </header>
  );
}
