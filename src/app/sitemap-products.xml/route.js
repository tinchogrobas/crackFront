import {
  SITE_URL,
  serverFetch,
  buildUrlEntry,
  wrapUrlset,
  xmlResponseHeaders,
  isSafeSlug,
} from '@/lib/seo';

export const revalidate = 900;

const MAX_URLS_PER_SITEMAP = 45000;

async function fetchProducts() {
  try {
    const data = await serverFetch('/products/sitemap-index/', { revalidateSeconds: 900 });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const products = await fetchProducts();

  const entries = products
    .filter((p) => isSafeSlug(p?.slug))
    .slice(0, MAX_URLS_PER_SITEMAP)
    .map((p) =>
      buildUrlEntry({
        loc: `${SITE_URL}/tienda/${p.slug}`,
        lastmod: p.updated_at || new Date(),
        changefreq: 'weekly',
        priority: 0.9,
        images: p.image_url ? [p.image_url] : [],
      }),
    );

  return new Response(wrapUrlset(entries, { withImages: true }), {
    headers: xmlResponseHeaders({ maxAgeSeconds: 900 }),
  });
}
