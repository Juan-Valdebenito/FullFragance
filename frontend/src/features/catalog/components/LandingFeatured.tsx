"use client";

import { useEffect, useState } from "react";
import { bestOfferPrice, loadFeatured } from "../domain/homeData";
import { ProductRail, type RailItem } from "./ProductRail";

export function LandingFeatured() {
  const [items, setItems] = useState<RailItem[] | null>(null);

  useEffect(() => {
    loadFeatured()
      .then(products => setItems(products.map(product => ({
        product,
        price: bestOfferPrice(product),
        stores: product.matchedStores ?? product.offers?.length,
      }))))
      .catch(() => setItems([]));
  }, []);

  return (
    <ProductRail
      id="featured-title"
      title="Los más comparados"
      href="/dashboard"
      linkLabel="Ver catálogo"
      items={items}
      emptyText="La vitrina aparece apenas el catálogo responda."
    />
  );
}
