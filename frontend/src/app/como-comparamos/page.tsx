import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/shared/components/Footer";
import { Header } from "@/shared/components/Header";
import { api } from "@/shared/api/client";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Cómo comparamos los precios",
  description: "Qué tiendas revisa FullFragance, cada cuánto se actualizan los precios y cómo agrupamos el mismo perfume publicado por distintas tiendas.",
  alternates: { canonical: "/como-comparamos" },
};

const thousands = new Intl.NumberFormat("es-CL");

export default async function MethodologyPage() {
  // Cifras del catálogo vigente; sin backend la página sale igual, sin números.
  const stats = await api.catalogStats().catch(() => null);

  return <>
    <Header />
    <main className={`container ${styles.page}`}>
      <section className={styles.hero}>
        <p className="eyebrow">Metodología</p>
        <h1>Cómo comparamos los precios</h1>
        <p>Esta página explica de dónde salen los precios que ves en FullFragance, cómo decidimos que dos publicaciones son el mismo perfume y qué límites tiene la comparación.</p>
        {stats && (
          <div className={styles.meta}>
            <span>{thousands.format(stats.products)} perfumes</span>
            <span>{thousands.format(stats.comparable)} en 2 o más tiendas</span>
            <span>{stats.stores.length} tiendas</span>
          </div>
        )}
      </section>

      <section className={styles.content}>
        <article className={styles.section}>
          <h2>1. Qué tiendas revisamos</h2>
          {stats?.stores.length ? (
            <>
              <p>Hoy el catálogo reúne precios de estas tiendas chilenas:</p>
              <ul>{stats.stores.map(store => <li key={store}><strong>{store}</strong></li>)}</ul>
            </>
          ) : (
            <p>Revisamos multitiendas y tiendas especializadas en perfumería de Chile.</p>
          )}
          <p>Son tiendas que venden en Chile y publican sus precios en su propio sitio. Si quieres sugerir otra, escríbenos.</p>
        </article>

        <article className={styles.section}>
          <h2>2. Cómo obtenemos los precios</h2>
          <p>Un proceso automático lee varias veces al día las páginas públicas de perfumería de cada tienda: nombre, marca, tamaño, precio, disponibilidad y enlace del producto. No usamos precios inventados ni estimados: si una tienda no publica precio, el producto no aparece con precio.</p>
          <p>Entre una lectura y otra la tienda puede cambiar un precio. Por eso el precio final siempre es el que muestra la tienda al momento de comprar.</p>
        </article>

        <article className={styles.section}>
          <h2>3. Cómo agrupamos el mismo perfume</h2>
          <p>Cada tienda escribe los nombres a su manera (&quot;CH Good Girl EDP 80ml&quot;, &quot;Good Girl Eau de Parfum 80 ML Carolina Herrera&quot;). Para juntarlos normalizamos la marca y el nombre y comparamos:</p>
          <ul>
            <li><strong>Marca:</strong> sin marca reconocible no agrupamos, aunque los nombres se parezcan.</li>
            <li><strong>Volumen:</strong> 50 ml y 100 ml son productos distintos.</li>
            <li><strong>Concentración:</strong> Eau de Toilette, Eau de Parfum, Parfum y colonia no se mezclan cuando la tienda la informa.</li>
            <li><strong>Presentación:</strong> sets, testers, recargas, desodorantes, body mists y versiones como &quot;Intense&quot; o &quot;Absolu&quot; quedan separados del frasco individual.</li>
          </ul>
          <p>Preferimos dejar dos publicaciones separadas antes que juntar perfumes que no son iguales. Si ves un error en una agrupación, avísanos.</p>
        </article>

        <article className={styles.section}>
          <h2>4. Cómo ordenamos las tiendas</h2>
          <p>En cada perfume las tiendas con stock aparecen primero, de la más barata a la más cara; las que están agotadas quedan al final. El orden depende sólo del precio y la disponibilidad publicados: ninguna tienda paga por aparecer más arriba.</p>
          <p>Los perfumes que hoy están en una sola tienda también aparecen en el catálogo, pero marcados como tales; cuando existe, te sugerimos otra versión de la misma fragancia que sí se puede comparar.</p>
        </article>

        <article className={styles.section}>
          <h2>5. Qué no incluye la comparación</h2>
          <ul>
            <li>Costos de despacho, cupones personales o descuentos con tarjetas específicas, porque dependen de cada comprador.</li>
            <li>Ventas de particulares o marketplaces sin tienda identificable.</li>
            <li>Historial de precios: por ahora mostramos sólo el precio vigente.</li>
          </ul>
        </article>

        <article className={`${styles.section} ${styles.callout}`}>
          <h2>¿Viste un precio incorrecto?</h2>
          <div className={styles.contact}>
            <p>Escríbenos con el nombre del perfume y la tienda, y lo revisamos. Más sobre el proyecto en <Link href="/sobre-nosotros">Sobre nosotros</Link>.</p>
            <a href="mailto:fullfragance67@gmail.com?subject=Corrección de datos">fullfragance67@gmail.com</a>
          </div>
        </article>
      </section>
    </main>
    <Footer compact />
  </>;
}
