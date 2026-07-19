import type { Metadata } from "next";
import { AuthPanel } from "@/features/auth/components/AuthPanel";
import { Brand } from "@/shared/components/Brand";
import { Footer } from "@/shared/components/Footer";
import { Icon } from "@/shared/components/Icon";
import styles from "./auth.module.css";

export const metadata: Metadata = { title: "Acceso | FullFragrance" };

export default function AccessPage() {
  return (
    <div className={styles.shell}>
      <header className={`container ${styles.header}`}>
        <Brand />
        <div className={styles.location}><Icon name="pin" /> Santiago, CL</div>
      </header>
      <main className={styles.main}>
        <div className={`container ${styles.grid}`}>
          <section className={styles.pitch}>
            <p className="eyebrow">Perfumería inteligente</p>
            <h1 className="display">Encuentra la esencia<br />de tu <span>próximo lujo.</span></h1>
            <p className={styles.lead}>Compara precios de perfumes en tiendas de tu ciudad y descubre fragancias según tus gustos. Acceso exclusivo a la autoridad en alta perfumería.</p>
            <div className={styles.benefits}>
              <span><Icon name="chart" /> Comparador en tiempo real</span>
              <span><Icon name="compass" /> Descubrimiento guiado</span>
            </div>
          </section>
          <AuthPanel />
        </div>
      </main>
      <Footer compact />
    </div>
  );
}
