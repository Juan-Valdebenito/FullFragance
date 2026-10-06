"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { productImageCandidates } from "@/shared/api/client";
import type { ApiProduct } from "@/shared/api/types";
import { Icon } from "@/shared/components/Icon";
import { useImageFallback } from "@/shared/hooks/useImageFallback";
import styles from "@/app/home.module.css";

const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export type RailItem = {
  product: ApiProduct;
  price: number;
  oldPrice?: number;
  savingsPct?: number;
  stores?: number;
};

/**
 * Fila horizontal de perfumes con flechas. El desplazamiento es nativo
 * (scroll-snap), así funciona igual con dedo, rueda o teclado.
 */
export function ProductRail({
  id,
  title,
  href,
  linkLabel,
  items,
  emptyText,
}: {
  id: string;
  title: string;
  href: string;
  linkLabel: string;
  /** null mientras carga */
  items: RailItem[] | null;
  emptyText: string;
}) {
  const trackRef = useRef<HTMLUListElement>(null);

  const scroll = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className={`container ${styles.section}`} aria-labelledby={id}>
      <div className={styles.sectionHead}>
        <h2 id={id}>{title}</h2>
        <div className={styles.sectionTools}>
          <Link className={styles.sectionLink} href={href}>{linkLabel}</Link>
          {items && items.length > 0 && (
            <>
              <button type="button" className={styles.railArrow} onClick={() => scroll(-1)} aria-label={`Desplazar ${title} hacia atrás`}>
                <Icon name="arrow" size={18} />
              </button>
              <button type="button" className={styles.railArrow} onClick={() => scroll(1)} aria-label={`Desplazar ${title} hacia adelante`}>
                <Icon name="arrow" size={18} />
              </button>
            </>
          )}
        </div>
      </div>

      {items && !items.length ? (
        <p className={styles.railEmpty}>
          {emptyText} <Link href={href}>{linkLabel}</Link>
        </p>
      ) : (
        <ul className={styles.rail} ref={trackRef} aria-busy={!items}>
          {items
            ? items.map(item => <RailCard key={item.product.id} item={item} />)
            : Array.from({ length: 5 }, (_, index) => (
                <li key={index} className={styles.railCard}>
                  <span className={`${styles.cardImage} ${styles.skeleton}`} />
                  <span className={styles.cardBody}>
                    <span className={`${styles.skeletonLine} ${styles.skeleton}`} style={{ width: "40%" }} />
                    <span className={`${styles.skeletonLine} ${styles.skeleton}`} style={{ width: "85%" }} />
                    <span className={`${styles.skeletonLine} ${styles.skeleton}`} style={{ width: "55%", height: 20 }} />
                  </span>
                </li>
              ))}
        </ul>
      )}
    </section>
  );
}

function RailCard({ item }: { item: RailItem }) {
  const { product, price, oldPrice, savingsPct, stores } = item;
  const candidates = useMemo(() => productImageCandidates(product), [product]);
  const { image, markFailed } = useImageFallback(candidates);

  return (
    <li className={styles.railCard}>
      <Link href={`/perfumes/${product.id}`} className={styles.cardLink}>
        <span className={styles.cardImage}>
          {image && (
            <Image
              src={image}
              alt={`Perfume ${product.name} de ${product.brand}`}
              fill
              sizes="240px"
              unoptimized
              onError={() => markFailed(image)}
            />
          )}
          {savingsPct ? <span className={styles.cardBadge}>−{savingsPct}%</span> : null}
        </span>
        <span className={styles.cardBody}>
          <small className={styles.cardBrand}>{product.brand}</small>
          <span className={styles.cardName}>{product.name}</span>
          <span className={styles.cardPrice}>
            <strong>{money.format(price)}</strong>
            {oldPrice && oldPrice > price ? <s>{money.format(oldPrice)}</s> : null}
          </span>
          {stores && stores > 1 ? <small className={styles.cardStores}>Comparado en {stores} tiendas</small> : null}
        </span>
      </Link>
    </li>
  );
}
