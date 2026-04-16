import { SITE_URL } from '@/lib/seo';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/tienda', '/tienda/'],
        disallow: [
          '/api/',
          '/admin/',
          '/carrito',
          '/checkout',
          '/checkout/',
          '/_next/',
          '/*?*utm_',
          '/*?*fbclid',
          '/*?*gclid',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/carrito', '/checkout'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/carrito', '/checkout'],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
