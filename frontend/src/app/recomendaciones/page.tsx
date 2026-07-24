import type { Metadata } from "next";
import Link from "next/link";
import { RecommendationProfile, RecommendationsGrid } from "@/features/catalog/components/RecommendationsGrid";
import { Header } from "@/shared/components/Header";
import { Footer } from "@/shared/components/Footer";
import { Icon } from "@/shared/components/Icon";
import styles from "./recommendations.module.css";

export const metadata: Metadata = { title: "Fragancias para ti | FullFragrance" };
export default function RecommendationsPage() {
  return <><Header active="test"/><main className={`container ${styles.main}`}>
    <section className={styles.hero}><div><p className="eyebrow">Selección personalizada</p><h1 className="display">Fragancias para ti</h1><p>Basándonos en tus preferencias y en los perfumes disponibles actualmente en Falabella y Ripley.</p></div><RecommendationProfile/></section>
    <section><div className={styles.sectionTitle}><div><p className="eyebrow">Basado en tus preferencias</p><h2>Tu selección curada</h2></div><span>Resultados personalizados</span></div><RecommendationsGrid className={styles.grid}/></section>
    <section className={styles.cta}><div><h2>¿Quieres ahorrar en tu próxima fragancia?</h2><p>Comparamos precios en tiempo real entre las tiendas de alta perfumería más importantes del país para que siempre pagues lo justo.</p></div><Link href="/dashboard">Ver comparador de precios <Icon name="arrow"/></Link></section>
  </main><Footer/></>;
}
