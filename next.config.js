/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-commonjs */
/* eslint-disable @typescript-eslint/no-require-imports */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove eslint config - no longer supported in Next.js 16
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Remove CSP headers here - they're handled by the proxy middleware
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
            value: 'microphone=(), geolocation=()',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'X-Permitted-Cross-Domain-Policies',
            value: 'none',
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
