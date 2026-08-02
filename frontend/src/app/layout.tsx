import type { Metadata } from "next";
import { OptionalSessionProvider } from "@/shared/auth/OptionalSessionProvider";
import { ThemeProvider } from "@/shared/theme/ThemeContext";
import { GoogleAdsense } from "@/shared/components/GoogleAdsense";
import { PageViewTracker } from "@/shared/analytics/PageViewTracker";
import "./globals.css";

export const metadata: Metadata = {
  title: "FullFragance",
  description: "Compara precios y descubre tu próxima fragancia favorita.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <head>
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
