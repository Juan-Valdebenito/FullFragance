import Image from "next/image";
import Link from "next/link";
import type { Product } from "../domain/product";
import { Icon } from "@/shared/components/Icon";
import { FavoriteButton } from "./FavoriteButton";
import styles from "./catalog.module.css";

export function ProductCard({ product, recommendation = false }: { product: Product; recommendation?: boolean }) {
  return <article className={`${styles.card} ${recommendation ? styles.recommendation : ""}`}>
    <div className={styles.imageWrap}><Link href={`/perfumes/${product.id}`} aria-label={`Ver ${product.name}`}><Image src={product.image} alt={`Perfume ${product.name} de ${product.brand}`} fill sizes="(max-width: 700px) 100vw, 400px" /></Link>{product.badge && <span className={styles.badge}>{product.badge}</span>}<FavoriteButton productId={product.id}/></div>
    <div className={styles.cardBody}><p className="eyebrow">{product.brand}</p><h3>{product.name}</h3><p className={styles.notes}>{product.size} · {product.notes.join(", ")}</p>
      <div className={styles.prices}>{product.prices.map(price => <div className={styles.priceRow} key={price.store}><span>{price.store}{price.offer && <em>Oferta</em>}</span><strong>{price.price}</strong></div>)}</div>
      <Link className={styles.storeButton} href={`/perfumes/${product.id}`}>{recommendation ? <><span>Comparar</span><Icon name="chart" /></> : "Ver precios y tiendas"}</Link>
    </div>
  </article>;
}
