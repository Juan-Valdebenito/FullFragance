"use client";

import { useState } from "react";

// Devuelve la primera imagen que no ha fallado; al fallar una, pasa a la siguiente tienda.
export function useImageFallback(candidates: string[]) {
  // El estado se asocia a las candidatas actuales, así un cambio de producto reintenta todas.
  const key = candidates.join("|");
  const [failed, setFailed] = useState<{ key: string; urls: string[] }>({ key, urls: [] });
  const failedUrls = failed.key === key ? failed.urls : [];
  const image = candidates.find((candidate) => !failedUrls.includes(candidate));
  const markFailed = (url: string) => setFailed((current) => {
    const urls = current.key === key ? current.urls : [];
    return urls.includes(url) ? current : { key, urls: [...urls, url] };
  });
  return { image, markFailed };
}
