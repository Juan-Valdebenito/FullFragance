import type { Metadata } from "next";
import { Header } from "@/shared/components/Header";
import { Footer } from "@/shared/components/Footer";
import { PageHeader } from "@/shared/components/PageHeader";
import { PublicSessionContent } from "@/shared/components/PublicSessionContent";
import { StorePanel } from "@/features/stores/components/StorePanel";
import styles from "./tiendas.module.css";

export const metadata: Metadata = { title: "Tiendas cercanas | FullFragrance" };

export default function StoresPage() {
  return (
    <>
      <Header />
      <main className={styles.page}>
        <PageHeader
          eyebrow="Sucursales reales"
          title="Tiendas cercanas a ti"
          description="Ubica sucursales de Falabella, Ripley, París y perfumerías cercanas a tu ciudad con mapa interactivo y enlaces directos."
        />
        <div className={`container ${styles.main}`}>
          <PublicSessionContent>
            <section className={styles.storeSection}>
              <StorePanel />
            </section>
          </PublicSessionContent>
        </div>
      </main>
      <Footer />
    </>
  );
}
