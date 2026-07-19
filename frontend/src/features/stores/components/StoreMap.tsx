"use client";
import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { City, Store } from "@/shared/api/types";
import styles from "./StoreMap.module.css";

export function StoreMap({ stores, city }: { stores: Store[]; city: City }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let cancelled = false;
    import("leaflet").then(L => {
      if (cancelled || !containerRef.current) return;
      mapRef.current?.remove();
      const map = L.map(containerRef.current, { center: [city.lat, city.lon], zoom: 12, zoomControl: true, scrollWheelZoom: false });
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
      const icon = L.divIcon({ className: styles.markerShell, html: '<span class="map-pin"><i></i></span>', iconSize: [34, 42], iconAnchor: [17, 40], popupAnchor: [0, -38] });
      const bounds: [number, number][] = [];
      stores.forEach(store => { bounds.push([store.lat, store.lon]); L.marker([store.lat, store.lon], { icon }).addTo(map).bindPopup(`<strong>${escapeHtml(store.name)}</strong><br><span>${escapeHtml(store.address)}</span><br><a href="https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lon}" target="_blank" rel="noopener noreferrer">Abrir indicaciones</a>`); });
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [42, 42], maxZoom: 14 });
      window.setTimeout(() => map.invalidateSize(), 50);
    });
    return () => { cancelled = true; mapRef.current?.remove(); mapRef.current = null; };
  }, [city, stores]);

  return <div ref={containerRef} className={styles.map} aria-label={`Mapa interactivo de tiendas en ${city.name}`} />;
}

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char); }
