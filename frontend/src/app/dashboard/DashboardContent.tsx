"use client";

import { CatalogExplorer } from "@/features/catalog/components/CatalogExplorer";
import { PageHeader } from "@/shared/components/PageHeader";
import { FeatureTabs } from "@/shared/components/FeatureTabs";
import { AdSidebarLayout } from "@/shared/components/AdSidebarLayout";
import styles from "./dashboard.module.css";

export function DashboardContent({ initialQuery = "" }: { initialQuery?: string }) {
  return (
    <main className={styles.page}>
      <PageHeader
        eyebrow="Comparador local"
        title="Encuentra tu perfume al mejor precio"
        description="Reunimos fragancias de tiendas verificadas, identificamos cuándo se trata del mismo perfume y ordenamos sus precios para ayudarte a elegir dónde comprar."
      />
      <AdSidebarLayout>
        <div className={styles.main}>
          <FeatureTabs active="dashboard" />
          <CatalogExplorer initialQuery={initialQuery} />
        </div>
      </AdSidebarLayout>
    </main>
  );
}

