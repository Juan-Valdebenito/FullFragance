import type { Metadata } from "next";
import { OptionalSessionProvider } from "@/shared/auth/OptionalSessionProvider";
import { ThemeProvider } from "@/shared/theme/ThemeContext";
import { GoogleAdsense } from "@/shared/components/GoogleAdsense";
import { PageViewTracker } from "@/shared/analytics/PageViewTracker";
import "./globals.css";

const SITE_URL = "https://fullfragance.cl";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FullFragrance | Comparador de Precios de Perfumes en Chile",
    template: "%s | FullFragrance",
  },
  description:
    "Compara precios de perfumes originales entre tiendas verificadas de Chile (Falabella, Ripley, Paris, ABC y más) y encuentra la oferta más barata antes de comprar.",
  keywords: [
    "perfumes",
    "comparar precios perfumes",
    "perfumes baratos chile",
    "perfumes originales chile",
    "ofertas perfumes",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "es_CL",
    siteName: "FullFragrance",
    url: SITE_URL,
    title: "FullFragrance | Comparador de Precios de Perfumes en Chile",
    description:
      "Compara precios de perfumes originales entre tiendas verificadas de Chile y encuentra la oferta más barata antes de comprar.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FullFragrance | Comparador de Precios de Perfumes en Chile",
    description: "Compara precios de perfumes originales entre tiendas verificadas de Chile.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <head>
        {/* Aplica el tema guardado antes del primer render para evitar el flash claro→oscuro */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("fullfragrance_theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}if(t!=="light"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`,
          }}
        />
        {/* Script de Google AdSense — solo activo con NEXT_PUBLIC_ADSENSE_ID */}
        <GoogleAdsense />
      </head>
      <body>
        <ThemeProvider>
          <OptionalSessionProvider>{children}</OptionalSessionProvider>
          <PageViewTracker />
        </ThemeProvider>
      </body>
    </html>
  );
}
