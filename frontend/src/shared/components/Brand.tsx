import Link from "next/link";
import styles from "./shared.module.css";

export function Brand() {
  return <Link className={styles.brand} href="/"><strong>FullFragrance</strong><small>Compara · descubre · ahorra</small></Link>;
}
