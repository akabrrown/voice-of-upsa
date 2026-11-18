import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  // PWA enabled in dev for testing
});

const nextConfig: NextConfig = {
  // Compress and optimize images into modern AVIF and WebP formats
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days edge cache for remote assets
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  compress: true, // Enable Gzip/Brotli response compression
  poweredByHeader: false, // Eliminate unnecessary header overhead
  experimental: {
    proxyClientMaxBodySize: "100mb",
  },
  serverExternalPackages: ["canvas"],
  turbopack: {},
};

export default withPWA(nextConfig);
