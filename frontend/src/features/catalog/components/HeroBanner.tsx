"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { productImageCandidates } from "@/shared/api/client";
import type { ApiProduct } from "@/shared/api/types";
import { BrandIcon } from "@/shared/components/BrandIcon";
import { Icon } from "@/shared/components/Icon";
import { loadDeals, loadSegment } from "../domain/homeData";
import styles from "@/app/home.module.css";

const ROTATION_MS = 6500;

type Slide = {
  id: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  /**
   * Banner diseñado (por ejemplo "/banners/cyber.webp"). Si existe, reemplaza
   * la composición automática; el texto queda solo para lectores de pantalla.
   */
  image?: string;
};

const SLIDES: Slide[] = [
  {
    id: "brand",
    title: "Compara perfumes originales en las tiendas de Chile",
    text: "El mismo perfume, ordenado de más barato a más caro.",
    cta: "Abrir comparador",
    href: "/dashboard",
  },
  {
    id: "deals",
    title: "Ofertas de hoy",
    text: "Los perfumes con más diferencia de precio entre tiendas.",
    cta: "Ver ofertas",
    href: "/dashboard?sort=savings",
  },
  {
    id: "arabic",
    title: "Perfumería árabe",
    text: "Lattafa, Armaf, Afnan y más, comparados en todas las tiendas.",
    cta: "Ver perfumes árabes",
    href: "/dashboard?segment=arabic",
  },
  {
    id: "niche",
    title: "Perfumería de nicho",
    text: "Xerjoff, Creed, Parfums de Marly y Mancera al mejor precio.",
    cta: "Ver perfumes de nicho",
    href: "/dashboard?segment=niche",
  },
  {
    id: "cyber-gracias",
    title: "¡Gracias por un Cyber increíble!",
    text: "Más de 4.000 personas visitaron la página este Cyber. De parte del equipo de FullFragance, gracias a todos por su participación y colaboración. Recuerda siempre buscar el mejor precio.",
    cta: "Ver catálogo completo",
    href: "/dashboard",
  },
];

// Hasta tres fotos por slide. El slide de marca no lleva fotos: muestra el
// ícono del logo, igual que cualquier slide si la API no responde.
function useSlidePhotos() {
  const [photos, setPhotos] = useState<Record<string, ApiProduct[]>>({});

  useEffect(() => {
    const withImage = (list: ApiProduct[]) => list.filter(product => productImageCandidates(product).length).slice(0, 3);
    const save = (id: string) => (list: ApiProduct[]) => setPhotos(current => ({ ...current, [id]: withImage(list) }));
    const ignore = () => undefined;

    loadDeals().then(deals => deals.map(deal => deal.deal)).then(save("deals")).catch(ignore);
    loadSegment("arabic").then(save("arabic")).catch(ignore);
    loadSegment("niche").then(save("niche")).catch(ignore);
  }, []);

  return photos;
}

export function HeroBanner() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const photos = useSlidePhotos();
  const total = SLIDES.length;

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (paused || reducedMotion) return;
    const timer = window.setInterval(() => setActive(current => (current + 1) % total), ROTATION_MS);
    return () => window.clearInterval(timer);
  }, [paused, reducedMotion, total]);

  const go = (index: number) => setActive((index + total) % total);

  return (
    <section
      className={styles.banner}
      aria-roledescription="carrusel"
      aria-label="Destacados de FullFragance"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className={styles.bannerTrack}>
        {SLIDES.map((slide, index) => (
          <article
            key={slide.id}
            className={`${styles.slide} ${index === active ? styles.slideActive : ""}`}
            aria-roledescription="diapositiva"
            aria-label={`${index + 1} de ${total}: ${slide.title}`}
            aria-hidden={index !== active}
            inert={index !== active}
          >
            {slide.image ? (
              <Link href={slide.href} className={styles.slideArt}>
                <Image src={slide.image} alt="" fill sizes="(max-width: 1280px) 100vw, 1280px" priority={index === 0} />
                <span className="srOnly">{slide.title}. {slide.text} {slide.cta}</span>
              </Link>
            ) : (
              <>
                <div className={styles.slideCopy}>
                  <span className={styles.slideBar} aria-hidden="true" />
                  {index === 0 ? <h1>{slide.title}</h1> : <h2>{slide.title}</h2>}
                  <p>{slide.text}</p>
                  <Link className={styles.slideCta} href={slide.href}>
                    {slide.cta} <Icon name="arrow" size={18} />
                  </Link>
                </div>
                <SlideVisual products={photos[slide.id] ?? []} eager={index === 0} />
              </>
            )}
          </article>
        ))}
      </div>

      <div className={styles.bannerControls}>
        <button type="button" className={styles.bannerArrow} onClick={() => go(active - 1)} aria-label="Destacado anterior">
          <Icon name="arrow" size={18} />
        </button>
        <div className={styles.bannerDots}>
          {SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={index === active ? styles.dotActive : undefined}
              onClick={() => go(index)}
              aria-label={`Ver destacado ${index + 1}: ${slide.title}`}
              aria-current={index === active ? "true" : undefined}
            />
          ))}
        </div>
        <button type="button" className={styles.bannerArrow} onClick={() => go(active + 1)} aria-label="Destacado siguiente">
          <Icon name="arrow" size={18} />
        </button>
      </div>
    </section>
  );
}

function SlideVisual({ products, eager }: { products: ApiProduct[]; eager: boolean }) {
  if (!products.length) {
    return (
      <div className={styles.slideVisual} aria-hidden="true">
        <span className={styles.slideEmblem}><BrandIcon size={150} /></span>
      </div>
    );
  }

  return (
    <div className={styles.slideVisual} aria-hidden="true">
      {products.map((product, index) => (
        <SlidePhoto key={product.id} product={product} position={index} eager={eager} />
      ))}
    </div>
  );
}

function SlidePhoto({ product, position, eager }: { product: ApiProduct; position: number; eager: boolean }) {
  const [failed, setFailed] = useState<string[]>([]);
  const image = productImageCandidates(product).find(url => !failed.includes(url));
  if (!image) return null;

  return (
    <span className={styles.slidePhoto} data-position={position}>
      <Image
        src={image}
        alt=""
        fill
        sizes="260px"
        unoptimized
        priority={eager && position === 0}
        onError={() => setFailed(current => [...current, image])}
      />
    </span>
  );
}
