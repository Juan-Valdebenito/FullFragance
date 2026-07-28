"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api, productImageUrl } from "@/shared/api/client";
import type { ApiProduct } from "@/shared/api/types";
import { Icon } from "@/shared/components/Icon";
import styles from "@/app/home.module.css";

const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

interface DealData {
  deal: ApiProduct;
  minPrice: number;
  maxPrice: number;
  savings: number;
  savingsPct: number;
}

function DealSkeleton() {
  return (
    <div className={styles.dealCard} aria-busy="true">
      <div className={styles.dealBadgeContainer}>
        <span className={styles.dealPill}>🔥 Oferta destacada del día</span>
        <span className={`${styles.dealSavingsTag} ${styles.dealSavingsSkeleton}`}>&nbsp;</span>
      </div>
      <div className={styles.dealContent}>
        <div className={styles.dealInfo}>
          <div className={styles.dealSkelLine} style={{ width: "38%", height: "12px" }} />
          <div className={styles.dealSkelLine} style={{ width: "72%", height: "26px", marginTop: "8px" }} />
          <div className={styles.dealSkelLine} style={{ width: "90%", height: "14px", marginTop: "8px" }} />
          <div className={styles.dealSkelLine} style={{ width: "55%", height: "14px", marginTop: "6px" }} />
          <div className={styles.dealPrices} style={{ marginTop: "20px" }}>
            <div className={styles.dealSkelLine} style={{ width: "120px", height: "52px", borderRadius: "12px" }} />
            <div className={styles.dealSkelLine} style={{ width: "100px", height: "52px", borderRadius: "12px" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function DealOfDay() {
  const [data, setData] = useState<DealData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    api.dealOfDay()
      .then(res => setData(res))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <DealSkeleton />;

  if (error || !data?.deal) {
    return (
      <div className={styles.dealCard}>
        <div className={styles.dealBadgeContainer}>
          <span className={styles.dealPill}>🔥 Oferta destacada del día</span>
        </div>
        <div className={styles.dealContent}>
          <div className={styles.dealInfo}>
            <h2>Descubre la mejor oferta de hoy</h2>
            <p className={styles.dealSub}>Explora el catálogo completo y compara precios en tiempo real.</p>
            <div className={styles.dealActions}>
              <Link className={styles.dealPrimaryBtn} href="/dashboard">
                <span>Ver catálogo</span>
                <Icon name="arrow" size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { deal, minPrice, maxPrice, savings, savingsPct } = data;
  const image = productImageUrl(deal.imageUrl);
  const storeNames = deal.offers?.map(o => o.source.replace(/-cl$/, "")).filter(Boolean) ?? [];

  return (
    <div className={styles.dealCard}>
      <div className={styles.dealBadgeContainer}>
        <span className={styles.dealPill}>🔥 Oferta destacada del día</span>
        {savings > 0 && (
          <span className={styles.dealSavingsTag}>
            Ahorra {savingsPct}% · {money.format(savings)} entre tiendas
          </span>
        )}
      </div>
      <div className={styles.dealContent}>
        <div className={styles.dealInfo}>
          <p className="eyebrow">{deal.brand}</p>
          <h2>{deal.name} · {deal.unit}</h2>
          <p className={styles.dealSub}>
            Comparamos {deal.matchedStores ?? deal.offers?.length ?? 1} tienda{deal.matchedStores !== 1 ? "s" : ""} en vivo.
            {storeNames.length > 0 && ` Disponible en ${storeNames.join(", ")}.`}
          </p>
          <div className={styles.dealPrices}>
            <div className={styles.dealBestPrice}>
              <small>Mejor oferta disponible</small>
              <strong>{money.format(minPrice || deal.basePrice)}</strong>
            </div>
            {maxPrice > 0 && maxPrice !== minPrice && (
              <div className={styles.dealOtherPrice}>
                <small>Precio más alto en mercado</small>
                <span>{money.format(maxPrice)}</span>
              </div>
            )}
          </div>
          <div className={styles.dealActions}>
            <Link className={styles.dealPrimaryBtn} href={`/perfumes/${deal.id}`}>
              <span>Ver comparación completa</span>
              <Icon name="arrow" size={16} />
            </Link>
            <Link className={styles.dealSecondaryBtn} href="/dashboard">
              <span>Explorar más ofertas</span>
            </Link>
          </div>
        </div>
        {image && (
          <div className={styles.dealImageWrap} aria-hidden="true">
            <Image
              src={image}
              alt={`Perfume ${deal.name} de ${deal.brand}`}
              fill
              sizes="(max-width: 900px) 0px, 320px"
              unoptimized
              style={{ objectFit: "contain", padding: "24px" }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
