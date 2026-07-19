"use client";
import { useEffect, useState } from "react";
import { api, ApiError } from "@/shared/api/client";
import { useSession } from "@/shared/auth/SessionContext";
import type { Store } from "@/shared/api/types";
import { Icon } from "@/shared/components/Icon";
import { StoreMap } from "./StoreMap";
import styles from "@/app/dashboard/dashboard.module.css";
const DEFAULT_CITY = { name: "Santiago", country: "Chile", lat: -33.4489, lon: -70.6693 };
export function StorePanel() { const { user } = useSession(); const [stores, setStores] = useState<Store[]>([]); const [error, setError] = useState(""); const city = user.city ?? DEFAULT_CITY;
  useEffect(() => { api.stores(city).then(setStores).catch(reason => setError(reason instanceof ApiError ? reason.message : "No se pudieron cargar las tiendas.")); }, [city]);
  return <aside className={styles.mapCard}><div className={styles.mapHeader}><h2>Tiendas reales cerca de ti</h2><span><i/>{stores.length} tiendas encontradas</span></div><div className={styles.map}>{error ? <p className={styles.mapError}>{error}</p> : <StoreMap stores={stores} city={city}/>}</div><div className={styles.storeList}>{stores.slice(0,3).map(store => <a key={store.id} href={store.website || `https://www.google.com/maps/search/?api=1&query=${store.lat},${store.lon}`} target="_blank" rel="noopener noreferrer"><span><Icon name="pin"/></span><div><strong>{store.name}</strong><p>{store.address}{store.distanceKm !== undefined ? ` · ${store.distanceKm.toFixed(1)} km` : ""}</p></div><Icon name="arrow"/></a>)}</div></aside>;
}
