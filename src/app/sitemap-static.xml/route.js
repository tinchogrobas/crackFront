import {
  SITE_URL,
  buildUrlEntry,
  wrapUrlset,
  xmlResponseHeaders,
} from '@/lib/seo';

export const revalidate = 86400;

const STATIC_ROUTES = [
  { path: '/', priority: 1.0, changefreq: 'daily' },
  { path: '/tienda', priority: 0.9, changefreq: 'hourly' },
  { path: '/otros-productos', priority: 0.4, changefreq: 'monthly' },
  { path: '/contacto', priority: 0.3, changefreq: 'yearly' },
];

export async function GET() {
  const now = new Date();
  const entries = STATIC_ROUTES.map((r) =>
    buildUrlEntry({
      loc: `${SITE_URL}${r.path}`,
      lastmod: now,
      changefreq: r.changefreq,
      priority: r.priority,
    }),
  );

  return new Response(wrapUrlset(entries), {
    headers: xmlResponseHeaders({ maxAgeSeconds: 86400 }),
  });
}
