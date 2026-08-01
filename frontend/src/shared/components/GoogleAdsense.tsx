"use client";

import Script from "next/script";

/**
 * Carga el script global de Google AdSense una sola vez en el <head>.
 * Se activa automáticamente cuando NEXT_PUBLIC_ADSENSE_ID está definido.
 *
 * Pasos para activar:
 *   1. Crea tu cuenta en https://adsense.google.com
 *   2. Obtén tu Publisher ID (formato: ca-pub-XXXXXXXXXXXXXXXX)
 *   3. Agrega en .env.local:  NEXT_PUBLIC_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
 *   4. Redeploy — AdSense empieza a mostrar anuncios reales automáticamente
 */
export function GoogleAdsense() {
  const publisherId = process.env.NEXT_PUBLIC_ADSENSE_ID;

  // Sin Publisher ID no cargamos nada (modo desarrollo / anuncios demo)
  if (!publisherId) return null;

  return (
    <Script
      id="google-adsense"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
