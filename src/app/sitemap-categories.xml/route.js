import {
  SITE_URL,
  serverFetch,
  buildUrlEntry,
  wrapUrlset,
  xmlResponseHeaders,
  isSafeSlug,
} from '@/lib/seo';

export const revalidate = 3600;

/**
 * Construye una URL de filtro respetando el orden canónico de params:
 *   category → tcg → condition → certification_entity
 * Ese orden asegura que las URLs del sitemap matcheen con la canonical que emite /tienda.
 */
function buildFilterUrl({ category, tcg, condition, certification_entity }) {
  const qs = new URLSearchParams();
  if (category) qs.set('category', category);
  if (tcg) qs.set('tcg', tcg);
  if (condition) qs.set('condition', condition);
  if (certification_entity) qs.set('certification_entity', certification_entity);
  return `${SITE_URL}/tienda?${qs.toString()}`;
}

async function fetchFacets() {
  try {
    const data = await serverFetch('/products/seo-facets/', { revalidateSeconds: 3600 });
    return data || {};
  } catch {
    return {};
  }
}

export async function GET() {
  const facets = await fetchFacets();
  const now = new Date();
  const entries = [];
  const seen = new Set();

  const push = (url, priority, changefreq = 'daily') => {
    if (seen.has(url)) return;
    seen.add(url);
    entries.push(
      buildUrlEntry({ loc: url, lastmod: now, changefreq, priority }),
    );
  };

  // 1) Categorías sueltas (priority 0.8)
  for (const c of facets.categories || []) {
    if (!isSafeSlug(c.slug)) continue;
    push(buildFilterUrl({ category: c.slug }), 0.8);
  }

  // 2) TCGs sueltos (priority 0.8)
  for (const t of facets.tcgs || []) {
    if (!isSafeSlug(t.slug)) continue;
    push(buildFilterUrl({ tcg: t.slug }), 0.8);
  }

  // 3) Categoría × TCG (priority 0.7) — landing pages tipo "Slabs Pokémon"
  for (const combo of facets.category_tcg || []) {
    if (!isSafeSlug(combo.category_slug) || !isSafeSlug(combo.tcg_slug)) continue;
    push(
      buildFilterUrl({ category: combo.category_slug, tcg: combo.tcg_slug }),
      0.7,
    );
  }

  // 4) Singles × condición × TCG (priority 0.6) — "Singles Pokémon NM"
  for (const s of facets.singles_condition || []) {
    if (!isSafeSlug(s.category_slug) || !isSafeSlug(s.tcg_slug) || !isSafeSlug(s.condition)) continue;
    push(
      buildFilterUrl({
        category: s.category_slug,
        tcg: s.tcg_slug,
        condition: s.condition,
      }),
      0.6,
    );
  }

  // 5) Slabs × certificadora × TCG (priority 0.6) — "Slabs Pokémon PSA"
  for (const s of facets.slabs_cert || []) {
    if (!isSafeSlug(s.category_slug) || !isSafeSlug(s.tcg_slug) || !isSafeSlug(s.cert)) continue;
    push(
      buildFilterUrl({
        category: s.category_slug,
        tcg: s.tcg_slug,
        certification_entity: s.cert,
      }),
      0.6,
    );
  }

  return new Response(wrapUrlset(entries), {
    headers: xmlResponseHeaders({ maxAgeSeconds: 3600 }),
  });
}
