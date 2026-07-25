"use client";

import { useOptionalSession } from "@/shared/auth/SessionContext";
import { AdminDashboard } from "@/features/admin/components/AdminDashboard";
import { CatalogExplorer } from "@/features/catalog/components/CatalogExplorer";
import { PageHeader } from "@/shared/components/PageHeader";
import { FeatureTabs } from "@/shared/components/FeatureTabs";
import styles from "./dashboard.module.css";

export function DashboardContent({ initialQuery = "" }: { initialQuery?: string }) {
  const session = useOptionalSession();
  const user = session?.user ?? null;
  const isAdmin = user?.role === "admin";

  if (isAdmin) {
    return (
      <main className={styles.page}>
        <PageHeader
          eyebrow="Panel de Administración"
          title="Centro de Control & Gestión"
          description="Monitorea las métricas del sistema, ejecuta scrapers de tiendas en tiempo real y gestiona el catálogo de perfumes."
        />
        <div className={`container ${styles.main}`}>
          <AdminDashboard user={user} initialQuery={initialQuery} />
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <PageHeader
        eyebrow="Comparador local"
        title="Encuentra tu perfume al mejor precio"
        description="Reunimos fragancias de tiendas verificadas, identificamos cuándo se trata del mismo perfume y ordenamos sus precios para ayudarte a elegir dónde comprar."
      />
      <div className={`container ${styles.main}`}>
        <FeatureTabs active="dashboard" />
        <CatalogExplorer initialQuery={initialQuery} />
      </div>
    </main>
  );
}
