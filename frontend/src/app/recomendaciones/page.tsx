import type { Metadata } from "next";
import Link from "next/link";
import { recommendations } from "@/features/catalog/data/products";
import { ProductCard } from "@/features/catalog/components/ProductCard";
import { Header } from "@/shared/components/Header";
import { Footer } from "@/shared/components/Footer";
import { Icon } from "@/shared/components/Icon";
import styles from "./recommendations.module.css";

export const metadata: Metadata = { title: "Fragancias para ti | FullFragrance" };
export default function RecommendationsPage() {
  return <><Header active="test"/><main className={`container ${styles.main}`}>
    <section className={styles.hero}><div><p className="eyebrow">Selección personalizada</p><h1 className="display">Fragancias para ti</h1><p>Basándonos en tus preferencias, seleccionamos estas fragancias con perfiles olfativos que creemos que te encantarán.</p></div><aside><span>Tu perfil olfativo</span><h2>Amaderado · Cítrico</h2><div><i style={{width:"92%"}}/><i style={{width:"76%"}}/><i style={{width:"58%"}}/></div><small>Inspirado en Le Labo Santal 33</small></aside></section>
    <section><div className={styles.sectionTitle}><div><p className="eyebrow">Afinidad superior al 90%</p><h2>Tu selección curada</h2></div><span>{recommendations.length} resultados</span></div><div className={styles.grid}>{recommendations.map(product => <ProductCard key={product.id} product={product} recommendation />)}</div></section>
    <section className={styles.cta}><div><h2>¿Quieres ahorrar en tu próxima fragancia?</h2><p>Comparamos precios en tiempo real entre las tiendas de alta perfumería más importantes del país para que siempre pagues lo justo.</p></div><Link href="/dashboard">Ver comparador de precios <Icon name="arrow"/></Link></section>
  </main><Footer/></>;
}
