import {
  SITE_URL,
  serverFetch,
  buildUrlEntry,
  wrapUrlset,
  xmlResponseHeaders,
  isSafeSlug,
} from '@/lib/seo';

export const revalidate = 1800;

// Sólo productos con al menos una imagen aparecen acá.
// Google permite hasta 1.000 imágenes por URL; en la práctica cada producto tiene ≤ 3.
const MAX_URLS_PER_SITEMAP = 45000;

async function fetchProducts() {
  try {
    const data = await serverFetch('/products/sitemap-index/', { revalidateSeconds: 1800 });
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function GET() {
  const products = await fetchProducts();

  const entries = products
    .filter((p) => {
      if (!isSafeSlug(p?.slug)) return false;
      const urls = Array.isArray(p.images) ? p.images.filter(Boolean) : [];
      return urls.length > 0;
    })
    .slice(0, MAX_URLS_PER_SITEMAP)
    .map((p) => {
      const urls = p.images.filter(Boolean);
      const title = p.name || '';
      const images = urls.map((url) => (title ? { loc: url, title } : url));
      return buildUrlEntry({
        loc: `${SITE_URL}/tienda/${p.slug}`,
        lastmod: p.updated_at || new Date(),
        images,
      });
    });

  return new Response(wrapUrlset(entries, { withImages: true }), {
    headers: xmlResponseHeaders({ maxAgeSeconds: 1800 }),
  });
}
