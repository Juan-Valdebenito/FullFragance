import type { Metadata } from "next";
import { OptionalSessionProvider } from "@/shared/auth/OptionalSessionProvider";
import "./globals.css";
import "leaflet/dist/leaflet.css";

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
      <body>
        <OptionalSessionProvider>{children}</OptionalSessionProvider>
      </body>
    </html>
  );
}
