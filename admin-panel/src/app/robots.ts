import type { MetadataRoute } from "next";

// Bloquea todo el rastreo: esta app es una herramienta interna, no un sitio
// publico. No deberia indexarse ni ser enlazada desde ningun lado.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
