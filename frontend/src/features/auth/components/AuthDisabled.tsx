import Link from "next/link";
import { Header } from "@/shared/components/Header";
import { Footer } from "@/shared/components/Footer";
import { BrandIcon } from "@/shared/components/BrandIcon";
import styles from "@/app/auth.module.css";

/**
 * Se muestra en /login y /registro cuando NEXT_PUBLIC_ACCOUNTS_ENABLED="false".
 * No solo se oculta el botón del header (eso ya pasaba antes): la propia
 * página deja de funcionar, para que alguien que escriba la URL directo
 * tampoco pueda usarla mientras esté desactivada. En vez de un callejón sin
 * salida, lleva a lo que sí funciona sin cuenta: comparar precios.
 */
export function AuthDisabled() {
  return (
    <>
      <Header />
      <main className={`container ${styles.disabled}`}>
        <span className={styles.emblem}><BrandIcon size={64} /></span>
        <h1>Las cuentas están en pausa por ahora</h1>
        <p className={styles.lead}>
          Mientras tanto puedes usar todo el comparador sin registrarte: buscar perfumes, ver precios en todas las tiendas y las ofertas del día.
        </p>
        <div className={styles.actions}>
          <Link className={styles.primary} href="/dashboard">Ir al comparador</Link>
          <Link className={styles.secondary} href="/dashboard?sort=savings">Ver ofertas de hoy</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
