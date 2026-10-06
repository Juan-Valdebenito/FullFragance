"use client";

import { CatalogExplorer } from "@/features/catalog/components/CatalogExplorer";
import { AdSidebarLayout } from "@/shared/components/AdSidebarLayout";
import styles from "./dashboard.module.css";

// Mismo patrón que la home: sin bloque de título aparte ni pestañas; el
// catálogo abre directo con su título, los segmentos y los perfumes.
export function DashboardContent({ initialQuery = "" }: { initialQuery?: string }) {
  return (
    <main className={styles.page}>
      <AdSidebarLayout>
        <div className={styles.main}>
          <CatalogExplorer initialQuery={initialQuery} />
        </div>
      </AdSidebarLayout>
    </main>
  );
}
