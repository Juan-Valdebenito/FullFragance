import type { Metadata } from "next";
import { OptionalSessionProvider } from "@/shared/auth/OptionalSessionProvider";
import { ThemeProvider } from "@/shared/theme/ThemeContext";
import "./globals.css";

// Herramienta interna: nunca debe indexarse ni promocionarse como el sitio
// público. robots.ts además bloquea el crawl completo.
export const metadata: Metadata = {
  title: "Panel interno — FullFragrance",
  description: "Herramienta administrativa interna. Acceso restringido.",
  robots: { index: false, follow: false, nocache: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* Aplica el tema guardado antes del primer render para evitar el flash claro→oscuro */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("fullfragrance_theme");if(!t){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}if(t!=="light"){document.documentElement.setAttribute("data-theme",t);}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <OptionalSessionProvider>{children}</OptionalSessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
