"use client";

import { useEffect, useRef, useState } from "react";
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
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_ID;

  // adsbygoogle.push({}) no apunta a un bloque concreto: llena el siguiente
  // <ins> sin procesar de la página. Si un bloque oculto por CSS (las barras
  // laterales bajo 1600 px) tuviera su <ins>, el push de un bloque visible
  // terminaría pidiendo anuncio para el oculto ("No slot size for
  // availableWidth=0"). Por eso el <ins> sólo existe cuando el contenedor
  // tiene ancho, y aparece si la ventana se agranda después.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!publisherId || !wrapper) return;
    if (wrapper.offsetWidth > 0) {
      setVisible(true);
      return;
    }
    const observer = new ResizeObserver(() => {
      if (wrapper.offsetWidth > 0) {
        setVisible(true);
        observer.disconnect();
      }
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [publisherId]);

  useEffect(() => {
    if (!publisherId || !visible) return;
    try {
      // Cada bloque visible empuja una vez, justo después de montar su <ins>.
      (
        (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle =
          (window as unknown as { adsbygoogle: unknown[] }).adsbygoogle || []
      ).push({});
    } catch {
      // AdSense puede fallar en localhost/preview — ignorar silenciosamente
    }
  }, [publisherId, visible]);

  if (!publisherId) return null;

  return (
    <div ref={wrapperRef} className={[styles.adSlotWrapper, className].filter(Boolean).join(" ")}>
      {visible && (
        <>
          <span className={styles.adLabel}>Publicidad</span>
          <ins
            className="adsbygoogle"
            style={{ display: "block" }}
            data-ad-client={publisherId}
            data-ad-slot={slotId}
            data-ad-format={adFormat}
            data-full-width-responsive="true"
          />
        </>
      )}
    </div>
  );
}
