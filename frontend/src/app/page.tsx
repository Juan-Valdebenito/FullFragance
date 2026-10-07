import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/shared/components/Footer";
import { Header } from "@/shared/components/Header";
import { Icon } from "@/shared/components/Icon";
import { LandingFeatured } from "@/features/catalog/components/LandingFeatured";
import { DealOfDay } from "@/features/catalog/components/DealOfDay";
import { HeroBanner } from "@/features/catalog/components/HeroBanner";
import { api } from "@/shared/api/client";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "FullFragance | Comparador de precios de perfumes en Chile",
  description: "Compara precios de perfumes originales entre las principales tiendas de Chile y encuentra dónde está más barato antes de comprar.",
  alternates: { canonical: "/" },
};

const thousands = new Intl.NumberFormat("es-CL");

// Cifras leídas del catálogo vigente; si el backend no responde (cold start),
// la home sale con textos sin números en vez de cifras inventadas.
async function homeFeatures() {
  const stats = await api.catalogStats().catch(() => null);
  const products = stats ? Math.floor(stats.products / 100) * 100 : 0;
  return [
    { icon: "history" as const, title: "Precios actualizados", text: products ? `Más de ${thousands.format(products)} perfumes` : "Miles de perfumes originales" },
    { icon: "swap" as const, title: stats?.stores.length ? `Compara ${stats.stores.length} tiendas` : "Compara tiendas", text: "Elige la más barata para ti" },
    { icon: "chart" as const, title: "Sin intermediarios", text: "Compras directo en la tienda" },
  ];
}

const categories = [
  { label: "Diseñador", text: "Dior, Chanel, Versace", href: "/dashboard?segment=designer", icon: "compass" as const },
  { label: "Nicho", text: "Xerjoff, Creed, Mancera", href: "/dashboard?segment=niche", icon: "tree" as const },
  { label: "Árabes", text: "Lattafa, Armaf, Afnan", href: "/dashboard?segment=arabic", icon: "flower" as const },
  { label: "Mujer", text: "Florales y gourmand", href: "/dashboard?gender=Femenino", icon: "flower" as const },
  { label: "Hombre", text: "Amaderados y frescos", href: "/dashboard?gender=Masculino", icon: "leaf" as const },
  { label: "Unisex", text: "Ámbar y aromáticos", href: "/dashboard?gender=Unisex", icon: "heart" as const },
];

export default async function HomePage() {
  const features = await homeFeatures();
  return (
    <>
      <Header />
      <main>
        <div className="container">
          <HeroBanner />
          <ul className={styles.features} aria-label="Qué hace FullFragance">
            {features.map(feature => (
              <li key={feature.title}>
                <Icon name={feature.icon} size={26} />
                <span>
                  <strong>{feature.title}</strong>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <DealOfDay />

        <section className={`container ${styles.section}`} aria-labelledby="categories-title">
          <div className={styles.sectionHead}>
            <h2 id="categories-title">Explora por categoría</h2>
          </div>
          <ul className={styles.categoryGrid}>
            {categories.map(category => (
              <li key={category.label}>
                <Link href={category.href} className={styles.categoryCard}>
                  <span className={styles.categoryIcon}><Icon name={category.icon} size={24} /></span>
                  <strong>{category.label}</strong>
                  <small>{category.text}</small>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <LandingFeatured />
      </main>
      <Footer />
    </>
  );
}
