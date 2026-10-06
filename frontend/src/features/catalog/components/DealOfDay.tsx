"use client";

import { useEffect, useState } from "react";
import type { DealOfDay as DealData } from "@/shared/api/types";
import { loadDeals } from "../domain/homeData";
import { ProductRail, type RailItem } from "./ProductRail";

const VISIBLE_DEALS = 12;

// El backend entrega un grupo amplio de ofertas; se baraja en cada visita para
// que el carrusel no muestre siempre los mismos perfumes.
function pickRandomDeals(deals: DealData[]) {
  const shuffled = [...deals];
  for (let index = shuffled.length - 1; index > 0; index--) {
    const swap = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return shuffled.slice(0, VISIBLE_DEALS);
}

function toRailItem({ deal, minPrice, maxPrice, savingsPct }: DealData): RailItem {
  return {
    product: deal,
    price: minPrice || deal.basePrice,
    oldPrice: maxPrice,
    savingsPct,
    stores: deal.offers?.length,
  };
}

export function DealOfDay() {
  const [items, setItems] = useState<RailItem[] | null>(null);

  useEffect(() => {
    loadDeals()
      .then(deals => setItems(pickRandomDeals(deals).map(toRailItem)))
      .catch(() => setItems([]));
  }, []);

  return (
    <ProductRail
      id="deals-title"
      title="Ofertas de hoy"
      href="/dashboard?sort=savings"
      linkLabel="Ver todas"
      items={items}
      emptyText="Las ofertas aparecen apenas el catálogo responda."
    />
  );
}
