import type { Metadata } from "next";
import { CatalogExplorer } from "@/features/catalog/components/CatalogExplorer";
import { Header } from "@/shared/components/Header";
import { Footer } from "@/shared/components/Footer";
import { PageHeader } from "@/shared/components/PageHeader";
import { StorePanel } from "@/features/stores/components/StorePanel";
import styles from "./dashboard.module.css";

export const metadata: Metadata = { title: "Comparador de perfumes | FullFragrance" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const initialQuery = typeof params.q === "string" ? params.q : "";

  return (
    <>
      <Header active="catalog" />
      <main className={styles.page}>
        <PageHeader
          eyebrow="Comparador local"
          title="Encuentra tu perfume al mejor precio"
          description="Reunimos fragancias de tiendas verificadas, identificamos cuándo se trata del mismo perfume y ordenamos sus precios para ayudarte a elegir dónde comprar."
        />
        <div className={`container ${styles.main}`}>
          <nav className={styles.tabs}>
            <span className={styles.active}>Comparar precios</span>
            <a href="/recomendaciones">Para ti</a>
            <a href="/test">Notas olfativas</a>
            <a href="/favoritos">Mis favoritos</a>
            <small>Precios actuales</small>
          </nav>
          <CatalogExplorer initialQuery={initialQuery} />
          <section className={styles.storeSection}>
            <StorePanel />
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
