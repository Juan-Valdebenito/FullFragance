"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "../domain/product";
import { BrandIcon } from "@/shared/components/BrandIcon";
import { Icon } from "@/shared/components/Icon";
import { useImageFallback } from "@/shared/hooks/useImageFallback";
import { FavoriteButton } from "./FavoriteButton";
import styles from "./catalog.module.css";

interface ProductCardProps {
  product: Product;
  recommendation?: boolean;
  /** URL del detalle. Si no se pasa, usa /perfumes/[id] sin parámetros de vuelta. */
  href?: string;
}

export function ProductCard({ product, recommendation = false, href }: ProductCardProps) {
  const detailHref = href ?? `/perfumes/${product.id}`;
  const imageCandidates = useMemo(
    () => [...new Set(product.imageCandidates?.filter(Boolean) || (product.image ? [product.image] : []))],
    [product.image, product.imageCandidates]
  );
  const { image, markFailed } = useImageFallback(imageCandidates);

  return (
    <article className={`${styles.card} ${recommendation ? styles.recommendation : ""}`}>
      <div className={styles.imageWrap}>
        <Link href={detailHref} aria-label={`Ver ${product.name}`}>
          {image ? (
            <Image
              src={image}
              unoptimized
              alt={`Perfume ${product.name} de ${product.brand}`}
              fill
              sizes="(max-width: 700px) 100vw, 400px"
              onError={() => markFailed(image)}
            />
          ) : (
            <span className={styles.imagePlaceholder}><BrandIcon size={56} /></span>
          )}
        </Link>
        {product.badge && (
          <span className={`${styles.badge} ${product.badgeTone === "single" ? styles.badgeSingle : ""}`}>{product.badge}</span>
        )}
        <FavoriteButton productId={product.id} aliases={product.aliases} />
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <small className={styles.cardBrand}>{product.brand}</small>
          <h3><Link href={detailHref}>{product.name}</Link></h3>
          {[product.size, ...product.notes].filter(Boolean).length > 0 && (
            <p className={styles.notes}>{[product.size, ...product.notes].filter(Boolean).join(" · ")}</p>
          )}
        </div>
        <div className={styles.prices}>
          {product.prices.length ? (
            <>
              {product.prices.map((price, index) => (
                <div
                  className={`${styles.priceRow} ${index === 0 ? styles.bestPriceRow : ""}`}
                  key={price.id ?? `${price.store}-${price.price}-${index}`}
                >
                  <span className={styles.storeName} title={index === 0 ? `Más barato en ${price.store}` : undefined}>
                    {price.store}
                  </span>
                  <strong>{price.price}</strong>
                </div>
              ))}
              {product.extraStoreCount ? (
                <p className={styles.moreStores}>y {product.extraStoreCount} {product.extraStoreCount === 1 ? "tienda más" : "tiendas más"}</p>
              ) : null}
            </>
          ) : (
            <div className={styles.priceRow}><span className={styles.storeName}>Tienda</span><strong>Precio pendiente</strong></div>
          )}
        </div>
        <Link className={styles.storeButton} href={detailHref}>
          {recommendation ? (
            <><span>Comparar</span><Icon name="chart" size={16} /></>
          ) : (
            <><span>Ver precios</span><Icon name="arrow" size={16} /></>
          )}
        </Link>
      </div>
    </article>
  );
}
