import type { Metadata } from "next";
import { IBM_Plex_Sans, Josefin_Sans } from "next/font/google";
import { OptionalSessionProvider } from "@/shared/auth/OptionalSessionProvider";
import { ThemeProvider } from "@/shared/theme/ThemeContext";
import { GoogleAdsense } from "@/shared/components/GoogleAdsense";
import { PageViewTracker } from "@/shared/analytics/PageViewTracker";
import "./globals.css";

// Fuentes servidas desde el propio dominio por next/font: no dependen de
// fonts.googleapis.com (bloqueado por la CSP) y no retrasan el render.
// Josefin Sans es la letra geométrica del logo: títulos y marca la usan para
// que el sitio y el logo se vean como una sola identidad.
const displayFont = Josefin_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
  variable: "--font-josefin",
});

const bodyFont = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-plex",
});

const SITE_URL = "https://fullfragance.cl";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "FullFragance | Comparador de Precios de Perfumes en Chile",
    template: "%s | FullFragance",
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
  openGraph: {
    type: "website",
    locale: "es_CL",
    siteName: "FullFragance",
    url: SITE_URL,
    title: "FullFragance | Comparador de Precios de Perfumes en Chile",
    description:
      "Compara precios de perfumes originales entre tiendas verificadas de Chile y encuentra la oferta más barata antes de comprar.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FullFragance | Comparador de Precios de Perfumes en Chile",
    description: "Compara precios de perfumes originales entre tiendas verificadas de Chile.",
  },
};

// Datos de la organización y del sitio para todos los resultados de Google;
// SearchAction habilita el cuadro de búsqueda del sitio en los resultados.
const siteStructuredData = JSON.stringify([
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "FullFragance",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.jpeg`,
    email: "fullfragance67@gmail.com",
    foundingDate: "2026-07-16",
    founders: [
      { "@type": "Person", name: "Benjamín Cantero" },
      { "@type": "Person", name: "Juan Pablo Valdebenito" },
    ],
    address: { "@type": "PostalAddress", addressLocality: "Temuco", addressCountry: "CL" },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "FullFragance",
    url: SITE_URL,
    inLanguage: "es-CL",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/dashboard?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  },
]);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${displayFont.variable} ${bodyFont.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Aplica el tema guardado antes del primer render para evitar el flash claro→oscuro */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("fullfragrance_theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}if(t!=="light"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`,
          }}
        />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: siteStructuredData }} />
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
