"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useOptionalSession } from "@/shared/auth/SessionContext";
import { Icon } from "@/shared/components/Icon";
import styles from "./catalog.module.css";
export function FavoriteButton({ productId, aliases = [], large = false }: { productId: string; aliases?: string[]; large?: boolean }) { const optionalSession = useOptionalSession(); const router = useRouter(); const pathname = usePathname(); const [busy, setBusy] = useState(false); const favorite = optionalSession?.isFavorite(productId, aliases) ?? false; return <button className={`${styles.favorite} ${large ? styles.favoriteLarge : ""}`} aria-label={favorite ? "Quitar de favoritos" : "Agregar a favoritos"} aria-pressed={favorite} disabled={busy} onClick={async event => { event.preventDefault(); if (!optionalSession?.user) { router.push(`/login?next=${encodeURIComponent(pathname)}`); return; } setBusy(true); try { await optionalSession.toggleFavorite(productId); } finally { setBusy(false); } }}><Icon name="heart" size={large ? 22 : 18}/><span>{large ? (favorite ? "Guardado" : "Guardar") : ""}</span></button>; }
