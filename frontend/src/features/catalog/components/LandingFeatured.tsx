"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api, productImageUrl } from "@/shared/api/client";
import type { ApiProduct } from "@/shared/api/types";
import { Icon } from "@/shared/components/Icon";
import styles from "@/app/home.module.css";

const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export function LandingFeatured() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    api.featuredProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const total = products.length;

  // Auto-advance carousel every 3.5 seconds (pause on hover)
  useEffect(() => {
    if (total <= 1 || isHovered) return;
    autoRef.current = setInterval(() => {
      setCurrent(prev => (prev + 1) % total);
    }, 3500);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [total, isHovered]);

  function goTo(index: number) {
    setCurrent((index + total) % total);
  }

  if (loading) {
    return (
      <div className={styles.carouselContainer}>
        <div className={styles.carouselSkeletonTrack}>
          {[0, 1, 2].map(i => (
            <div key={i} className={styles.carouselSkeletonCard}>
              <div className={styles.skeletonImg} />
              <div className={styles.skeletonBody}>
                <div className={styles.skeletonLine} style={{ width: "40%" }} />
                <div className={styles.skeletonLine} style={{ width: "75%", height: "20px" }} />
                <div className={styles.skeletonLine} style={{ width: "55%" }} />
                <div className={styles.skeletonBtn} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products.length) {
    return (
      <div className={styles.featuredEmpty}>
        <p>La vitrina se actualizará apenas el catálogo esté disponible.</p>
        <Link href="/dashboard">Ir al comparador</Link>
      </div>
    );
  }

  // Compute visible cards: show current + 2 more (wrapped)
  const visibleCount = Math.min(3, total);
  const visibleIndices = Array.from({ length: visibleCount }, (_, i) => (current + i) % total);

  return (
    <div
      className={styles.carouselSection}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Arrow buttons */}
      <button
        className={`${styles.carouselArrow} ${styles.carouselArrowLeft}`}
        onClick={() => goTo(current - 1)}
        aria-label="Fragancia anterior"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m15 18-6-6 6-6"/>
        </svg>
      </button>

      {/* Cards track */}
      <div className={styles.carouselTrack} ref={trackRef}>
        {visibleIndices.map((productIndex, slot) => {
          const product = products[productIndex];
          const image = productImageUrl(product.imageUrl);
          const storesCount = product.matchedStores ?? product.offers?.length ?? 1;
          const compared = storesCount > 1;
          const isFeatured = slot === 0;

          return (
            <article
              key={`${productIndex}-${slot}`}
              className={`${styles.carouselCard} ${isFeatured ? styles.carouselCardFeatured : ""}`}
              style={{ "--slot": slot } as React.CSSProperties}
            >
              <div className={styles.carouselImageWrap}>
                <Link href={`/perfumes/${product.id}`} aria-label={`Ver ${product.name}`}>
                  {image ? (
                    <Image
                      src={image}
                      alt={`Perfume ${product.name} de ${product.brand}`}
                      fill
                      sizes="(max-width: 920px) 90vw, 420px"
                      unoptimized
                    />
                  ) : (
                    <span className={styles.carouselPlaceholder}>FF</span>
                  )}
                </Link>
                <span className={styles.carouselBadge}>
                  {compared ? `Comparado en ${storesCount} tiendas` : "Verificado"}
                </span>
              </div>
              <div className={styles.carouselBody}>
                <span className={styles.carouselBrand}>{product.brand}</span>
                <h3 className={styles.carouselTitle}>{product.name}</h3>
                <p className={styles.carouselSub}>{product.unit} · {product.category}</p>
                <div className={styles.carouselPriceRow}>
                  <div>
                    <small>Mejor precio desde</small>
                    <strong>{money.format(product.basePrice)}</strong>
                  </div>
                </div>
                <Link className={styles.carouselCta} href={`/perfumes/${product.id}`}>
                  <span>Ver precios y tiendas</span>
                  <Icon name="arrow" size={16} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      {/* Arrow right */}
      <button
        className={`${styles.carouselArrow} ${styles.carouselArrowRight}`}
        onClick={() => goTo(current + 1)}
        aria-label="Siguiente fragancia"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      </button>

      {/* Dots indicator */}
      <div className={styles.carouselDots} aria-label="Navegación de diapositivas">
        {products.map((_, i) => (
          <button
            key={i}
            className={`${styles.carouselDot} ${i === current ? styles.carouselDotActive : ""}`}
            onClick={() => goTo(i)}
            aria-label={`Ir a la fragancia ${i + 1}`}
            aria-current={i === current ? "true" : undefined}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className={styles.carouselProgress}>
        <div
          className={styles.carouselProgressBar}
          style={{ width: `${((current + 1) / total) * 100}%` }}
        />
      </div>
    </div>
  );
}
