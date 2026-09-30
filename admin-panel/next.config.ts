import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

// La URL del backend en producción puede venir de NEXT_PUBLIC_API_URL.
// Extraemos el origen (protocolo + host) para usarlo en la CSP.
const apiOrigin = process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "").replace(/\/$/, "") || "";

// En producción también permitimos pagead2 y otros dominios de AdSense en connect-src
const connectSources = [
  "'self'",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  apiOrigin,
  "https://overpass-api.de",
  "https://overpass.kumi.systems",
  "https://nominatim.openstreetmap.org",
].filter(Boolean).join(" ");

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://accounts.google.com https://pagead2.googlesyndication.com https://partner.googleadservices.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  `connect-src ${connectSources} https://accounts.google.com https://pagead2.googlesyndication.com`,
  "frame-src https://accounts.google.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  isDev ? "" : "upgrade-insecure-requests",
].filter(Boolean).join("; ");

const nextConfig: NextConfig = {
  // Evita que Turbopack tome un package-lock ajeno como raíz del proyecto.
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: ["192.168.1.14"],
  images: {
    unoptimized: true,
  },
  // Necesario para que Vercel identifique correctamente el proyecto Next.js
  output: undefined,
  async headers() {
    return [{
      source: "/:path*",
      headers: [
        { key: "Content-Security-Policy", value: contentSecurityPolicy },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), payment=(), usb=()" },
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "DENY" },
      ],
    }];
  },
};

export default nextConfig;
