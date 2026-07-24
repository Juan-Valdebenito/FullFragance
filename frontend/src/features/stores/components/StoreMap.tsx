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
    let ownedMap: LeafletMap | null = null;
    let resizeTimer: number | null = null;
    import("leaflet").then(L => {
      if (cancelled || !containerRef.current) return;
      const map = L.map(containerRef.current, {
        center: [city.lat, city.lon],
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: false,
        zoomAnimation: false,
        fadeAnimation: false,
        markerZoomAnimation: false,
      });
      ownedMap = map;
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' }).addTo(map);
      const icon = L.divIcon({ className: styles.markerShell, html: '<span class="map-pin"><i></i></span>', iconSize: [34, 42], iconAnchor: [17, 40], popupAnchor: [0, -38] });
      const bounds: [number, number][] = [];
      stores.forEach(store => { bounds.push([store.lat, store.lon]); const details = [store.openingHours ? `<br><small>${escapeHtml(store.openingHours)}</small>` : "", store.distanceKm !== undefined ? `<br><small>A ${store.distanceKm.toFixed(1)} km del centro</small>` : ""].join(""); const destination = store.website || `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lon}`; L.marker([store.lat, store.lon], { icon }).addTo(map).bindPopup(`<strong>${escapeHtml(store.name)}</strong><br><span>${escapeHtml(store.address)}</span>${details}<br><a href="${escapeHtml(destination)}" target="_blank" rel="noopener noreferrer">${store.website ? "Visitar tienda" : "Abrir indicaciones"}</a>`); });
      if (bounds.length > 1) map.fitBounds(bounds, { padding: [42, 42], maxZoom: 14, animate: false });
      resizeTimer = window.setTimeout(() => {
        if (!cancelled && mapRef.current === map) map.invalidateSize({ animate: false });
      }, 50);
    });
    return () => {
      cancelled = true;
      if (resizeTimer !== null) window.clearTimeout(resizeTimer);
      if (ownedMap) {
        ownedMap.stop();
        ownedMap.off();
        ownedMap.remove();
        if (mapRef.current === ownedMap) mapRef.current = null;
      }
    };
  }, [city, stores]);

  return <div ref={containerRef} className={styles.map} aria-label={`Mapa interactivo de tiendas en ${city.name}`} />;
}

function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char] ?? char); }
