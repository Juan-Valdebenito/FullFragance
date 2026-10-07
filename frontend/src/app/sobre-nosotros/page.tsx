import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/shared/components/Footer";
import { Header } from "@/shared/components/Header";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "Sobre nosotros",
  description: "Quiénes están detrás de FullFragance, por qué creamos un comparador de precios de perfumes en Chile y cómo se financia.",
  alternates: { canonical: "/sobre-nosotros" },
};

const organizationLd = JSON.stringify({
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "FullFragance",
  url: "https://fullfragance.cl",
  logo: "https://fullfragance.cl/logo.jpeg",
  email: "fullfragance67@gmail.com",
  foundingDate: "2026-07-16",
  founders: [
    { "@type": "Person", name: "Benjamín Cantero" },
    { "@type": "Person", name: "Juan Pablo Valdebenito" },
  ],
  address: { "@type": "PostalAddress", addressLocality: "Temuco", addressCountry: "CL" },
});

export default function AboutPage() {
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: organizationLd }} />
    <Header />
    <main className={`container ${styles.page}`}>
      <section className={styles.hero}>
        <p className="eyebrow">Nosotros</p>
        <h1>Sobre FullFragance</h1>
        <p>FullFragance es un comparador de precios de perfumes originales en Chile. Lo creamos para que encontrar dónde comprar un perfume no signifique abrir diez pestañas y revisar tienda por tienda.</p>
        <div className={styles.meta}><span>Temuco, Chile</span><span>Desde julio de 2026</span></div>
      </section>

      <section className={styles.content}>
        <article className={styles.section}>
          <h2>Por qué existe</h2>
          <p>Comprar un perfume en Chile suele empezar igual: buscas el nombre, aparece en varias tiendas y cada una lo publica con un precio, un tamaño y una descripción distintos. Comparar a mano toma tiempo y es fácil confundir un Eau de Toilette con un Eau de Parfum, o un frasco de 100 ml con uno de 50 ml.</p>
          <p>Quisimos alivianar esa búsqueda: juntar en un solo lugar el mismo perfume publicado por distintas tiendas, ordenarlo de más barato a más caro y dejar que cada persona decida dónde comprar.</p>
        </article>

        <article className={styles.section}>
          <h2>Quiénes somos</h2>
          <p>FullFragance es un proyecto independiente creado y desarrollado por dos personas en Temuco:</p>
          <ul>
            <li><strong>Benjamín Cantero</strong>, cofundador y desarrollador.</li>
            <li><strong>Juan Pablo Valdebenito</strong>, cofundador y desarrollador.</li>
          </ul>
          <p>Empezamos el 16 de julio de 2026. Entre julio y agosto construimos el sitio, el servidor y el sistema que lee los precios publicados por las tiendas; en septiembre lo pusimos en línea en fullfragance.cl. Todo el diseño, el código y el catálogo los hacemos nosotros dos.</p>
        </article>

        <article className={styles.section}>
          <h2>Cómo funciona</h2>
          <p>Una vez al día revisamos los perfumes publicados por tiendas chilenas, agrupamos las publicaciones que corresponden al mismo producto y mostramos sus precios lado a lado. El detalle de qué tiendas revisamos y cómo decidimos que dos publicaciones son el mismo perfume está en <Link href="/como-comparamos">Cómo comparamos los precios</Link>.</p>
          <p>También escribimos <Link href="/guias">guías</Link> con lo que aprendemos al comparar: diferencias entre concentraciones, marcas que se repiten en las tiendas y qué revisar antes de comprar.</p>
        </article>

        <article className={styles.section}>
          <h2>Cómo se financia</h2>
          <p>FullFragance es gratuito y se financia con publicidad de Google AdSense, que aparece identificada como &quot;Publicidad&quot;. No vendemos perfumes ni procesamos pagos: cuando eliges una tienda, la compra se hace directamente en su sitio.</p>
          <p>El orden de las tiendas en cada perfume depende sólo del precio y del stock publicados. Ninguna tienda paga por aparecer ni por quedar más arriba.</p>
        </article>

        <article className={`${styles.section} ${styles.callout}`}>
          <h2>Contacto</h2>
          <div className={styles.contact}>
            <p>¿Encontraste un precio que no coincide, quieres sugerir una tienda o tienes una consulta? Escríbenos y te respondemos.</p>
            <a href="mailto:fullfragance67@gmail.com">fullfragance67@gmail.com</a>
          </div>
        </article>
      </section>
    </main>
    <Footer compact />
  </>;
}
