"use client";

import { useState } from "react";
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
  const [imgError, setImgError] = useState(false);

  return (
    <article className={`${styles.card} ${recommendation ? styles.recommendation : ""}`}>
      <div className={styles.imageWrap}>
        <Link href={detailHref} aria-label={`Ver ${product.name}`}>
          {product.image && !imgError ? (
            <Image
              src={product.image}
              unoptimized
              alt={`Perfume ${product.name} de ${product.brand}`}
              fill
              sizes="(max-width: 700px) 100vw, 400px"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className={styles.imagePlaceholder}>FF</span>
          )}
        </Link>
        {product.badge && <span className={styles.badge}>{product.badge}</span>}
        <FavoriteButton productId={product.id} aliases={product.aliases} />
      </div>
      <div className={styles.cardBody}>
        <p className="eyebrow">{product.brand}</p>
        <h3>{product.name}</h3>
        <p className={styles.notes}>{product.size} · {product.notes.join(", ")}</p>
        <div className={styles.prices}>
          {product.prices.length ? (
            product.prices.map((price, index) => (
              <div className={styles.priceRow} key={price.id ?? `${price.store}-${price.price}-${index}`}>
                <span>{price.store}{price.offer && <em>Oferta</em>}</span>
                <strong>{price.price}</strong>
              </div>
            ))
          ) : (
            <div className={styles.priceRow}><span>Tienda</span><strong>Precio pendiente</strong></div>
          )}
        </div>
        <Link className={styles.storeButton} href={detailHref}>
          {recommendation ? <><span>Comparar</span><Icon name="chart" /></> : "Ver precios y tiendas"}
        </Link>
      </div>
    </article>
  );
}
