import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/shared/components/Footer";
import { Header } from "@/shared/components/Header";
import { HeroActions } from "@/shared/components/HeroActions";
import { Icon } from "@/shared/components/Icon";
import { LandingFeatured } from "@/features/catalog/components/LandingFeatured";
import { DealOfDay } from "@/features/catalog/components/DealOfDay";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "FullFragrance | Comparador Inteligente de Perfumes",
  description: "Compara perfumes en tiendas verificadas, encuentra la mejor opción de precio y descubre fragancias de lujo.",
};

const benefits = [
  { icon: "chart" as const, title: "Precios Comparados al Instante", text: "Agrupamos exactamente el mismo perfume entre tiendas verificadas para que encuentres el precio más bajo sin dar vueltas." },
  { icon: "search" as const, title: "Filtros por Segmento u Olfacción", text: "Busca por diseñador, nicho, perfumería árabe, notas olfativas o concentraciones con filtros de alta precisión." },
  { icon: "flower" as const, title: "Compra con Transparencia", text: "Compara ofertas reales sin intermediarios, con enlaces directos a cada tienda autorizada." },
];

const categories = [
  { label: "Diseñador", href: "/dashboard?segment=designer" },
  { label: "Nicho", href: "/dashboard?segment=niche" },
  { label: "Árabes", href: "/dashboard?segment=arabic" },
  { label: "Mujer", href: "/dashboard?gender=Femenino" },
  { label: "Hombre", href: "/dashboard?gender=Masculino" },
  { label: "Unisex", href: "/dashboard?gender=Unisex" },
];

const olfactoryFamilies = [
  { title: "Perfumería de Nicho", badge: "Exclusivo", desc: "Creed, Parfums de Marly, Tom Ford", href: "/dashboard?segment=niche", icon: "tree" as const },
  { title: "Perfumería Árabe", badge: "Tendencia viral", desc: "Lattafa, Armaf, Afnan, Club de Nuit", href: "/dashboard?segment=arabic", icon: "flower" as const },
  { title: "Diseñador Clásico", badge: "Más buscados", desc: "Chanel, Dior, Versace, Carolina Herrera", href: "/dashboard?segment=designer", icon: "compass" as const },
  { title: "Fragancias de Mujer", badge: "Colección Femenina", desc: "Florales, Dulces y Gourmand", href: "/dashboard?gender=Femenino", icon: "flower" as const },
  { title: "Fragancias de Hombre", badge: "Colección Masculina", desc: "Amaderadas, Cuero y Cítricas", href: "/dashboard?gender=Masculino", icon: "leaf" as const },
  { title: "Fragancias Unisex", badge: "Compartidas", desc: "Aromáticas, Ámbar y Frescas", href: "/dashboard?gender=Unisex", icon: "chart" as const },
];

const steps = [
  "Conectamos los catálogos de perfumerías verificadas en tiempo real.",
  "Normalizamos la marca, versión, concentración y formato exacto.",
  "Comparamos la diferencia de precios y destacamos la mejor opción de compra."
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        {/* Hero Principal */}
        <section className={styles.hero}>
          <div className={`container ${styles.heroInner}`}>
            <div className={styles.heroCopy}>
              <p className="eyebrow">Perfumería Inteligente & Comparador de Precios</p>
              <h1 className="display">Descubre tu próxima fragancia al mejor precio del mercado.</h1>
              <p className={styles.lead}>
                Explora una vitrina curada de perfumes, compara tiendas verificadas en vivo y encuentra dónde comprar exactamente lo que buscas ahorrando dinero.
              </p>

              <form className={styles.heroSearch} action="/dashboard">
                <Icon name="search" size={18} />
                <input name="q" placeholder="Busca Chanel, Armaf, vainilla, perfume hombre..." />
                <button>Buscar en catálogo</button>
              </form>

              <HeroActions />

              <div className={styles.heroStats}>
                <span><strong>Catálogo en vivo</strong> Fuentes verificadas</span>
                <span><strong>Transparencia total</strong> Precios transparentes</span>
                <span><strong>Recomendación olfativa</strong> Perfil personalizado</span>
              </div>
            </div>

            <div className={styles.preview} aria-label="Vista previa de comparador de perfumes">
              <div className={styles.previewSearch}>
                <Icon name="search" size={18} />
                <span>Oferta Destacada del Día</span>
              </div>
              <article className={styles.previewCard}>
                <div className={styles.bottleScene}><i /><i /><i /></div>
                <div className={styles.previewContent}>
                  <span className={styles.previewBadge}>Ahorras hasta un 32%</span>
                  <h2>Club De Nuit Intense Man</h2>
                  <p>105 ml · Eau de Parfum · Armaf</p>
                  <div className={styles.previewPrices}>
                    <span className={styles.previewPriceBest}>
                      <small>Mejor opción verificada</small>
                      <strong>$31.990</strong>
                    </span>
                    <span>
                      <small>Otra tienda nacional</small>
                      <strong className={styles.oldPrice}>$46.990</strong>
                    </span>
                  </div>
                </div>
              </article>
              <div className={styles.previewFoot}>
                <span>Comparación de 5 tiendas en tiempo real</span>
                <Link href="/dashboard?q=Club+de+nuit">Ver oferta →</Link>
              </div>
            </div>
          </div>
        </section>

        {/* Sección "Oferta del Día" Destacada — carga desde el backend */}
        <section className={`container ${styles.dealOfDaySection}`}>
          <DealOfDay />
        </section>

        {/* Accesos rápidos por categoría */}
        <section className={`container ${styles.shopNav}`} aria-label="Comprar por categoría">
          <div>
            <p className="eyebrow">Filtrar por categoría</p>
            <h2>Explora la vitrina por intención de compra.</h2>
          </div>
          <div>
            {categories.map(category => (
              <Link key={category.label} href={category.href}>{category.label}</Link>
            ))}
          </div>
        </section>

        {/* Tarjetas de familias olfativas e intención */}
        <section className={`container ${styles.familiesSection}`}>
          <div className={styles.sectionHeader}>
            <p className="eyebrow">Colecciones Olfativas</p>
            <h2>Encuentra la fragancia perfecta según tu estilo.</h2>
          </div>
          <div className={styles.familiesGrid}>
            {olfactoryFamilies.map(fam => (
              <Link href={fam.href} key={fam.title} className={styles.familyCard}>
                <div className={styles.familyHeader}>
                  <span className={styles.familyIcon}><Icon name={fam.icon} size={22} /></span>
                  <span className={styles.familyBadge}>{fam.badge}</span>
                </div>
                <h3>{fam.title}</h3>
                <p>{fam.desc}</p>
                <div className={styles.familyLink}>
                  <span>Explorar colección</span>
                  <Icon name="arrow" size={16} />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Perfumes Destacados en la Vitrina */}
        <section className={`container ${styles.featured}`} aria-label="Fragancias destacadas">
          <div className={styles.sectionTitle}>
            <div>
              <p className="eyebrow">Vitrina Verificada</p>
              <h2>Perfumes destacados con precios comparados.</h2>
            </div>
            <Link className={styles.viewMoreLink} href="/dashboard">
              <span>Ver todo el catálogo</span>
              <Icon name="arrow" size={16} />
            </Link>
          </div>
          <LandingFeatured />
        </section>

        {/* Beneficios */}
        <section className={`container ${styles.benefits}`} aria-label="Beneficios">
          {benefits.map(benefit => (
            <article key={benefit.title}>
              <span><Icon name={benefit.icon} /></span>
              <h2>{benefit.title}</h2>
              <p>{benefit.text}</p>
            </article>
          ))}
        </section>

        {/* Cómo funciona */}
        <section className={styles.process}>
          <div className={`container ${styles.processInner}`}>
            <div>
              <p className="eyebrow">¿Cómo funciona FullFragrance?</p>
              <h2>Garantizamos que compares exactamente el mismo perfume.</h2>
              <p>
                Analizamos y normalizamos las publicaciones de tiendas verificadas para asegurarte que estás evaluando el mismo tamaño, marca y concentración antes de elegir dónde comprar.
              </p>
            </div>
            <ol>
              {steps.map((step, index) => (
                <li key={step}><span>{index + 1}</span>{step}</li>
              ))}
            </ol>
          </div>
        </section>

        {/* Llamado a la Acción CTA Final */}
        <section className={`container ${styles.ctaSection}`}>
          <div className={styles.ctaBox}>
            <div className={styles.ctaCopy}>
              <p className="eyebrow">Todo el catálogo a tu alcance</p>
              <h2>Explora más de 13.000 fragancias con precios en tiempo real.</h2>
              <p>Filtra por marca, concentración, tipo de perfumería o mejores ofertas.</p>
            </div>
            <Link className={styles.ctaButton} href="/dashboard">
              <span>Abrir comparador de perfumes</span>
              <Icon name="arrow" size={18} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
