import type { Metadata } from "next";
import { Header } from "@/shared/components/Header";
import { FeatureTabs } from "@/shared/components/FeatureTabs";
import { Footer } from "@/shared/components/Footer";
import { PageHeader } from "@/shared/components/PageHeader";
import { FavoritesCatalog } from "@/features/catalog/components/FavoritesCatalog";
import styles from "./favorites.module.css";

export const metadata: Metadata = { title: "Mis favoritos | FullFragrance" };

export default function FavoritesPage() {
  return (
    <>
      <Header />
      <main>
        <PageHeader
          eyebrow="Tu colección personal"
          title="Mis favoritos"
          description="Todos los perfumes que guardaste, con sus precios actualizados."
        />
        <div className={`container ${styles.main}`}>
          <FeatureTabs active="favoritos" />
          <FavoritesCatalog className={styles.grid} />
        </div>
      </main>
      <Footer />
    </>
  );
}
