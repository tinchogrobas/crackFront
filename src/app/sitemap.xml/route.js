import {
  SITE_URL,
  buildSitemapEntry,
  wrapSitemapIndex,
  xmlResponseHeaders,
  toW3CDate,
} from '@/lib/seo';

export const revalidate = 3600;

const SHARDS = [
  { path: '/sitemap-static.xml', weight: 'static' },
  { path: '/sitemap-categories.xml', weight: 'categories' },
  { path: '/sitemap-products.xml', weight: 'products' },
];

export async function GET() {
  const lastmod = toW3CDate(new Date());
  const entries = SHARDS.map(({ path }) =>
    buildSitemapEntry({
      loc: `${SITE_URL}${path}`,
      lastmod,
    }),
  );

  return new Response(wrapSitemapIndex(entries), {
    headers: xmlResponseHeaders({ maxAgeSeconds: 3600 }),
  });
}
