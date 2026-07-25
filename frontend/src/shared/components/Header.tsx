import { Brand } from "./Brand";
import { HeaderNav } from "./HeaderNav";
import { HeaderActions } from "./HeaderActions";
import styles from "./shared.module.css";

export function Header({ active }: { active?: "catalog" | "test" }) {
  return (
    <header className={styles.topbar}>
      <div className={`container ${styles.nav}`}>
        <div className={styles.navStart}>
          <Brand />
          <HeaderNav active={active} />
        </div>
        <HeaderActions />
      </div>
    </header>
  );
}
