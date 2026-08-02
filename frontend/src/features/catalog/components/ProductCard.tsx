"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "../domain/product";
import { Icon } from "@/shared/components/Icon";
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
  const [failedImages, setFailedImages] = useState<string[]>([]);
  const image = imageCandidates.find((candidate) => !failedImages.includes(candidate));

  // Al recibir nuevos datos para el mismo producto, vuelve a intentar las URLs.
  useEffect(() => setFailedImages([]), [product.id, imageCandidates]);

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
              onError={() => setFailedImages((failed) => failed.includes(image) ? failed : [...failed, image])}
            />
          ) : (
            <span className={styles.imagePlaceholder}>FF</span>
          )}
        </Link>
        {product.badge && <span className={styles.badge}>{product.badge}</span>}
        <FavoriteButton productId={product.id} aliases={product.aliases} />
      </div>
      <div className={styles.cardBody}>
        <div className={styles.cardHeader}>
          <p className="eyebrow">{product.brand}</p>
          <h3>{product.name}</h3>
          <p className={styles.notes}>{product.size ? `${product.size} · ` : ""}{product.notes.join(", ")}</p>
        </div>
        <div className={styles.prices}>
          {product.prices.length ? (
            <>
              {product.prices.map((price, index) => (
                <div
                  className={`${styles.priceRow} ${index === 0 ? styles.bestPriceRow : ""}`}
                  key={price.id ?? `${price.store}-${price.price}-${index}`}
                >
                  <span className={styles.storeName}>
                    {price.store}
                    {index === 0 ? <em className={styles.bestBadge}>Mejor precio</em> : price.offer && <em>Oferta</em>}
                  </span>
                  <strong>{price.price}</strong>
                </div>
              ))}
              {product.extraStoreCount ? (
                <p className={styles.moreStores}>+{product.extraStoreCount} {product.extraStoreCount === 1 ? "tienda más" : "tiendas más"} en el detalle</p>
              ) : null}
            </>
          ) : (
            <div className={styles.priceRow}><span>Tienda</span><strong>Precio pendiente</strong></div>
          )}
        </div>
        <Link className={styles.storeButton} href={detailHref}>
          {recommendation ? (
            <><span>Comparar</span><Icon name="chart" size={16} /></>
          ) : (
            <><span>Ver precios y tiendas</span><Icon name="arrow" size={16} /></>
          )}
        </Link>
      </div>
    </article>
  );
}
