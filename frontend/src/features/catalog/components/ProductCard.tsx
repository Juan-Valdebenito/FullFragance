import Image from "next/image";
import Link from "next/link";
import type { Product } from "../domain/product";
import { Icon } from "@/shared/components/Icon";
import { FavoriteButton } from "./FavoriteButton";
import styles from "./catalog.module.css";

export function ProductCard({ product, recommendation = false }: { product: Product; recommendation?: boolean }) {
  return <article className={`${styles.card} ${recommendation ? styles.recommendation : ""}`}>
    <div className={styles.imageWrap}><Link href={`/perfumes/${product.id}`} aria-label={`Ver ${product.name}`}>{product.image ? <Image src={product.image} unoptimized={product.image.includes("/api/images/ripley/")} alt={`Perfume ${product.name} de ${product.brand}`} fill sizes="(max-width: 700px) 100vw, 400px" /> : <span className={styles.imagePlaceholder}>FF</span>}</Link>{product.badge && <span className={styles.badge}>{product.badge}</span>}<FavoriteButton productId={product.id} aliases={product.aliases}/></div>
    <div className={styles.cardBody}><p className="eyebrow">{product.brand}</p><h3>{product.name}</h3><p className={styles.notes}>{product.size} · {product.notes.join(", ")}</p>
      <div className={styles.prices}>{product.prices.length ? product.prices.map((price, index) => <div className={styles.priceRow} key={price.id ?? `${price.store}-${price.price}-${index}`}><span>{price.store}{price.offer && <em>Oferta</em>}</span><strong>{price.price}</strong></div>) : <div className={styles.priceRow}><span>Falabella</span><strong>Precio pendiente</strong></div>}</div>
      <Link className={styles.storeButton} href={`/perfumes/${product.id}`}>{recommendation ? <><span>Comparar</span><Icon name="chart" /></> : "Ver precios y tiendas"}</Link>
    </div>
  </article>;
}
