import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/shared/components/Footer";
import { Header } from "@/shared/components/Header";
import { api } from "@/shared/api/client";
import { ProductRail, type RailItem } from "@/features/catalog/components/ProductRail";
import { GUIDES, guideBySlug, type Guide, type GuideRail } from "@/features/guides/guides";
import styles from "../guides.module.css";

const SITE_URL = "https://fullfragance.cl";
const RAIL_SIZE = 8;
const longDate = new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

// Sólo existen las guías declaradas en GUIDES; cualquier otro slug es 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDES.map(guide => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const guide = guideBySlug((await params).slug);
  if (!guide) return {};
  const url = `/guias/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: url },
    authors: guide.authors.map(name => ({ name })),
    openGraph: {
      type: "article",
      locale: "es_CL",
      siteName: "FullFragance",
      url,
      title: guide.title,
      description: guide.description,
      publishedTime: guide.published,
      modifiedTime: guide.updated ?? guide.published,
      authors: guide.authors,
    },
  };
}

// Los perfumes de cada fila se piden en el servidor para que lleguen en el
// HTML; se regeneran cada hora como el resto de las páginas con catálogo.
async function railItems(rail: GuideRail): Promise<RailItem[]> {
  try {
    const params = new URLSearchParams({ ...rail.params, pageSize: String(RAIL_SIZE) });
    const result = await api.searchCatalog(params, { authenticated: false, next: { revalidate: 3600 } });
    return result.items.map(item => ({
      product: item.product,
      price: item.minPrice ?? item.product.basePrice,
      oldPrice: item.maxPrice ?? undefined,
      stores: item.product.matchedStores ?? item.prices.length,
    }));
  } catch {
    return [];
  }
}

function structuredData(guide: Guide) {
  const url = `${SITE_URL}/guias/${guide.slug}`;
  return JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      datePublished: guide.published,
      dateModified: guide.updated ?? guide.published,
      inLanguage: "es-CL",
      mainEntityOfPage: url,
      author: guide.authors.map(name => ({ "@type": "Person", name, url: `${SITE_URL}/sobre-nosotros` })),
      publisher: { "@type": "Organization", name: "FullFragance", url: SITE_URL, logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.jpeg` } },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Guías", item: `${SITE_URL}/guias` },
        { "@type": "ListItem", position: 2, name: guide.title, item: url },
      ],
    },
  ]).replace(/</g, "\\u003c");
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const guide = guideBySlug((await params).slug);
  if (!guide) notFound();

  const rails = await Promise.all(guide.sections.map(section => section.rail ? railItems(section.rail) : null));
  const others = GUIDES.filter(other => other.slug !== guide.slug);

  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredData(guide) }} />
    <Header />
    <main className={styles.page}>
      <header className={`container ${styles.hero}`}>
        <p className="eyebrow"><Link href="/guias">Guías</Link></p>
        <h1>{guide.title}</h1>
        <p className={styles.byline}>
          <span>Por <strong>{guide.authors.join(" y ")}</strong></span>
          <span>Publicado el {longDate.format(new Date(guide.published))}</span>
          {guide.updated && <span>Actualizado el {longDate.format(new Date(guide.updated))}</span>}
        </p>
      </header>

      <article>
        <div className={`container ${styles.article}`}>
          <p className={styles.lead}>{guide.intro}</p>
        </div>

        {guide.sections.map((section, index) => (
          <section key={section.heading}>
            <div className={`container ${styles.article}`}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              {section.list && <ul>{section.list.map(item => <li key={item}>{item}</li>)}</ul>}
            </div>
            {section.rail && (
              <ProductRail
                id={`rail-${index}`}
                title={section.rail.title}
                href={section.rail.href}
                linkLabel="Ver en el comparador"
                items={rails[index]}
                emptyText="Los precios aparecen apenas el catálogo responda."
              />
            )}
          </section>
        ))}
      </article>

      <aside className={`container ${styles.more}`}>
        <h2>Sigue leyendo</h2>
        <ul>
          {others.map(other => <li key={other.slug}><Link href={`/guias/${other.slug}`}>{other.title}</Link></li>)}
          <li><Link href="/como-comparamos">Cómo comparamos los precios</Link></li>
        </ul>
      </aside>
    </main>
    <Footer />
  </>;
}
