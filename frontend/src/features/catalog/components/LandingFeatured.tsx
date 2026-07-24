"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { api, productImageUrl } from "@/shared/api/client";
import type { ApiProduct } from "@/shared/api/types";
import styles from "@/app/home.module.css";

const money = new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 });

export function LandingFeatured() {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.featuredProducts()
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className={styles.featuredGrid} aria-label="Cargando fragancias destacadas">
      {[0, 1, 2].map((item) => <article className={styles.featuredSkeleton} key={item}><div/><span/><h3/><p/></article>)}
    </div>;
  }

  if (!products.length) {
    return <div className={styles.featuredEmpty}><p>La vitrina se actualizará apenas el catálogo esté disponible.</p><Link href="/dashboard">Ir al comparador</Link></div>;
  }

  return <div className={styles.featuredGrid}>
    {products.map((product) => {
      const image = productImageUrl(product.imageUrl);
      const compared = (product.matchedStores ?? product.offers?.length ?? 0) > 1;
      return <article key={product.id}>
        <Link className={styles.featuredImage} href={`/perfumes/${product.id}`} aria-label={`Ver ${product.name}`}>
          {image ? <Image src={image} alt={`Perfume ${product.name} de ${product.brand}`} fill sizes="(max-width: 920px) 100vw, 33vw" unoptimized /> : <div className={styles.miniBottle}><i /></div>}
        </Link>
        <span>{compared ? "Comparado" : "Disponible"}</span>
        <h3>{product.brand} {product.name}</h3>
        <p>{product.unit} · {product.category}</p>
        <strong className={styles.featuredPrice}>Desde {money.format(product.basePrice)}</strong>
        <Link href={`/perfumes/${product.id}`}>Ver precios</Link>
      </article>;
    })}
  </div>;
}
