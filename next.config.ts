import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // PWA enabled in dev for testing
});

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  experimental: {
    proxyClientMaxBodySize: "100mb",
    turbo: {
      resolveAlias: {
        canvas: "./empty.js",
      },
    },
  },
  serverExternalPackages: ["canvas"],
  turbopack: {},
};

export default withPWA(nextConfig);
