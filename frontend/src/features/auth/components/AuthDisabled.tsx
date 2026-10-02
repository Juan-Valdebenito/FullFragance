import { Brand } from "@/shared/components/Brand";
import { Footer } from "@/shared/components/Footer";
import styles from "@/app/auth.module.css";

/**
 * Se muestra en /login y /registro cuando NEXT_PUBLIC_ACCOUNTS_ENABLED="false".
 * No solo se oculta el botón del header (eso ya pasaba antes): la propia
 * página deja de funcionar, para que alguien que escriba la URL directo
 * tampoco pueda usarla mientras esté desactivada.
 */
export function AuthDisabled() {
  return (
    <div className={styles.shell}>
      <header className={`container ${styles.header}`}><Brand /></header>
      <main className={styles.main}>
        <div className={`container ${styles.grid}`} style={{ gridTemplateColumns: "1fr", maxWidth: 480, margin: "0 auto" }}>
          <section className={styles.pitch}>
            <p className="eyebrow">Acceso no disponible</p>
            <h1 className="display">Por ahora, no se puede iniciar sesión aquí.</h1>
            <p className={styles.lead}>Esta sección está temporalmente desactivada. Vuelve a intentarlo más tarde.</p>
          </section>
        </div>
      </main>
      <Footer compact />
    </div>
  );
}
