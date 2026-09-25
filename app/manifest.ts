import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Voice of UPSA',
    short_name: 'VOU',
    description: 'The premier student news and campus marketplace platform for UPSA.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#0f172a', // UPSA Navy color (slate-900)
    icons: [
      {
        src: '/pwa-icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/pwa-icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
