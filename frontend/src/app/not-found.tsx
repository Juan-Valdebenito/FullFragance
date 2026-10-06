import Link from "next/link";
import { Header } from "@/shared/components/Header";
import { Footer } from "@/shared/components/Footer";
import { BrandIcon } from "@/shared/components/BrandIcon";
import styles from "./not-found.module.css";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className={`container ${styles.page}`}>
        <span className={styles.emblem}><BrandIcon size={72} /></span>
        <h1>No encontramos esta página</h1>
        <p>Puede que el perfume ya no esté en ninguna tienda o que el enlace esté incompleto.</p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/dashboard">Buscar en el catálogo</Link>
          <Link className={styles.secondary} href="/">Ir al inicio</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
