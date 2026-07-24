import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "*.falabella.com" },
      { protocol: "https", hostname: "falabella.scene7.com" },
      { protocol: "https", hostname: "media.falabella.com" },
      { protocol: "https", hostname: "ripley.scene7.com", pathname: "/is/image/Ripley/**" },
      { protocol: "https", hostname: "home.ripley.cl", pathname: "/store/Attachment/**" },
      { protocol: "https", hostname: "rimage.ripley.cl", pathname: "/home.ripley/Attachment/**" },
    ],
  },
};

export default nextConfig;
