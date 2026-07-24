import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.falabella.com" },
      { protocol: "https", hostname: "falabella.scene7.com" },
      { protocol: "https", hostname: "media.falabella.com" },
    ],
  },
};

export default nextConfig;
