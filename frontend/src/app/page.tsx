import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/shared/components/Footer";
import { Header } from "@/shared/components/Header";
import { Icon } from "@/shared/components/Icon";
import { LandingFeatured } from "@/features/catalog/components/LandingFeatured";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "FullFragrance | Comparador local de perfumes",
  description: "Compara perfumes en tiendas verificadas, descubre coincidencias entre comercios y encuentra mejores precios.",
};

const benefits = [
  { icon: "chart" as const, title: "Precios comparados", text: "Ordenamos ofertas por menor precio y agrupamos el mismo perfume cuando aparece en más de una tienda." },
  { icon: "search" as const, title: "Catálogo filtrable", text: "Busca por marca, nombre, concentración, género o familia olfativa sin perder contexto de comparación." },
  { icon: "flower" as const, title: "Compra con criterio", text: "Combina datos de precio con preferencias olfativas para elegir algo que realmente calce contigo." },
];

const categories = ["Mujer", "Hombre", "Unisex", "Eau de Parfum", "Eau de Toilette", "Lujo"];
const steps = ["Extraemos catálogos de fuentes conectadas", "Normalizamos nombres, tamaños y marcas", "Comparamos coincidencias y precios finales"];

export default function HomePage() {
  return <>
    <Header />
    <main>
      <section className={styles.hero}>
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <p className="eyebrow">Perfumería inteligente</p>
            <h1 className="display">Compra perfumes como en una tienda, decide con datos de comparador.</h1>
            <p className={styles.lead}>Explora una vitrina curada de fragancias, revisa precios entre tiendas verificadas y encuentra el mejor lugar para comprar sin perder la experiencia de catálogo.</p>
            <form className={styles.heroSearch} action="/dashboard">
              <Icon name="search" size={18}/>
              <input name="q" placeholder="Busca Chanel, Versace, vainilla, hombre..." />
              <button>Buscar</button>
            </form>
            <div className={styles.actions}>
              <Link className={styles.primaryAction} href="/dashboard">Ver catálogo <Icon name="arrow" size={18}/></Link>
              <Link className={styles.secondaryAction} href="/test">Hacer test olfativo</Link>
            </div>
            <div className={styles.heroStats}><span><strong>Catálogo vivo</strong> fuentes actualizables</span><span><strong>Venta directa</strong> datos más limpios</span><span><strong>Perfil olfativo</strong> recomendaciones personales</span></div>
          </div>
          <div className={styles.preview} aria-label="Vista previa de tienda de perfumes">
            <div className={styles.previewSearch}><Icon name="search" size={18}/><span>Vitrina destacada</span></div>
            <article className={styles.previewCard}>
              <div className={styles.bottleScene}><i/><i/><i/></div>
              <div><span className={styles.previewBadge}>Oferta destacada</span><h2>Fragancia floral amaderada</h2><p>100 ml · Eau de Parfum</p></div>
              <div className={styles.previewPrices}><span><small>Tienda verificada</small><strong>$61.990</strong></span><span><small>Otra fuente</small><strong>$68.990</strong></span></div>
            </article>
            <div className={styles.previewFoot}><span>Catálogo + comparación</span><strong>Ver precios y tiendas</strong></div>
          </div>
        </div>
      </section>

      <section className={`container ${styles.shopNav}`} aria-label="Comprar por categoría">
        <div><p className="eyebrow">Comprar por categoría</p><h2>Explora la vitrina por intención.</h2></div>
        <div>{categories.map(category => <Link key={category} href={`/dashboard?q=${encodeURIComponent(category.toLowerCase())}`}>{category}</Link>)}</div>
      </section>

      <section className={`container ${styles.featured}`} aria-label="Fragancias destacadas">
        <div className={styles.sectionTitle}><div><p className="eyebrow">Vitrina conectada</p><h2>Perfumes disponibles ahora.</h2></div><Link href="/dashboard">Ver todo el catálogo</Link></div>
        <LandingFeatured />
      </section>

      <section className={`container ${styles.benefits}`} aria-label="Beneficios">
        {benefits.map(benefit => <article key={benefit.title}><span><Icon name={benefit.icon}/></span><h2>{benefit.title}</h2><p>{benefit.text}</p></article>)}
      </section>

      <section className={styles.process}><div className={`container ${styles.processInner}`}>
        <div><p className="eyebrow">Cómo funciona</p><h2>Una base preparada para crecer con nuevas tiendas.</h2><p>Hoy la plataforma puede partir con fuentes específicas, pero la experiencia está pensada para sumar más comercios sin cambiar la forma en que comparas.</p></div>
        <ol>{steps.map((step, index) => <li key={step}><span>{index + 1}</span>{step}</li>)}</ol>
      </div></section>

      <section className={`container ${styles.cta}`}>
        <div><p className="eyebrow">Listo para comparar</p><h2>Entra al catálogo y revisa precios disponibles.</h2></div>
        <Link href="/dashboard">Abrir comparador</Link>
      </section>
    </main>
    <Footer />
  </>;
}
