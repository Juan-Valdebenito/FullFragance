"use client";

import { useEffect, useRef } from "react";
import styles from "./AdSlot.module.css";

interface AdSlotProps {
  /**
   * ID del slot de anuncio que obtienes al crear un bloque en AdSense.
   * Ejemplo: "1234567890"
   * Lo encuentras en: AdSense → Anuncios → Por bloque de anuncios → tu bloque
   */
  slotId: string;
  /** Formato AdSense: auto, rectangle, vertical, horizontal */
  adFormat?: "auto" | "rectangle" | "vertical" | "horizontal";
  /** Clase CSS adicional para ajustar el tamaño del contenedor */
  className?: string;
}

/**
 * Renderiza un bloque real de Google AdSense.
 * Solo se activa si NEXT_PUBLIC_ADSENSE_ID está configurado.
 *
 * Si no hay Publisher ID → retorna null (no rompe nada).
 */
export function AdSlot({
  slotId,
  adFormat = "auto",
  className = "",
}: AdSlotProps) {
  const ref = useRef<HTMLModElement>(null);
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_ID;

  useEffect(() => {
    if (!publisherId) return;
    try {
      // Empujar el anuncio a la cola de AdSense
      (
        (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle =
          (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || []
      ).push({});
    } catch {
      // AdSense puede fallar en localhost/preview — ignorar silenciosamente
    }
  }, [publisherId]);

  if (!publisherId) return null;

  return (
    <div className={[styles.adSlotWrapper, className].filter(Boolean).join(" ")}>
      <span className={styles.adLabel}>Publicidad</span>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={publisherId}
        data-ad-slot={slotId}
        data-ad-format={adFormat}
        data-full-width-responsive="true"
      />
    </div>
  );
}
