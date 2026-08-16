/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Lista blanca explícita. Con `hostname: '**'` el endpoint /_next/image queda
    // como proxy de optimización abierto: cualquiera puede pedir
    // /_next/image?url=<cualquier url>&w=3840 y quemar la cuota de
    // transformaciones (y el CPU) del hosting con imágenes que no son nuestras.
    remotePatterns: [
      // Imágenes de producto subidas desde el admin.
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      // Catálogo TCG en R2. El dominio pub-*.r2.dev es el de desarrollo; cuando
      // se habilite el dominio propio del bucket alcanza con dejar s3.cracktcg.com.
      { protocol: 'https', hostname: 'pub-d526442d1a064e16aac960d195563a3a.r2.dev' },
      { protocol: 'https', hostname: 's3.cracktcg.com' },
    ],

    // El origen ya entrega WebP optimizado (Cloudinary con f_auto,q_auto,c_limit;
    // R2 con WebP q82 pre-generado). Lo único que aporta el optimizador acá es
    // reescalar, así que se acota a lo mínimo para no multiplicar variantes:
    // cada combinación ancho × formato × calidad es una transformación aparte.
    formats: ['image/webp'],
    qualities: [75],
    // El ancho más grande que sirve el backend es 1200 (detalle de producto):
    // generar variantes de 2048 o 3840 es reescalar hacia arriba y pagarlo.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],

    // Las URLs de origen son inmutables: Cloudinary versiona con /v<n>/ y las
    // claves de R2 son el MD5 del archivo. Nunca cambia el contenido detrás de
    // una misma URL, así que no hay razón para re-optimizar cada 60s (el default).
    minimumCacheTTL: 31536000,
  },
  async redirects() {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '')
      : 'https://crackbackend.onrender.com';
    return [
      {
        source: '/admin',
        destination: `${backendUrl}/admin/`,
        permanent: false,
      },
      {
        source: '/wa',
        destination: 'https://wa.me/541150588131',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
