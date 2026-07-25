"use client";

import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "@/shared/api/client";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import type { City, Store } from "@/shared/api/types";
import { Icon } from "@/shared/components/Icon";
import { StoreMap } from "./StoreMap";
import styles from "./StorePanel.module.css";

const CITY_PRESETS: City[] = [
  { name: "Santiago", country: "Chile", lat: -33.4489, lon: -70.6693 },
  { name: "Valparaíso", country: "Chile", lat: -33.0472, lon: -71.6127 },
  { name: "Concepción", country: "Chile", lat: -36.8201, lon: -73.0444 },
  { name: "La Serena", country: "Chile", lat: -29.9027, lon: -71.2519 },
  { name: "Antofagasta", country: "Chile", lat: -23.6509, lon: -70.3975 },
  { name: "Temuco", country: "Chile", lat: -38.7359, lon: -72.5904 },
];

export function StorePanel() {
  const session = useOptionalSession();
  const user = session?.user ?? null;
  const updateCity = session?.updateCity;

  // Active selected city
  const initialCityIndex = useMemo(() => {
    if (!user?.city?.name) return 0;
    const index = CITY_PRESETS.findIndex((c) => c.name.toLowerCase() === user.city?.name.toLowerCase());
    return index >= 0 ? index : 0;
  }, [user?.city?.name]);

  const [cityIndex, setCityIndex] = useState(initialCityIndex);
  const activeCity = CITY_PRESETS[cityIndex] ?? CITY_PRESETS[0];

  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Fetch stores when active city changes
  useEffect(() => {
    setLoading(true);
    setError("");
    api.stores(activeCity)
      .then(setStores)
      .catch((reason) => setError(reason instanceof ApiError ? reason.message : "No se pudieron cargar las tiendas."))
      .finally(() => setLoading(false));
  }, [activeCity]);

  // Handle user changing city dropdown
  async function handleCityChange(index: number) {
    setCityIndex(index);
    const newCity = CITY_PRESETS[index];
    if (user && updateCity) {
      try {
        await updateCity(newCity);
      } catch {
        // Ignorar si falla la persistencia en perfil
      }
    }
  }

  // Filtered store list
  const filteredStores = useMemo(() => {
    if (!search.trim()) return stores;
    const q = search.toLowerCase();
    return stores.filter((s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q));
  }, [stores, search]);

  return (
    <div className={styles.container}>
      {/* ── Explanation Hero ────────────────────────────────────────────── */}
      <section className={styles.heroCard}>
        <div className={styles.heroTop}>
          <span className={styles.heroBadge}>
            📍 Cobertura de tiendas físicas
          </span>
          <h2 className={styles.heroTitle}>
            ¿Para qué sirve este mapa de sucursales?
          </h2>
          <p className={styles.heroDesc}>
            Te ayuda a ubicar tiendas físicas reales (Falabella, Ripley, París, Perfumerías) en tu ciudad donde puedes <strong>probar perfumes en persona</strong> con sus probadores/testers, verificar disponibilidad inmediata de stock y calcular la distancia exacta antes de comprar.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🧪</div>
            <div className={styles.featureText}>
              <h4>Prueba en Piel</h4>
              <p>Evalúa el secado y la fijación real en tu piel probando en tienda.</p>
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📏</div>
            <div className={styles.featureText}>
              <h4>Distancia Exacta</h4>
              <p>Calculada automáticamente en kilómetros desde el centro de la ciudad.</p>
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🗺️</div>
            <div className={styles.featureText}>
              <h4>Ruta GPS Directa</h4>
              <p>Acceso en un clic a Google Maps para navegación paso a paso.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Location & Control Bar ──────────────────────────────────────── */}
      <section className={styles.controlBar}>
        <div className={styles.citySelectorGroup}>
          <span className={styles.cityLabel}>
            📍 Cambiar Ubicación:
          </span>
          <select
            className={styles.citySelect}
            value={cityIndex}
            onChange={(e) => handleCityChange(Number(e.target.value))}
          >
            {CITY_PRESETS.map((city, index) => (
              <option key={city.name} value={index}>
                {city.name}, {city.country}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.searchGroup}>
          <Icon name="search" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar tienda por nombre o calle..."
          />
        </div>
      </section>

      {/* ── Split View: Map + Store Cards ───────────────────────────────── */}
      <section className={styles.splitView}>
        {/* Left: Map Frame */}
        <div className={styles.mapWrapper}>
          <div className={styles.mapHeader}>
            <span className={styles.mapTitle}>
              Mapa Interactivo — {activeCity.name}
            </span>
            <span className={styles.mapBadge}>
              {loading ? "Cargando..." : `${stores.length} sucursales`}
            </span>
          </div>
          <div className={styles.mapFrame}>
            {error ? (
              <p className={styles.mapError}>{error}</p>
            ) : (
              <StoreMap stores={stores} city={activeCity} />
            )}
          </div>
        </div>

        {/* Right: Store Cards List */}
        <div className={styles.storeListWrapper}>
          <div className={styles.storeListHeader}>
            <h3 className={styles.storeListTitle}>
              Sucursales cercanas ({filteredStores.length})
            </h3>
          </div>

          <div className={styles.storeCardsGrid}>
            {loading ? (
              <p className={styles.emptyStores}>Cargando sucursales de {activeCity.name}...</p>
            ) : filteredStores.length ? (
              filteredStores.map((store) => {
                const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lon}`;

                return (
                  <article key={store.id} className={styles.storeCard}>
                    <div className={styles.storeCardTop}>
                      <div>
                        <h4 className={styles.storeName}>{store.name}</h4>
                        <p className={styles.storeAddress}>{store.address}</p>
                      </div>
                      {store.distanceKm !== undefined && (
                        <span className={styles.storeDistance}>
                          📍 {store.distanceKm.toFixed(1)} km
                        </span>
                      )}
                    </div>

                    <div className={styles.storeActions}>
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${styles.actionBtn} ${styles.actionBtnPrimary}`}
                      >
                        <Icon name="pin" /> Cómo llegar (GPS)
                      </a>
                      {store.website && (
                        <a
                          href={store.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                        >
                          🌐 Sitio web
                        </a>
                      )}
                    </div>
                  </article>
                );
              })
            ) : (
              <div className={styles.emptyStores}>
                <p>No se encontraron sucursales para "{search}" en {activeCity.name}.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
