import type { Metadata } from "next";
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
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
