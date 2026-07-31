"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./AdBanner.module.css";

/* ─── Tipos ─────────────────────────────────────────────────── */

type AdFormat = "sidebar" | "strip" | "square";

interface AdBannerProps {
  /** Formato del anuncio: lateral, tira horizontal o cuadrado */
  format?: AdFormat;
  /** ID único del slot (para cuando integres AdSense real) */
  slotId?: string;
  /** Clase CSS adicional */
  className?: string;
}

/* ─── Anuncios propios de demostración ──────────────────────── */
// Reemplaza estos por tu código de Google AdSense cuando estés listo.
// Para AdSense: elimina el div .adMock y descomenta el <ins> de abajo.

const DEMO_ADS = [
  {
    brand: "Armaf",
    headline: "Club De Nuit Intense Man",
    sub: "El bestseller que destrona a Aventus",
    cta: "Ver en catálogo →",
    href: "/dashboard?q=Club+de+nuit",
    badge: "OFERTA",
    color: "#c5a059",
    bg: "linear-gradient(135deg,#1a1410 0%,#2e2518 100%)",
  },
  {
    brand: "Lattafa",
    headline: "Bade'e Al Oud",
    sub: "Oud árabe auténtico desde $14.990",
    cta: "Comparar precio →",
    href: "/dashboard?q=Bade+oud",
    badge: "TENDENCIA",
    color: "#9b7fd4",
    bg: "linear-gradient(135deg,#120d1f 0%,#1e1535 100%)",
  },
  {
    brand: "Creed",
    headline: "Aventus",
    sub: "Precio más bajo verificado en 5 tiendas",
    cta: "Ver comparativa →",
    href: "/dashboard?q=Aventus+Creed",
    badge: "NICHO",
    color: "#60a5fa",
    bg: "linear-gradient(135deg,#0a1120 0%,#0f1e3a 100%)",
  },
];

/* ─── Componente ─────────────────────────────────────────────── */

export function AdBanner({
  format = "sidebar",
  slotId,
  className = "",
}: AdBannerProps) {
  const [adIndex, setAdIndex] = useState(0);
  const [visible, setVisible] = useState(false);
  const [entered, setEntered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /* Rotación de anuncio cada 8 segundos */
  useEffect(() => {
    const iv = setInterval(() => {
      setEntered(false);
      setTimeout(() => {
        setAdIndex((i) => (i + 1) % DEMO_ADS.length);
        setEntered(true);
      }, 350);
    }, 8000);
    return () => clearInterval(iv);
  }, []);

  /* Aparecer al entrar en viewport */
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          setEntered(true);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  const ad = DEMO_ADS[adIndex];

  return (
    <div
      ref={ref}
      className={[
        styles.adWrapper,
        styles[format],
        visible ? styles.visible : "",
        entered ? styles.entered : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Publicidad"
      role="complementary"
    >
      <span className={styles.adLabel}>Publicidad</span>

      <a
        href={ad.href}
        className={styles.adMock}
        style={{ background: ad.bg } as React.CSSProperties}
        target="_self"
        rel="noopener"
        aria-label={`Anuncio: ${ad.headline}`}
      >
        {/* Partículas decorativas */}
        <span className={styles.particle} style={{ "--i": 0 } as React.CSSProperties} />
        <span className={styles.particle} style={{ "--i": 1 } as React.CSSProperties} />
        <span className={styles.particle} style={{ "--i": 2 } as React.CSSProperties} />

        <span
          className={styles.adBadge}
          style={{ color: ad.color, borderColor: `${ad.color}40` }}
        >
          {ad.badge}
        </span>
        <p className={styles.adBrand}>{ad.brand}</p>
        <p className={styles.adHeadline}>{ad.headline}</p>
        <p className={styles.adSub}>{ad.sub}</p>
        <span className={styles.adCta} style={{ color: ad.color }}>
          {ad.cta}
        </span>

        {/* Ícono de perfume SVG decorativo */}
        <svg
          className={styles.adBottle}
          viewBox="0 0 60 100"
          aria-hidden="true"
        >
          <rect x="22" y="8" width="16" height="8" rx="3" fill="currentColor" opacity=".3" />
          <rect x="18" y="16" width="24" height="6" rx="2" fill="currentColor" opacity=".25" />
          <rect x="10" y="22" width="40" height="70" rx="12" fill="currentColor" opacity=".15" />
          <rect x="10" y="22" width="40" height="70" rx="12" stroke="currentColor" strokeWidth="1.5" fill="none" opacity=".4" />
          <ellipse cx="30" cy="48" rx="10" ry="14" fill="currentColor" opacity=".08" />
        </svg>
      </a>
    </div>
  );
}
