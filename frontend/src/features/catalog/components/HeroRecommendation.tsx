"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api, productImageCandidates } from "@/shared/api/client";
import type { ApiProduct } from "@/shared/api/types";
import { Icon } from "@/shared/components/Icon";
import { useImageFallback } from "@/shared/hooks/useImageFallback";
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

// Tarjeta neutra mientras carga el catálogo o si la API falla. No muestra
// precios para no exhibir cifras que no vienen de las tiendas.
function FallbackCard() {
  return (
    <>
      <article className={styles.previewCard}>
        <div className={styles.bottleScene}><i /><i /><i /></div>
        <div className={styles.previewContent}>
          <span className={styles.previewBadge}>Precios en vivo</span>
          <h2>Compara antes de comprar</h2>
          <p>Diseñador · Nicho · Árabes</p>
        </div>
      </article>
      <div className={styles.previewFoot}>
        <span>Tiendas verificadas de Chile</span>
        <Link href="/dashboard">Ver catálogo →</Link>
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
  const imageCandidates = useMemo(() => productImageCandidates(product), [product]);
  const { image, markFailed } = useImageFallback(imageCandidates);

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
              onError={() => markFailed(image)}
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
