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
 *   category → tcg → condition → certification_entity → has_discount → page
 * Matchea el canonical emitido por /tienda (src/app/tienda/page.js).
 */
function buildFilterUrl({
  category,
  tcg,
  condition,
  certification_entity,
  has_discount,
  page,
}) {
  const qs = new URLSearchParams();
  if (category) qs.set('category', category);
  if (tcg) qs.set('tcg', tcg);
  if (condition) qs.set('condition', condition);
  if (certification_entity) qs.set('certification_entity', certification_entity);
  if (has_discount) qs.set('has_discount', 'true');
  if (page && page > 1) qs.set('page', String(page));
  const query = qs.toString();
  return `${SITE_URL}/tienda${query ? `?${query}` : ''}`;
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

  const push = (url, { priority, lastmod, changefreq = 'daily' } = {}) => {
    if (seen.has(url)) return;
    seen.add(url);
    entries.push(
      buildUrlEntry({
        loc: url,
        lastmod: lastmod || now,
        changefreq,
        priority,
      }),
    );
  };

  /**
   * Emite la URL base + sus páginas 2..N.
   * `pages` proviene del backend (ceil(count / PAGE_SIZE)).
   */
  const pushPaginated = (params, { priority, pages, lastmod, changefreq }) => {
    push(buildFilterUrl(params), { priority, lastmod, changefreq });
    const total = Math.min(pages || 0, 50); // cap defensivo
    for (let p = 2; p <= total; p += 1) {
      // Páginas profundas valen menos — caemos 0.1 y tope en 0.4.
      const pagedPriority = Math.max(0.4, priority - 0.1);
      push(buildFilterUrl({ ...params, page: p }), {
        priority: pagedPriority,
        lastmod,
        changefreq,
      });
    }
  };

  // 0) Base de /tienda paginada — landing principal
  if (facets.tienda_pages) {
    pushPaginated(
      {},
      { priority: 0.9, pages: facets.tienda_pages, lastmod: now, changefreq: 'daily' },
    );
  }

  // 0.5) Ofertas — /tienda?has_discount=true (sin páginas, suele ser listado corto)
  if (facets.has_discount_count && facets.has_discount_count > 0) {
    push(buildFilterUrl({ has_discount: true }), {
      priority: 0.75,
      lastmod: now,
      changefreq: 'daily',
    });
  }

  // 1) Categorías sueltas (priority 0.8)
  for (const c of facets.categories || []) {
    if (!isSafeSlug(c.slug)) continue;
    pushPaginated(
      { category: c.slug },
      {
        priority: 0.8,
        pages: c.pages,
        lastmod: c.max_updated_at || now,
        changefreq: 'daily',
      },
    );
  }

  // 2) TCGs sueltos (priority 0.8)
  for (const t of facets.tcgs || []) {
    if (!isSafeSlug(t.slug)) continue;
    pushPaginated(
      { tcg: t.slug },
      {
        priority: 0.8,
        pages: t.pages,
        lastmod: t.max_updated_at || now,
        changefreq: 'daily',
      },
    );
  }

  // 3) Certificadoras solas cross-TCG (priority 0.65) — "PSA Argentina"
  for (const c of facets.certification_entities || []) {
    if (!isSafeSlug(c.cert)) continue;
    pushPaginated(
      { certification_entity: c.cert },
      {
        priority: 0.65,
        pages: c.pages,
        lastmod: c.max_updated_at || now,
        changefreq: 'weekly',
      },
    );
  }

  // 4) Categoría × TCG (priority 0.7) — "Slabs Pokémon"
  for (const combo of facets.category_tcg || []) {
    if (!isSafeSlug(combo.category_slug) || !isSafeSlug(combo.tcg_slug)) continue;
    pushPaginated(
      { category: combo.category_slug, tcg: combo.tcg_slug },
      {
        priority: 0.7,
        pages: combo.pages,
        lastmod: combo.max_updated_at || now,
        changefreq: 'daily',
      },
    );
  }

  // 5) Singles × condición × TCG (priority 0.6) — "Singles Pokémon NM"
  for (const s of facets.singles_condition || []) {
    if (!isSafeSlug(s.category_slug) || !isSafeSlug(s.tcg_slug) || !isSafeSlug(s.condition)) continue;
    pushPaginated(
      {
        category: s.category_slug,
        tcg: s.tcg_slug,
        condition: s.condition,
      },
      {
        priority: 0.6,
        pages: s.pages,
        lastmod: s.max_updated_at || now,
        changefreq: 'weekly',
      },
    );
  }

  // 6) Singles × condición cross-TCG (priority 0.55) — "Singles NM"
  for (const s of facets.singles_condition_all_tcgs || []) {
    if (!isSafeSlug(s.category_slug) || !isSafeSlug(s.condition)) continue;
    pushPaginated(
      {
        category: s.category_slug,
        condition: s.condition,
      },
      {
        priority: 0.55,
        pages: s.pages,
        lastmod: s.max_updated_at || now,
        changefreq: 'weekly',
      },
    );
  }

  // 7) Slabs × certificadora × TCG (priority 0.6) — "Slabs Pokémon PSA"
  for (const s of facets.slabs_cert || []) {
    if (!isSafeSlug(s.category_slug) || !isSafeSlug(s.tcg_slug) || !isSafeSlug(s.cert)) continue;
    pushPaginated(
      {
        category: s.category_slug,
        tcg: s.tcg_slug,
        certification_entity: s.cert,
      },
      {
        priority: 0.6,
        pages: s.pages,
        lastmod: s.max_updated_at || now,
        changefreq: 'weekly',
      },
    );
  }

  // 8) Slabs × certificadora cross-TCG (priority 0.55) — "Slabs PSA"
  for (const s of facets.slabs_cert_all_tcgs || []) {
    if (!isSafeSlug(s.category_slug) || !isSafeSlug(s.cert)) continue;
    pushPaginated(
      {
        category: s.category_slug,
        certification_entity: s.cert,
      },
      {
        priority: 0.55,
        pages: s.pages,
        lastmod: s.max_updated_at || now,
        changefreq: 'weekly',
      },
    );
  }

  return new Response(wrapUrlset(entries), {
    headers: xmlResponseHeaders({ maxAgeSeconds: 3600 }),
  });
}
