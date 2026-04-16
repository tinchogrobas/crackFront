import { SITE_URL, serverFetch } from '@/lib/seo';

export const revalidate = 3600;

const STATIC_ROUTES = [
  { path: '/', priority: 1.0, changeFrequency: 'daily' },
  { path: '/tienda', priority: 0.9, changeFrequency: 'hourly' },
  { path: '/otros-productos', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/contacto', priority: 0.4, changeFrequency: 'yearly' },
];

async function fetchCategoriesSafe() {
  try {
    const data = await serverFetch('/categories/', { revalidateSeconds: 3600 });
    if (!data) return [];
    return Array.isArray(data) ? data : data.results || [];
  } catch {
    return [];
  }
}

async function fetchSitemapProducts() {
  try {
    const data = await serverFetch('/products/sitemap-index/', { revalidateSeconds: 900 });
    if (!Array.isArray(data)) return [];
    return data;
  } catch {
    return [];
  }
}

/**
 * Sitemap dinámico con límite escalable.
 *
 * Next.js soporta hasta 50.000 URLs / 50 MB por sitemap. Si este catálogo
 * crece más allá de eso, migrar a `generateSitemaps()` (sitemap index).
 */
export default async function sitemap() {
  const [products, categories] = await Promise.all([
    fetchSitemapProducts(),
    fetchCategoriesSafe(),
  ]);

  const now = new Date();

  const staticEntries = STATIC_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const categoryEntries = categories
    .filter((c) => c?.slug)
    .map((c) => ({
      url: `${SITE_URL}/tienda?category=${encodeURIComponent(c.slug)}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    }));

  const productEntries = products
    .filter((p) => p?.slug)
    .map((p) => ({
      url: `${SITE_URL}/tienda/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.9,
      ...(p.image_url ? { images: [p.image_url] } : {}),
    }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
