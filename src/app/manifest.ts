import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SwiftCart - Fast Groceries',
    short_name: 'SwiftCart',
    description: 'Fresh products delivered in minutes.',
    start_url: '/dashboard/customer',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    icons: [
      {
        src: 'https://placehold.co/192x192/3b82f6/white?text=SC',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: 'https://placehold.co/512x512/3b82f6/white?text=SwiftCart',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
