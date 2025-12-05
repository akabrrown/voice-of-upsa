/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-commonjs */
/* eslint-disable @typescript-eslint/no-require-imports */

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'res.cloudinary.com',
      'localhost',
      '127.0.0.1',
      'voiceofupsa.com',
      'uploads.voiceofupsa.com',
    ],
    remotePatterns: [
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
      };
    }

    return config;
  },
};

// Only enable PWA in production
const isProduction = process.env.NODE_ENV === 'production';
let config = nextConfig;

if (isProduction) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, import/no-commonjs, @typescript-eslint/no-require-imports
  const withPWA = require('@ducanh2912/next-pwa').default({
    dest: 'public',
    disable: false,
    register: true,
    skipWaiting: true,
    cacheOnFrontEndNav: true,
    aggressiveFrontEndNavCaching: true,
    reloadOnOnline: true,
    swcMinify: true,
    fallbacks: {
      document: '/offline',
    },
    workboxOptions: {
      disableDevLogs: true,
      // Use minimal configuration to avoid conflicts
      runtimeCaching: [
        {
          urlPattern: /^https?.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'http-calls',
            networkTimeoutSeconds: 15,
            expiration: {
              maxEntries: 150,
              maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    },
  });
  
  config = withPWA(nextConfig);
}

module.exports = config;
