import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/shared/components/Footer";
import { Header } from "@/shared/components/Header";
import { Icon } from "@/shared/components/Icon";
import { LandingFeatured } from "@/features/catalog/components/LandingFeatured";
import { DealOfDay } from "@/features/catalog/components/DealOfDay";
import { HeroBanner } from "@/features/catalog/components/HeroBanner";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "FullFragance | Comparador de precios de perfumes en Chile",
  description: "Compara más de 13.000 perfumes originales en 12 tiendas de Chile y encuentra dónde está más barato antes de comprar.",
  alternates: { canonical: "/" },
};

const features = [
  { icon: "history" as const, title: "Precios actualizados", text: "Más de 13.000 perfumes" },
  { icon: "swap" as const, title: "Compara 12 tiendas", text: "Elige la más barata para ti" },
  { icon: "trend" as const, title: "Historial de precios", text: "Compra en el mejor momento" },
];

const categories = [
  { label: "Diseñador", text: "Dior, Chanel, Versace", href: "/dashboard?segment=designer", icon: "compass" as const },
  { label: "Nicho", text: "Xerjoff, Creed, Mancera", href: "/dashboard?segment=niche", icon: "tree" as const },
  { label: "Árabes", text: "Lattafa, Armaf, Afnan", href: "/dashboard?segment=arabic", icon: "flower" as const },
  { label: "Mujer", text: "Florales y gourmand", href: "/dashboard?gender=Femenino", icon: "flower" as const },
  { label: "Hombre", text: "Amaderados y frescos", href: "/dashboard?gender=Masculino", icon: "leaf" as const },
  { label: "Unisex", text: "Ámbar y aromáticos", href: "/dashboard?gender=Unisex", icon: "heart" as const },
];

export default function HomePage() {
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
