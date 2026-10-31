export default function manifest() {
  return { id: '/', name: 'Global Luxury Reporter', short_name: 'GLR', lang: 'en', description: 'Independent reporting on global luxury.', start_url: '/', scope: '/', display: 'standalone', background_color: '#ffffff', theme_color: '#6b0f22', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' }, { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' }] };
}
