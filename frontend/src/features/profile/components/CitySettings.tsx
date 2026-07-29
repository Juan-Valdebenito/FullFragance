"use client";
import { FormEvent, useState } from "react";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import { ApiError } from "@/shared/api/client";
import type { City } from "@/shared/api/types";
import styles from "./profile.module.css";

const cities: City[] = [
  { name: "Santiago", country: "Chile", lat: -33.4489, lon: -70.6693 },
  { name: "Valparaíso", country: "Chile", lat: -33.0472, lon: -71.6127 },
  { name: "Concepción", country: "Chile", lat: -36.8201, lon: -73.0444 },
  { name: "La Serena", country: "Chile", lat: -29.9027, lon: -71.2519 },
  { name: "Antofagasta", country: "Chile", lat: -23.6509, lon: -70.3975 },
  { name: "Temuco", country: "Chile", lat: -38.7359, lon: -72.5904 },
];

export function CitySettings() {
  const session = useOptionalSession();
  const user = session?.user ?? null;
  const initial = cities.findIndex(city => city.name === user?.city?.name);
  const [selected, setSelected] = useState(initial >= 0 ? initial : 0);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!session || !user) {
      setStatus("Debes iniciar sesión para guardar tu ubicación por defecto.");
      return;
    }
    setSaving(true);
    setStatus("");
    try {
      await session.updateCity(cities[selected]);
      setStatus("Ciudad actualizada. Los precios y tiendas ya usan esta ubicación.");
    } catch (reason) {
      setStatus(reason instanceof ApiError ? reason.message : "No se pudo actualizar la ciudad.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={styles.cityForm} onSubmit={submit}>
      <label>
        Ciudad para comparar
        <select value={selected} onChange={event => setSelected(Number(event.target.value))}>
          {cities.map((city, index) => (
            <option value={index} key={city.name}>
              {city.name}, {city.country}
            </option>
          ))}
        </select>
      </label>
      <div className={styles.coordinates}>
        <span>Latitud: {cities[selected].lat}</span>
        <span>Longitud: {cities[selected].lon}</span>
      </div>
      {status && <p role="status">{status}</p>}
      <button disabled={saving || !user}>{saving ? "Guardando…" : "Guardar ciudad"}</button>
    </form>
  );
}
