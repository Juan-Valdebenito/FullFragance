import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que Turbopack tome un package-lock ajeno como raíz del proyecto.
  turbopack: {
    root: process.cwd(),
  },
  allowedDevOrigins: ["192.168.1.14"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
