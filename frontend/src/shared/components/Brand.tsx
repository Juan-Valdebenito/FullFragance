import Link from "next/link";
import { BrandIcon } from "./BrandIcon";
import styles from "./shared.module.css";

export function Brand() {
  return (
    <Link className={styles.brand} href="/" aria-label="FullFragrance, ir al inicio">
      <BrandIcon size={34} />
      <span className={styles.wordmark}>
        <span>Full</span>Fragrance
      </span>
    </Link>
  );
}
