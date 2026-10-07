import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/shared/components/Footer";
import { Header } from "@/shared/components/Header";
import { GUIDES } from "@/features/guides/guides";
import styles from "./guides.module.css";

export const metadata: Metadata = {
  title: "Guías para comprar perfumes",
  description: "Guías de FullFragance para comprar perfumes en Chile: concentraciones, marcas, qué revisar antes de comprar y cómo comparar precios entre tiendas.",
  alternates: { canonical: "/guias" },
};

const longDate = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default function GuidesPage() {
  const guides = [...GUIDES].sort((a, b) => (b.updated ?? b.published).localeCompare(a.updated ?? a.published));

  return <>
    <Header />
    <main className={`container ${styles.page}`}>
      <section className={styles.hero}>
        <p className="eyebrow">Guías</p>
        <h1>Guías para comprar perfumes en Chile</h1>
        <p>Lo que aprendemos comparando precios todos los días: cómo leer una etiqueta, qué diferencia hay entre versiones y qué revisar antes de elegir una tienda. Cada guía muestra precios actualizados del comparador.</p>
      </section>

      <ul className={styles.list}>
        {guides.map(guide => (
          <li key={guide.slug}>
            <Link href={`/guias/${guide.slug}`} className={styles.card}>
              <small>{longDate.format(new Date(guide.updated ?? guide.published))}</small>
              <h2>{guide.title}</h2>
              <p>{guide.description}</p>
              <span className={styles.cardLink}>Leer guía →</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
    <Footer />
  </>;
}
