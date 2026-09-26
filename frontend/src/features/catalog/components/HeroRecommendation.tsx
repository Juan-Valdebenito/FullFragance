"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api, productImageUrl } from "@/shared/api/client";
import type { ApiProduct } from "@/shared/api/types";
import { Icon } from "@/shared/components/Icon";
import styles from "@/app/home.module.css";

const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });
const ROTATION_MS = 5000;

function priceRange(product: ApiProduct) {
  const prices = (product.offers ?? []).map(offer => offer.price).filter(price => price > 0);
  if (!prices.length) return { min: product.basePrice, max: product.basePrice, stores: 1 };
  return { min: Math.min(...prices), max: Math.max(...prices), stores: prices.length };
}

function randomIndex(total: number, exclude: number) {
  if (total < 2) return 0;
  const next = Math.floor(Math.random() * (total - 1));
  return next >= exclude ? next + 1 : next;
}

// Tarjeta estática usada mientras carga el catálogo o si la API falla.
function FallbackCard() {
  return (
    <>
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
    </>
  );
}

export function HeroRecommendation() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    api.featuredProducts()
      .then(list => {
        setProducts(list);
        setActiveIndex(randomIndex(list.length, -1));
      })
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    if (products.length < 2 || isPaused) return;

    const timer = window.setInterval(() => {
      setActiveIndex(current => randomIndex(products.length, current));
    }, ROTATION_MS);

    return () => window.clearInterval(timer);
  }, [products.length, isPaused]);

  const product = products[activeIndex];

  return (
    <div
      className={styles.preview}
      aria-label="Perfume recomendado"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className={styles.previewSearch}>
        <Icon name="search" size={18} />
        <span>Recomendación destacada</span>
      </div>
      {product ? <RecommendedCard product={product} /> : <FallbackCard />}
    </div>
  );
}

function RecommendedCard({ product }: { product: ApiProduct }) {
  const { min, max, stores } = priceRange(product);
  const savingsPct = max > 0 ? Math.round(((max - min) / max) * 100) : 0;
  const image = productImageUrl(product.imageUrl);

  return (
    <>
      <article className={`${styles.previewCard} ${styles.previewCardEnter}`} key={product.id} aria-live="polite">
        <div className={styles.bottleScene}>
          {image ? (
            <Image
              src={image}
              alt={`Perfume ${product.name} de ${product.brand}`}
              fill
              sizes="(max-width: 900px) 90vw, 420px"
              unoptimized
              style={{ objectFit: "contain", padding: "20px" }}
            />
          ) : (
            <><i /><i /><i /></>
          )}
        </div>
        <div className={styles.previewContent}>
          <span className={styles.previewBadge}>
            {savingsPct > 0 ? `Ahorras hasta un ${savingsPct}%` : "Precio verificado"}
          </span>
          <h2>{product.name}</h2>
          <p>{[product.unit, product.category, product.brand].filter(Boolean).join(" · ")}</p>
          <div className={styles.previewPrices}>
            <span className={styles.previewPriceBest}>
              <small>Mejor opción verificada</small>
              <strong>{money.format(min)}</strong>
            </span>
            {max > min && (
              <span>
                <small>Otra tienda nacional</small>
                <strong className={styles.oldPrice}>{money.format(max)}</strong>
              </span>
            )}
          </div>
        </div>
      </article>
      <div className={styles.previewFoot}>
        <span>{stores > 1 ? `Comparación de ${stores} tiendas en tiempo real` : "Precio verificado en tienda"}</span>
        <Link href={`/perfumes/${product.id}`}>Ver oferta →</Link>
      </div>
    </>
  );
}
