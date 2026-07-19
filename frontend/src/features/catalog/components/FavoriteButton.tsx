"use client";
import { useState } from "react";
import { useSession } from "@/shared/auth/SessionContext";
import { Icon } from "@/shared/components/Icon";
import styles from "./catalog.module.css";
export function FavoriteButton({ productId, large = false }: { productId: string; large?: boolean }) { const { isFavorite, toggleFavorite } = useSession(); const [busy, setBusy] = useState(false); const favorite = isFavorite(productId); return <button className={`${styles.favorite} ${large ? styles.favoriteLarge : ""}`} aria-label={favorite ? "Quitar de favoritos" : "Agregar a favoritos"} aria-pressed={favorite} disabled={busy} onClick={async event => { event.preventDefault(); setBusy(true); try { await toggleFavorite(productId); } finally { setBusy(false); } }}><Icon name="heart" size={large ? 22 : 18}/><span>{large ? (favorite ? "Guardado" : "Guardar") : ""}</span></button>; }
