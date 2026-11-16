"use client";

import { useEffect, useState } from "react";
import type { PriceDrop } from "@/shared/api/types";
import { loadPriceDrops } from "../domain/homeData";
import { ProductRail, type RailItem } from "./ProductRail";

const VISIBLE_DROPS = 12;

function toRailItem({ deal, price, refPrice, dropPct, isLowest }: PriceDrop): RailItem {
  return {
    product: deal,
    price,
    // El tachado es el precio habitual del perfume, no el de otra tienda.
    oldPrice: refPrice,
    savingsPct: dropPct,
    note: isLowest ? "Precio más bajo en 90 días" : "Bajo su precio habitual",
  };
}

/**
 * Perfumes cuyo precio de hoy está más bajo que su mediana histórica. A
 * diferencia de "Ofertas de hoy" (tienda cara vs. barata el mismo día), aquí se
 * compara contra el propio historial del perfume.
 */
export function PriceDrops() {
  const [items, setItems] = useState<RailItem[] | null>(null);

  useEffect(() => {
    loadPriceDrops()
      .then(drops => setItems(drops.slice(0, VISIBLE_DROPS).map(toRailItem)))
      .catch(() => setItems([]));
  }, []);

  // Sin historial suficiente la sección no aporta nada: se oculta.
  if (items && !items.length) return null;

  return (
    <ProductRail
      id="price-drops-title"
      title="Mayores bajas de precio"
      href="/como-comparamos"
      linkLabel="Cómo lo medimos"
      items={items}
      emptyText=""
    />
  );
}
