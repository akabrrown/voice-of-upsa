/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-commonjs */
/* eslint-disable @typescript-eslint/no-require-imports */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security headers and configuration
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // HTTPS and Security Headers
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'microphone=(), geolocation=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
          },
          // Additional Security Headers
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          // Content Security Policy (Production ready with proper sources)
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://fonts.googleapis.com https://va.vercel-scripts.com https://upload-widget.cloudinary.com https://vercel.live blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: https: blob:; font-src 'self' https://fonts.gstatic.com data:; connect-src 'self' https://api.vercel.com https://*.supabase.co https://va.vercel-scripts.com https://api.cloudinary.com https://www.google-analytics.com wss://*.supabase.co; frame-src 'self' https://upload-widget.cloudinary.com https://vercel.live; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';",
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        source: '/_next/static/chunks/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
    ];
  },
  // Update images config to use remotePatterns instead of deprecated domains
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '3000',
      },
      {
        protocol: 'https',
        hostname: 'voiceofupsa.com',
      },
      {
        protocol: 'https',
        hostname: 'uploads.voiceofupsa.com',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Add empty turbopack config to resolve webpack/turbopack conflict
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Apply Node.js module fallbacks for client-side builds
    if (!isServer) {
      // Tell webpack to provide empty modules for Node.js built-ins
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        buffer: false,
        util: false,
        assert: false,
        url: false,
        querystring: false,
        http: false,
        https: false,
        zlib: false,
        events: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
        cluster: false,
        dgram: false,
        readline: false,
        repl: false,
        v8: false,
        vm: false,
        worker_threads: false,
        module: false,
      };
    }

    // Fix for module resolution issues
    config.resolve.alias = {
      ...config.resolve.alias,
      'module': false,
    };

    // Fix workbox build issues
    config.externals = config.externals || [];
    if (!isServer) {
      config.externals.push({
        'workbox-build': 'commonjs workbox-build',
        'workbox-webpack-plugin': 'commonjs workbox-webpack-plugin',
      });
    }

    // Ignore workbox modules that cause issues
    config.ignoreWarnings = [
      {
        module: /workbox/,
        message: /Can't resolve.*module/,
      },
    ];

    return config;
  },
};

// PWA is disabled to fix module resolution issues
// You can re-enable it later by setting NODE_ENV=production

// Temporarily disable PWA completely to fix build issues
// if (process.env.NODE_ENV === 'production') {
//   try {
//     // eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-commonjs, @typescript-eslint/no-require-imports
//     const withPWA = require('@ducanh2912/next-pwa').default({
//       dest: 'public',
//       disable: false,
//       register: true,
//       skipWaiting: true,
//       swcMinify: true,
//       workboxOptions: {
//         disableDevLogs: true,
//         // Use minimal configuration to avoid conflicts
//         runtimeCaching: [
//           {
//             urlPattern: /^https?.*/i,
//             handler: 'NetworkFirst',
//             options: {
//               cacheName: 'http-calls',
//               networkTimeoutSeconds: 15,
//               expiration: {
//                 maxEntries: 150,
//                 maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
//               },
//               cacheableResponse: {
//                 statuses: [0, 200],
//               },
//             },
//           },
//         ],
//       },
//     });
//     
//     config = withPWA(nextConfig);
//   } catch (error) {
//     console.warn('PWA configuration failed, continuing without PWA:', error);
//     // Continue with base config if PWA fails
//   }
// }

export default nextConfig;
