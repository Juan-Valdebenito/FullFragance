import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/login", "/registro", "/perfil", "/favoritos", "/test", "/recomendaciones"],
    },
    sitemap: "https://fullfragance.cl/sitemap.xml",
  };
}
